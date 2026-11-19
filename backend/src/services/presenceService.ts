import type { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import type { AuthenticatedUser } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "soniq-super-secret-jwt-key-2025";

export interface LiveActivity {
	userId: string;
	displayName: string;
	avatarUrl?: string;
	isPlaying: boolean;
	currentArtist?: string;
	questionIndex?: number;
	totalQuestions?: number;
	currentScore?: number;
	since: number;
}

interface ClientConnection {
	ws: WebSocket;
	user: AuthenticatedUser;
	activity: LiveActivity;
}

// Map from userId to set of ClientConnections (supporting multiple tabs/devices)
const clients = new Map<string, Set<ClientConnection>>();

// WebSocket Server instance reference
let wss: WebSocketServer | null = null;

export function setupPresenceWebSocketServer(server: HTTPServer) {
	wss = new WebSocketServer({ server, path: "/ws/presence" });

	wss.on("connection", async (ws: WebSocket, req) => {
		try {
			// Extract token from query params ?token=... or Cookie
			const url = new URL(req.url || "", `http://${req.headers.host}`);
			let token: string | null = url.searchParams.get("token");

			if (!token && req.headers.cookie) {
				const cookieMatch = req.headers.cookie.match(/auth_token=([^;]+)/);
				if (cookieMatch && cookieMatch[1]) {
					token = cookieMatch[1];
				}
			}

			if (!token) {
				ws.close(4001, "Authentication token required");
				return;
			}

			let decoded: AuthenticatedUser;
			try {
				decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
			} catch {
				ws.close(4002, "Invalid or expired token");
				return;
			}

			if (!decoded || !decoded.id) {
				ws.close(4003, "Invalid user payload");
				return;
			}

			// Initial live activity
			const clientConn: ClientConnection = {
				ws,
				user: decoded,
				activity: {
					userId: decoded.id,
					displayName: decoded.displayName,
					avatarUrl: decoded.avatarUrl || undefined,
					isPlaying: false,
					since: Date.now(),
				},
			};

			if (!clients.has(decoded.id)) {
				clients.set(decoded.id, new Set());
			}
			clients.get(decoded.id)!.add(clientConn);

			// Send welcome packet with current friends presence
			await sendFriendsPresence(clientConn);

			// Notify this user's online friends that user is online
			notifyFriendsPresenceUpdate(decoded.id);

			// Handle incoming messages from client (e.g. heartbeat or quiz progress updates)
			ws.on("message", (raw) => {
				try {
					const data = JSON.parse(raw.toString());
					if (data.type === "ACTIVITY_UPDATE") {
						clientConn.activity = {
							...clientConn.activity,
							isPlaying: !!data.isPlaying,
							currentArtist: data.currentArtist,
							questionIndex: data.questionIndex,
							totalQuestions: data.totalQuestions,
							currentScore: data.currentScore,
						};
						notifyFriendsPresenceUpdate(decoded.id);
					} else if (data.type === "PING") {
						ws.send(JSON.stringify({ type: "PONG" }));
					}
				} catch (e) {
					// Invalid JSON, ignore
				}
			});

			ws.on("close", () => {
				const userClients = clients.get(decoded.id);
				if (userClients) {
					userClients.delete(clientConn);
					if (userClients.size === 0) {
						clients.delete(decoded.id);
						// User completely disconnected, broadcast to friends
						notifyFriendsPresenceUpdate(decoded.id);
					}
				}
			});

			ws.on("error", (err) => {
				logger.warn("WebSocket client error", { userId: decoded.id, error: err.message });
			});
		} catch (err: any) {
			logger.error("Error setting up presence ws client", { error: err.message });
			ws.close(1011, "Internal server error");
		}
	});

	logger.info("Presence WebSocket server initialized on /ws/presence");
}

/**
 * Returns a map of all currently connected online users and their active quiz activity
 */
export function getLiveSessionsList(): Map<string, LiveActivity> {
	const result = new Map<string, LiveActivity>();
	for (const [userId, conns] of clients.entries()) {
		// Pick the most active connection if multiple tabs open
		let active: LiveActivity | null = null;
		for (const c of conns) {
			if (!active || c.activity.isPlaying) {
				active = c.activity;
			}
		}
		if (active) {
			result.set(userId, active);
		}
	}
	return result;
}

/**
 * Fetches accepted friends for a user and returns their presence status
 */
async function getFriendsPresenceData(userId: string) {
	const friendships = await prisma.friendship.findMany({
		where: {
			AND: [
				{ status: "ACCEPTED" },
				{ OR: [{ senderId: userId }, { receiverId: userId }] },
			],
		},
		select: {
			id: true,
			senderId: true,
			receiverId: true,
		},
	});

	const friendIds = friendships.map((f) =>
		f.senderId === userId ? f.receiverId : f.senderId,
	);

	const liveMap = getLiveSessionsList();
	return friendIds.map((fId) => {
		const live = liveMap.get(fId);
		return {
			userId: fId,
			isOnline: !!live,
			activity: live || null,
		};
	});
}

/**
 * Sends current friends presence payload to a specific client connection
 */
async function sendFriendsPresence(clientConn: ClientConnection) {
	if (clientConn.ws.readyState !== WebSocket.OPEN) return;
	try {
		const friendsPresence = await getFriendsPresenceData(clientConn.user.id);
		clientConn.ws.send(
			JSON.stringify({
				type: "FRIENDS_PRESENCE",
				friends: friendsPresence,
			}),
		);
	} catch (e: any) {
		logger.warn("Could not send initial friends presence", { error: e.message });
	}
}

/**
 * Notifies all online friends of `userId` that their friend's status has changed
 */
export async function notifyFriendsPresenceUpdate(userId: string) {
	try {
		// Find accepted friends of this user
		const friendships = await prisma.friendship.findMany({
			where: {
				AND: [
					{ status: "ACCEPTED" },
					{ OR: [{ senderId: userId }, { receiverId: userId }] },
				],
			},
			select: {
				senderId: true,
				receiverId: true,
			},
		});

		const liveMap = getLiveSessionsList();
		const userActivity = liveMap.get(userId) || null;

		const payload = JSON.stringify({
			type: "FRIEND_STATUS_CHANGED",
			friend: {
				userId,
				isOnline: !!userActivity,
				activity: userActivity,
			},
		});

		for (const f of friendships) {
			const friendId = f.senderId === userId ? f.receiverId : f.senderId;
			const friendConns = clients.get(friendId);
			if (friendConns) {
				for (const conn of friendConns) {
					if (conn.ws.readyState === WebSocket.OPEN) {
						conn.ws.send(payload);
					}
				}
			}
		}
	} catch (err: any) {
		logger.warn("Could not notify friends presence update", { userId, error: err.message });
	}
}

/**
 * Sends a directed WebSocket event to all open connections of a user
 */
export function sendEventToUser(userId: string, eventPayload: any) {
	const userConns = clients.get(userId);
	if (!userConns || userConns.size === 0) return;

	const msg = JSON.stringify(eventPayload);
	for (const conn of userConns) {
		if (conn.ws.readyState === WebSocket.OPEN) {
			conn.ws.send(msg);
		}
	}
}

/**
 * Notifies recipient that a friend request was sent
 */
export function notifyFriendRequestSent(params: {
	receiverId: string;
	friendshipId: string;
	sender: {
		id: string;
		displayName: string;
		avatarUrl?: string | null;
	};
}) {
	sendEventToUser(params.receiverId, {
		type: "FRIEND_REQUEST_RECEIVED",
		request: {
			friendshipId: params.friendshipId,
			user: params.sender,
			createdAt: new Date().toISOString(),
		},
	});
}

/**
 * Notifies sender that their friend request was accepted
 */
export function notifyFriendRequestAccepted(params: {
	senderId: string;
	friendshipId: string;
	receiver: {
		id: string;
		displayName: string;
		avatarUrl?: string | null;
	};
}) {
	sendEventToUser(params.senderId, {
		type: "FRIEND_REQUEST_ACCEPTED",
		friendshipId: params.friendshipId,
		friend: params.receiver,
	});
}

/**
 * Notifies peer that a friendship or pending request was declined or removed
 */
export function notifyFriendshipRemoved(params: {
	targetUserId: string;
	friendshipId: string;
	removedByUserId: string;
}) {
	sendEventToUser(params.targetUserId, {
		type: "FRIENDSHIP_REMOVED",
		friendshipId: params.friendshipId,
		removedByUserId: params.removedByUserId,
	});
}

