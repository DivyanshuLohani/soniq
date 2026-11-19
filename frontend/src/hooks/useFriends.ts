import { useEffect, useRef, useState, useCallback } from "react";
import type { FriendItem, PendingFriendRequest, User } from "../types";
import { api } from "../services/api";

export interface LiveFriendActivity {
	userId: string;
	isOnline: boolean;
	activity: {
		userId: string;
		displayName: string;
		avatarUrl?: string;
		isPlaying: boolean;
		currentArtist?: string;
		questionIndex?: number;
		totalQuestions?: number;
		currentScore?: number;
		since: number;
	} | null;
}

export function useFriends(user: User | null) {
	const [friends, setFriends] = useState<FriendItem[]>([]);
	const [pendingReceived, setPendingReceived] = useState<PendingFriendRequest[]>([]);
	const [pendingSent, setPendingSent] = useState<PendingFriendRequest[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
	const [wsConnected, setWsConnected] = useState(false);

	const wsRef = useRef<WebSocket | null>(null);

	const fetchFriends = useCallback(async () => {
		if (!user || user.isGuest) return;
		try {
			setIsLoading(true);
			const data = await api.getFriendsList();
			setFriends(data.friends || []);
			setPendingReceived(data.pendingReceived || []);
			setPendingSent(data.pendingSent || []);
		} catch (e) {
			console.warn("Could not fetch friends", e);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	// Set up WebSocket connection for real-time presence & live playing status
	useEffect(() => {
		if (!user || user.isGuest) {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
			setWsConnected(false);
			return;
		}

		fetchFriends();

		// Construct WebSocket URL
		const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
		const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
		const host =
			typeof window !== "undefined" && import.meta.env.PROD
				? window.location.host
				: "localhost:3001";
		const wsUrl = `${protocol}//${host}/ws/presence?token=${token || ""}`;

		let ws: WebSocket;
		try {
			ws = new WebSocket(wsUrl);
		} catch (e) {
			console.warn("WebSocket init error", e);
			return;
		}
		wsRef.current = ws;

		ws.onopen = () => {
			setWsConnected(true);
		};

		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.type === "FRIENDS_PRESENCE") {
					const friendsPresence: LiveFriendActivity[] = msg.friends || [];
					setFriends((prev) =>
						prev.map((f) => {
							const matched = friendsPresence.find((p) => p.userId === f.friend.id);
							if (matched) {
								return {
									...f,
									isOnline: matched.isOnline,
									isPlaying: !!matched.activity?.isPlaying,
									currentArtist: matched.activity?.currentArtist || null,
									questionIndex: matched.activity?.questionIndex ?? null,
									totalQuestions: matched.activity?.totalQuestions ?? null,
									currentScore: matched.activity?.currentScore ?? null,
									since: matched.activity?.since || null,
								};
							}
							return f;
						}),
					);
				} else if (msg.type === "FRIEND_STATUS_CHANGED") {
					const friendStatus: LiveFriendActivity = msg.friend;
					setFriends((prev) =>
						prev.map((f) => {
							if (f.friend.id === friendStatus.userId) {
								return {
									...f,
									isOnline: friendStatus.isOnline,
									isPlaying: !!friendStatus.activity?.isPlaying,
									currentArtist: friendStatus.activity?.currentArtist || null,
									questionIndex: friendStatus.activity?.questionIndex ?? null,
									totalQuestions: friendStatus.activity?.totalQuestions ?? null,
									currentScore: friendStatus.activity?.currentScore ?? null,
									since: friendStatus.activity?.since || null,
								};
							}
							return f;
						}),
					);
				} else if (msg.type === "FRIEND_REQUEST_RECEIVED") {
					// Real-time friend request received: append to incoming requests list
					const newReq: PendingFriendRequest = msg.request;
					setPendingReceived((prev) => {
						if (prev.some((r) => r.friendshipId === newReq.friendshipId)) return prev;
						return [newReq, ...prev];
					});
				} else if (msg.type === "FRIEND_REQUEST_ACCEPTED") {
					// Real-time notification that sent request was accepted: remove from sent, re-fetch friends
					setPendingSent((prev) =>
						prev.filter((r) => r.friendshipId !== msg.friendshipId),
					);
					fetchFriends();
				} else if (msg.type === "FRIENDSHIP_REMOVED") {
					// Friendship declined or removed: update local state
					setFriends((prev) =>
						prev.filter((f) => f.friendshipId !== msg.friendshipId),
					);
					setPendingReceived((prev) =>
						prev.filter((r) => r.friendshipId !== msg.friendshipId),
					);
					setPendingSent((prev) =>
						prev.filter((r) => r.friendshipId !== msg.friendshipId),
					);
				}
			} catch (err) {
				console.warn("WS message parse error", err);
			}
		};

		ws.onclose = () => {
			setWsConnected(false);
		};

		// Heartbeat ping every 25 seconds
		const pingInterval = setInterval(() => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: "PING" }));
			}
		}, 25000);

		return () => {
			clearInterval(pingInterval);
			ws.close();
			wsRef.current = null;
		};
	}, [user, fetchFriends]);

	// Broadcast user activity (e.g. started playing quiz or question progressed)
	const broadcastActivity = useCallback(
		(activity: {
			isPlaying: boolean;
			currentArtist?: string;
			questionIndex?: number;
			totalQuestions?: number;
			currentScore?: number;
		}) => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.send(
					JSON.stringify({
						type: "ACTIVITY_UPDATE",
						...activity,
					}),
				);
			}
		},
		[],
	);

	const sendFriendRequest = async (targetUserId: string) => {
		const res = await api.sendFriendRequest(targetUserId);
		await fetchFriends();
		return res;
	};

	const acceptFriendRequest = async (friendshipId: string) => {
		const res = await api.acceptFriendRequest(friendshipId);
		await fetchFriends();
		return res;
	};

	const declineFriendRequest = async (friendshipId: string) => {
		const res = await api.declineFriendRequest(friendshipId);
		await fetchFriends();
		return res;
	};

	const removeFriend = async (friendshipId: string) => {
		const res = await api.removeFriend(friendshipId);
		await fetchFriends();
		return res;
	};

	const onlineFriendsCount = friends.filter((f) => f.isOnline).length;
	const playingFriendsCount = friends.filter((f) => f.isPlaying).length;

	return {
		friends,
		pendingReceived,
		pendingSent,
		isLoading,
		isFriendsModalOpen,
		setIsFriendsModalOpen,
		wsConnected,
		onlineFriendsCount,
		playingFriendsCount,
		fetchFriends,
		broadcastActivity,
		sendFriendRequest,
		acceptFriendRequest,
		declineFriendRequest,
		removeFriend,
	};
}
