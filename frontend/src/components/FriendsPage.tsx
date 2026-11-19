import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Users,
	UserPlus,
	Search,
	Check,
	Clock,
	Gamepad2,
	UserMinus,
	Loader2,
	Radio,
	Sparkles,
} from "lucide-react";
import type { FriendItem, PendingFriendRequest, User, UserSearchResult } from "../types";
import { api } from "../services/api";
import { sounds } from "../utils/audioSynth";

interface FriendsPageProps {
	user: User | null;
	friends: FriendItem[];
	pendingReceived: PendingFriendRequest[];
	pendingSent: PendingFriendRequest[];
	isLoading: boolean;
	onSendRequest: (targetUserId: string) => Promise<any>;
	onAcceptRequest: (friendshipId: string) => Promise<any>;
	onDeclineRequest: (friendshipId: string) => Promise<any>;
	onRemoveFriend: (friendshipId: string) => Promise<any>;
	onPlayWithArtist?: (artistName: string) => void;
	onOpenAuthModal?: () => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({
	user,
	friends,
	pendingReceived,
	pendingSent,
	isLoading,
	onSendRequest,
	onAcceptRequest,
	onDeclineRequest,
	onRemoveFriend,
	onPlayWithArtist,
	onOpenAuthModal,
}) => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<"friends" | "requests" | "add">("friends");
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [actionPendingId, setActionPendingId] = useState<string | null>(null);

	// Search users debounced
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) {
			setSearchResults([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await api.searchUsers(searchQuery.trim());
				setSearchResults(results);
			} catch (e) {
				console.warn("User search error", e);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// If user is guest or not signed in
	if (!user || user.isGuest) {
		return (
			<div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-4">
				<Link
					to="/"
					onClick={() => sounds.playClick()}
					className="text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] inline-flex items-center gap-1.5 mb-4"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					<span>Back to Home</span>
				</Link>

				<div className="w-14 h-14 rounded-2xl bg-[#12131A] border border-white/[0.08] flex items-center justify-center mx-auto text-[#B49BFF]">
					<Users className="w-7 h-7" />
				</div>

				<h1 className="text-xl sm:text-2xl font-bold text-[#F4F4F7]">
					Sign in to connect with Friends
				</h1>
				<p className="text-xs sm:text-sm text-[#8E8E9F] max-w-md mx-auto">
					See who is playing music quizzes in real-time, jump into their games, and challenge your friends.
				</p>

				<div className="pt-2">
					<button
						onClick={() => {
							sounds.playClick();
							onOpenAuthModal?.();
						}}
						className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 transition-opacity"
					>
						Sign In or Register
					</button>
				</div>
			</div>
		);
	}

	const handleSend = async (targetUserId: string) => {
		sounds.playClick();
		setActionPendingId(targetUserId);
		try {
			await onSendRequest(targetUserId);
			setSearchResults((prev) =>
				prev.map((u) =>
					u.id === targetUserId ? { ...u, relationship: "REQUEST_SENT" } : u,
				),
			);
		} finally {
			setActionPendingId(null);
		}
	};

	const handleAccept = async (friendshipId: string) => {
		sounds.playClick();
		setActionPendingId(friendshipId);
		try {
			await onAcceptRequest(friendshipId);
		} finally {
			setActionPendingId(null);
		}
	};

	const handleDecline = async (friendshipId: string) => {
		sounds.playClick();
		setActionPendingId(friendshipId);
		try {
			await onDeclineRequest(friendshipId);
		} finally {
			setActionPendingId(null);
		}
	};

	const handleRemove = async (friendshipId: string) => {
		if (!window.confirm("Remove this friend?")) return;
		sounds.playClick();
		setActionPendingId(friendshipId);
		try {
			await onRemoveFriend(friendshipId);
		} finally {
			setActionPendingId(null);
		}
	};

	const onlineFriends = friends.filter((f) => f.isOnline);
	const offlineFriends = friends.filter((f) => !f.isOnline);

	return (
		<div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
			{/* Top Navigation / Breadcrumb */}
			<div className="flex items-center justify-between">
				<Link
					to="/"
					onClick={() => sounds.playClick()}
					className="text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] inline-flex items-center gap-1.5 transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					<span>Back to Home</span>
				</Link>

				<span className="text-[11px] font-mono text-[#8E8E9F] flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
					<span>{onlineFriends.length} online</span>
				</span>
			</div>

			{/* Page Header */}
			<div className="border-b border-white/[0.08] pb-5 space-y-1">
				<div className="flex items-center gap-2">
					<Users className="w-5 h-5 text-[#B49BFF]" />
					<h1 className="text-xl sm:text-2xl font-bold text-[#F4F4F7]">
						Friends & Social
					</h1>
				</div>
				<p className="text-xs sm:text-sm text-[#8E8E9F]">
					See who is playing right now in real-time and jump into identical trivia challenges.
				</p>
			</div>

			{/* Mode / Tabs Switcher */}
			<div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
				<button
					onClick={() => {
						sounds.playClick();
						setActiveTab("friends");
					}}
					className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
						activeTab === "friends"
							? "border-[#D4FF32] text-[#D4FF32]"
							: "border-transparent text-[#8E8E9F] hover:text-[#F4F4F7]"
					}`}
				>
					<Users className="w-4 h-4" />
					<span>Friends ({friends.length})</span>
				</button>

				<button
					onClick={() => {
						sounds.playClick();
						setActiveTab("requests");
					}}
					className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 relative ${
						activeTab === "requests"
							? "border-[#D4FF32] text-[#D4FF32]"
							: "border-transparent text-[#8E8E9F] hover:text-[#F4F4F7]"
					}`}
				>
					<Clock className="w-4 h-4" />
					<span>Requests</span>
					{pendingReceived.length > 0 && (
						<span className="w-4 h-4 rounded-full bg-[#FF4694] text-white text-[10px] font-bold flex items-center justify-center ml-1">
							{pendingReceived.length}
						</span>
					)}
				</button>

				<button
					onClick={() => {
						sounds.playClick();
						setActiveTab("add");
					}}
					className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
						activeTab === "add"
							? "border-[#D4FF32] text-[#D4FF32]"
							: "border-transparent text-[#8E8E9F] hover:text-[#F4F4F7]"
					}`}
				>
					<UserPlus className="w-4 h-4" />
					<span>Find People</span>
				</button>
			</div>

			{/* Tab 1: Friends List */}
			{activeTab === "friends" && (
				<div className="space-y-6">
					{friends.length === 0 ? (
						<div className="py-16 text-center space-y-3 bg-[#0D0D11] border border-white/[0.06] rounded-2xl p-6">
							<Users className="w-10 h-10 mx-auto text-[#8E8E9F]/40" />
							<div className="space-y-1">
								<h3 className="text-sm font-semibold text-[#F4F4F7]">
									No friends added yet
								</h3>
								<p className="text-xs text-[#8E8E9F] max-w-sm mx-auto">
									Find other players by their username or email to see when they are online and playing quizzes!
								</p>
							</div>
							<button
								onClick={() => {
									sounds.playClick();
									setActiveTab("add");
								}}
								className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 transition-opacity"
							>
								Find Players to Add
							</button>
						</div>
					) : (
						<>
							{/* Online Friends Section */}
							{onlineFriends.length > 0 && (
								<div className="space-y-3">
									<div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
										<span className="text-xs font-medium text-[#8E8E9F] tracking-wider uppercase">
											Online ({onlineFriends.length})
										</span>
										<span className="text-[11px] text-[#8E8E9F]">Live</span>
									</div>

									<div className="space-y-2">
										{onlineFriends.map((f) => (
											<div
												key={f.friendshipId}
												className="bg-[#0D0D11] hover:bg-[#12131A] border border-white/[0.06] rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors group"
											>
												<div className="flex items-center gap-3 min-w-0">
													<div className="relative shrink-0">
														<img
															src={
																f.friend.avatarUrl ||
																`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.friend.displayName)}`
															}
															alt={f.friend.displayName}
															className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover bg-black/40 border border-white/10"
														/>
														<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0D0D11]" />
													</div>
													<div className="min-w-0">
														<h4 className="font-medium text-xs sm:text-sm text-[#F4F4F7] truncate">
															{f.friend.displayName}
														</h4>

														{f.isPlaying ? (
															<div className="flex items-center gap-1.5 text-[11px] text-[#D4FF32] mt-0.5">
																<Radio className="w-3 h-3 animate-pulse text-[#D4FF32] shrink-0" />
																<span className="truncate">
																	Playing{" "}
																	<strong className="font-semibold text-white">
																		{f.currentArtist || "Music Quiz"}
																	</strong>{" "}
																	({(f.questionIndex ?? 0) + 1}/
																	{f.totalQuestions || 10})
																</span>
															</div>
														) : (
															<p className="text-[11px] text-[#8E8E9F]">
																Online in lobby
															</p>
														)}
													</div>
												</div>

												<div className="flex items-center gap-2 shrink-0">
													{f.isPlaying && f.currentArtist && onPlayWithArtist && (
														<button
															onClick={() => {
																sounds.playClick();
																onPlayWithArtist(f.currentArtist!);
															}}
															title={`Play ${f.currentArtist} quiz too!`}
															className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 flex items-center gap-1.5 transition-opacity"
														>
															<Gamepad2 className="w-3.5 h-3.5" />
															<span>Join</span>
														</button>
													)}
													<button
														onClick={() => handleRemove(f.friendshipId)}
														title="Remove friend"
														className="p-1.5 rounded-lg text-[#8E8E9F] hover:text-[#FF4694] hover:bg-white/[0.04] transition-colors"
													>
														<UserMinus className="w-4 h-4" />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Offline Friends Section */}
							{offlineFriends.length > 0 && (
								<div className="space-y-3 pt-2">
									<div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
										<span className="text-xs font-medium text-[#8E8E9F] tracking-wider uppercase">
											Offline ({offlineFriends.length})
										</span>
									</div>

									<div className="space-y-1.5">
										{offlineFriends.map((f) => (
											<div
												key={f.friendshipId}
												className="bg-[#0D0D11]/60 border border-white/[0.04] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 opacity-75 hover:opacity-100 transition-opacity"
											>
												<div className="flex items-center gap-2.5 min-w-0">
													<div className="relative shrink-0">
														<img
															src={
																f.friend.avatarUrl ||
																`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.friend.displayName)}`
															}
															alt={f.friend.displayName}
															className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-black/40 grayscale"
														/>
														<span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-neutral-600 ring-2 ring-[#0D0D11]" />
													</div>
													<div className="min-w-0">
														<h4 className="font-medium text-xs sm:text-sm text-[#F4F4F7] truncate">
															{f.friend.displayName}
														</h4>
														<p className="text-[10px] text-[#8E8E9F]">
															Offline
														</p>
													</div>
												</div>

												<button
													onClick={() => handleRemove(f.friendshipId)}
													title="Remove friend"
													className="p-1.5 text-[#8E8E9F] hover:text-[#FF4694] transition-colors"
												>
													<UserMinus className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* Tab 2: Requests */}
			{activeTab === "requests" && (
				<div className="space-y-6">
					{/* Received Requests */}
					<div className="space-y-3">
						<span className="text-xs font-medium text-[#8E8E9F] uppercase tracking-wider">
							Incoming Friend Requests ({pendingReceived.length})
						</span>

						{pendingReceived.length === 0 ? (
							<div className="bg-[#0D0D11] border border-white/[0.06] rounded-xl p-4 text-center text-xs text-[#8E8E9F]">
								No pending incoming requests.
							</div>
						) : (
							<div className="space-y-2">
								{pendingReceived.map((req) => (
									<div
										key={req.friendshipId}
										className="bg-[#0D0D11] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-3"
									>
										<div className="flex items-center gap-3 min-w-0">
											<img
												src={
													req.user.avatarUrl ||
													`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.displayName)}`
												}
												alt={req.user.displayName}
												className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
											/>
											<div className="min-w-0">
												<h4 className="font-medium text-xs sm:text-sm text-[#F4F4F7] truncate">
													{req.user.displayName}
												</h4>
												<p className="text-[10px] text-[#8E8E9F]">
													Sent you a friend request
												</p>
											</div>
										</div>

										<div className="flex items-center gap-1.5 shrink-0">
											<button
												onClick={() => handleAccept(req.friendshipId)}
												disabled={actionPendingId === req.friendshipId}
												className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 flex items-center gap-1 transition-opacity"
											>
												<Check className="w-3.5 h-3.5" />
												<span>Accept</span>
											</button>
											<button
												onClick={() => handleDecline(req.friendshipId)}
												disabled={actionPendingId === req.friendshipId}
												className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8E8E9F] hover:text-[#FF4694] hover:bg-white/[0.04] transition-colors"
											>
												Decline
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Sent Requests */}
					{pendingSent.length > 0 && (
						<div className="space-y-3 pt-4 border-t border-white/[0.06]">
							<span className="text-xs font-medium text-[#8E8E9F] uppercase tracking-wider">
								Sent Requests ({pendingSent.length})
							</span>
							<div className="space-y-1.5">
								{pendingSent.map((req) => (
									<div
										key={req.friendshipId}
										className="bg-[#0D0D11]/60 border border-white/[0.04] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3"
									>
										<div className="flex items-center gap-2.5 min-w-0">
											<img
												src={
													req.user.avatarUrl ||
													`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.displayName)}`
												}
												alt={req.user.displayName}
												className="w-8 h-8 rounded-full object-cover"
											/>
											<span className="text-xs sm:text-sm text-[#F4F4F7] truncate">
												{req.user.displayName}
											</span>
										</div>
										<span className="text-[11px] text-[#8E8E9F] italic">
											Pending confirmation
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Tab 3: Find People */}
			{activeTab === "add" && (
				<div className="space-y-4">
					{/* Search input */}
					<div className="relative flex items-center bg-[#0D0D11] border border-white/[0.08] rounded-xl focus-within:border-white/20 transition-colors">
						<Search className="w-4 h-4 text-[#8E8E9F] ml-3.5" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search players by username or email..."
							className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm text-[#F4F4F7] placeholder-[#8E8E9F] focus:outline-none"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="pr-3.5 text-xs text-[#8E8E9F] hover:text-[#F4F4F7]"
							>
								Clear
							</button>
						)}
					</div>

					{/* Search results */}
					<div className="space-y-2">
						{isSearching ? (
							<div className="py-12 text-center text-xs text-[#8E8E9F] flex items-center justify-center gap-2">
								<Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
								<span>Searching players...</span>
							</div>
						) : searchResults.length > 0 ? (
							<div className="space-y-2">
								{searchResults.map((u) => (
									<div
										key={u.id}
										className="bg-[#0D0D11] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-3"
									>
										<div className="flex items-center gap-3 min-w-0">
											<img
												src={
													u.avatarUrl ||
													`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName)}`
												}
												alt={u.displayName}
												className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
											/>
											<div className="min-w-0">
												<h4 className="font-medium text-xs sm:text-sm text-[#F4F4F7] truncate">
													{u.displayName}
												</h4>
											</div>
										</div>

										<div>
											{u.relationship === "FRIENDS" ? (
												<span className="text-xs text-emerald-400 font-medium px-2 py-1">
													Friends
												</span>
											) : u.relationship === "REQUEST_SENT" ? (
												<span className="text-xs text-[#8E8E9F] italic px-2 py-1">
													Requested
												</span>
											) : u.relationship === "REQUEST_RECEIVED" ? (
												<button
													onClick={() =>
														u.friendshipId && handleAccept(u.friendshipId)
													}
													className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B]"
												>
													Accept
												</button>
											) : (
												<button
													onClick={() => handleSend(u.id)}
													disabled={actionPendingId === u.id}
													className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 flex items-center gap-1 transition-opacity disabled:opacity-50"
												>
													<UserPlus className="w-3.5 h-3.5" />
													<span>Add</span>
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						) : searchQuery.trim().length >= 2 ? (
							<p className="py-12 text-center text-xs text-[#8E8E9F]">
								No players found matching &quot;{searchQuery}&quot;
							</p>
						) : (
							<div className="py-10 text-center text-xs text-[#8E8E9F] space-y-1">
								<p>Type a player&apos;s name or email to search and connect.</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
