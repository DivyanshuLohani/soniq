import { type Request, type Response, Router } from "express";
import logger from "../lib/logger";
import prisma from "../lib/prisma";
import { optionalAuth, requireAuth } from "../middleware/auth";
import {
	getLiveSessionsList,
	notifyFriendRequestAccepted,
	notifyFriendRequestSent,
	notifyFriendshipRemoved,
	notifyFriendsPresenceUpdate,
} from "../services/presenceService";

const router = Router();

// Apply auth middleware to all friends endpoints
router.use(optionalAuth, requireAuth);

// Search users to add as friend (by displayName or email)
router.get("/search", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;
	const q = ((req.query.q as string) || "").trim();

	if (!q || q.length < 2) {
		return res.json({ users: [] });
	}

	try {
		const users = await prisma.user.findMany({
			where: {
				AND: [
					{ id: { not: currentUserId } },
					{ role: "USER" },
					{ showInSearch: true },
					{
						OR: [{ displayName: { contains: q, mode: "insensitive" } }],
					},
				],
			},
			select: {
				id: true,
				displayName: true,
				avatarUrl: true,
				spotifyProduct: true,
			},
			take: 10,
		});

		// Fetch existing friendship statuses between current user and these found users
		const targetIds = users.map((u) => u.id);
		const existingFriendships = await prisma.friendship.findMany({
			where: {
				OR: [
					{ senderId: currentUserId, receiverId: { in: targetIds } },
					{ senderId: { in: targetIds }, receiverId: currentUserId },
				],
			},
		});

		const results = users.map((u) => {
			const friendship = existingFriendships.find(
				(f) =>
					(f.senderId === currentUserId && f.receiverId === u.id) ||
					(f.senderId === u.id && f.receiverId === currentUserId),
			);

			let relationship:
				| "NONE"
				| "FRIENDS"
				| "REQUEST_SENT"
				| "REQUEST_RECEIVED" = "NONE";
			if (friendship) {
				if (friendship.status === "ACCEPTED") {
					relationship = "FRIENDS";
				} else if (friendship.status === "PENDING") {
					relationship =
						friendship.senderId === currentUserId
							? "REQUEST_SENT"
							: "REQUEST_RECEIVED";
				}
			}

			return {
				...u,
				relationship,
				friendshipId: friendship?.id,
			};
		});

		res.json({ users: results });
	} catch (err: any) {
		logger.error("Error searching users for friends", { error: err.message });
		res.status(500).json({ error: "Failed to search users" });
	}
});

// Get Friends List + Pending Incoming/Outgoing Requests + Live playing status
router.get("/list", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;

	try {
		const friendships = await prisma.friendship.findMany({
			where: {
				OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
			},
			include: {
				sender: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true,
						spotifyProduct: true,
					},
				},
				receiver: {
					select: {
						id: true,
						displayName: true,
						avatarUrl: true,
						spotifyProduct: true,
					},
				},
			},
			orderBy: { updatedAt: "desc" },
		});

		const liveMap = getLiveSessionsList();

		const friends: any[] = [];
		const pendingReceived: any[] = [];
		const pendingSent: any[] = [];

		for (const f of friendships) {
			const isSender = f.senderId === currentUserId;
			const friendUser = isSender ? f.receiver : f.sender;

			if (f.status === "ACCEPTED") {
				const liveInfo = liveMap.get(friendUser.id);
				friends.push({
					friendshipId: f.id,
					friend: friendUser,
					isOnline: !!liveInfo,
					isPlaying: !!liveInfo?.isPlaying,
					currentArtist: liveInfo?.currentArtist || null,
					questionIndex: liveInfo?.questionIndex ?? null,
					totalQuestions: liveInfo?.totalQuestions ?? null,
					currentScore: liveInfo?.currentScore ?? null,
					since: liveInfo?.since || null,
				});
			} else if (f.status === "PENDING") {
				if (isSender) {
					pendingSent.push({
						friendshipId: f.id,
						user: friendUser,
						createdAt: f.createdAt,
					});
				} else {
					pendingReceived.push({
						friendshipId: f.id,
						user: friendUser,
						createdAt: f.createdAt,
					});
				}
			}
		}

		res.json({
			friends,
			pendingReceived,
			pendingSent,
		});
	} catch (err: any) {
		logger.error("Error fetching friends list", {
			error: err.message,
			userId: currentUserId,
		});
		res.status(500).json({ error: "Failed to retrieve friends" });
	}
});

// Send Friend Request
router.post("/request", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;
	const { targetUserId } = req.body;

	if (!targetUserId || typeof targetUserId !== "string") {
		return res.status(400).json({ error: "targetUserId is required" });
	}

	if (targetUserId === currentUserId) {
		return res
			.status(400)
			.json({ error: "Cannot send friend request to yourself" });
	}

	try {
		const targetUser = await prisma.user.findUnique({
			where: { id: targetUserId },
		});

		if (!targetUser) {
			return res.status(404).json({ error: "Target user not found" });
		}

		// Check if relation already exists
		const existing = await prisma.friendship.findFirst({
			where: {
				OR: [
					{ senderId: currentUserId, receiverId: targetUserId },
					{ senderId: targetUserId, receiverId: currentUserId },
				],
			},
		});

		if (existing) {
			if (existing.status === "ACCEPTED") {
				return res
					.status(400)
					.json({ error: "You are already friends with this user" });
			}
			if (existing.status === "PENDING") {
				if (existing.senderId === currentUserId) {
					return res
						.status(400)
						.json({ error: "Friend request is already pending" });
				}
				// If target already sent a request to current user, auto-accept it!
				const updated = await prisma.friendship.update({
					where: { id: existing.id },
					data: { status: "ACCEPTED" },
				});
				notifyFriendsPresenceUpdate(currentUserId);
				notifyFriendsPresenceUpdate(targetUserId);
				notifyFriendRequestAccepted({
					senderId: targetUserId,
					friendshipId: existing.id,
					receiver: {
						id: req.user!.id,
						displayName: req.user!.displayName,
						avatarUrl: req.user!.avatarUrl,
					},
				});
				return res.json({
					success: true,
					friendship: updated,
					autoAccepted: true,
				});
			}
			// Reset if was previously declined
			const updated = await prisma.friendship.update({
				where: { id: existing.id },
				data: {
					senderId: currentUserId,
					receiverId: targetUserId,
					status: "PENDING",
				},
			});
			notifyFriendRequestSent({
				receiverId: targetUserId,
				friendshipId: existing.id,
				sender: {
					id: req.user!.id,
					displayName: req.user!.displayName,
					avatarUrl: req.user!.avatarUrl,
				},
			});
			return res.json({ success: true, friendship: updated });
		}

		const created = await prisma.friendship.create({
			data: {
				senderId: currentUserId,
				receiverId: targetUserId,
				status: "PENDING",
			},
		});

		notifyFriendRequestSent({
			receiverId: targetUserId,
			friendshipId: created.id,
			sender: {
				id: req.user!.id,
				displayName: req.user!.displayName,
				avatarUrl: req.user!.avatarUrl,
			},
		});

		res.json({ success: true, friendship: created });
	} catch (err: any) {
		logger.error("Error creating friend request", {
			error: err.message,
			currentUserId,
			targetUserId,
		});
		res.status(500).json({ error: "Failed to send friend request" });
	}
});

// Accept Friend Request
router.post("/accept", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;
	const { friendshipId } = req.body;

	if (!friendshipId) {
		return res.status(400).json({ error: "friendshipId is required" });
	}

	try {
		const friendship = await prisma.friendship.findUnique({
			where: { id: friendshipId },
		});

		if (!friendship || friendship.receiverId !== currentUserId) {
			return res
				.status(404)
				.json({ error: "Friend request not found or not addressed to you" });
		}

		const updated = await prisma.friendship.update({
			where: { id: friendshipId },
			data: { status: "ACCEPTED" },
		});

		notifyFriendsPresenceUpdate(currentUserId);
		notifyFriendsPresenceUpdate(friendship.senderId);
		notifyFriendRequestAccepted({
			senderId: friendship.senderId,
			friendshipId,
			receiver: {
				id: req.user!.id,
				displayName: req.user!.displayName,
				avatarUrl: req.user!.avatarUrl,
			},
		});

		res.json({ success: true, friendship: updated });
	} catch (err: any) {
		logger.error("Error accepting friend request", { error: err.message });
		res.status(500).json({ error: "Failed to accept friend request" });
	}
});

// Decline or Cancel Friend Request
router.post("/decline", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;
	const { friendshipId } = req.body;

	if (!friendshipId) {
		return res.status(400).json({ error: "friendshipId is required" });
	}

	try {
		const friendship = await prisma.friendship.findUnique({
			where: { id: friendshipId },
		});

		if (
			!friendship ||
			(friendship.receiverId !== currentUserId &&
				friendship.senderId !== currentUserId)
		) {
			return res.status(404).json({ error: "Friendship not found" });
		}

		await prisma.friendship.delete({
			where: { id: friendshipId },
		});

		const otherUserId =
			friendship.receiverId === currentUserId
				? friendship.senderId
				: friendship.receiverId;
		notifyFriendshipRemoved({
			targetUserId: otherUserId,
			friendshipId,
			removedByUserId: currentUserId,
		});

		res.json({ success: true });
	} catch (err: any) {
		logger.error("Error declining/cancelling friend request", {
			error: err.message,
		});
		res.status(500).json({ error: "Failed to remove friend request" });
	}
});

// Remove Existing Friend
router.post("/remove", async (req: Request, res: Response) => {
	const currentUserId = req.user!.id;
	const { friendshipId } = req.body;

	if (!friendshipId) {
		return res.status(400).json({ error: "friendshipId is required" });
	}

	try {
		const friendship = await prisma.friendship.findUnique({
			where: { id: friendshipId },
		});

		if (
			!friendship ||
			(friendship.receiverId !== currentUserId &&
				friendship.senderId !== currentUserId)
		) {
			return res.status(404).json({ error: "Friendship not found" });
		}

		await prisma.friendship.delete({
			where: { id: friendshipId },
		});

		const otherUserId =
			friendship.receiverId === currentUserId
				? friendship.senderId
				: friendship.receiverId;
		notifyFriendshipRemoved({
			targetUserId: otherUserId,
			friendshipId,
			removedByUserId: currentUserId,
		});

		res.json({ success: true });
	} catch (err: any) {
		logger.error("Error removing friend", { error: err.message });
		res.status(500).json({ error: "Failed to remove friend" });
	}
});

export default router;
