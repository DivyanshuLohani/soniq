import {
	ArrowRight,
	Disc,
	Link as LinkIcon,
	ListMusic,
	Loader2,
	Pause,
	Play,
	Search,
	Sparkles,
	Volume2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Artist, FeaturedTrackItem, User } from "../types";
import { sounds } from "../utils/audioSynth";

interface ArtistSearchProps {
	featuredArtists: Artist[];
	featuredTracks?: FeaturedTrackItem[];
	onSelectArtist: (artist: Artist) => void;
	onSelectPlaylist?: (playlistUrlOrId: string) => void;
	isLoadingQuiz: boolean;
	onSearch: (query: string) => Promise<Artist[]>;
	user?: User | null;
	onOpenSpotifyModal?: () => void;
}

export const ArtistSearch: React.FC<ArtistSearchProps> = ({
	featuredArtists,
	onSelectArtist,
	onSelectPlaylist,
	isLoadingQuiz,
	onSearch,
	user,
	onOpenSpotifyModal,
}) => {
	const [activeTab, setActiveTab] = useState<"artists" | "playlists">(
		"artists",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Artist[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

	// Playlist Mode state
	const [playlistInput, setPlaylistInput] = useState("");
	const [userPlaylists, setUserPlaylists] = useState<
		Array<{ id: string; name: string; imageUrl?: string; tracksCount: number }>
	>([]);
	const [isLoadingUserPlaylists, setIsLoadingUserPlaylists] = useState(false);
	const [userPlaylistError, setUserPlaylistError] = useState<string | null>(
		null,
	);

	const audioRef = useRef<HTMLAudioElement | null>(null);

	const popularPlaylists: any[] = [];

	useEffect(() => {
		if (activeTab === "playlists" && user?.isSpotifyConnected) {
			setIsLoadingUserPlaylists(true);
			setUserPlaylistError(null);
			api
				.getUserPlaylists()
				.then((res) => {
					setUserPlaylists(res);
					setUserPlaylistError(null);
				})
				.catch((e: any) => {
					console.warn("Could not load user playlists", e);
					setUserPlaylistError(
						e.message || "Could not load playlists. Try reconnecting Spotify.",
					);
				})
				.finally(() => setIsLoadingUserPlaylists(false));
		}
	}, [activeTab, user?.isSpotifyConnected]);

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
			}
		};
	}, []);

	// Debounced search
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await onSearch(searchQuery.trim());
				setSearchResults(results);
			} catch (err) {
				console.error("Search failed:", err);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, onSearch]);

	const handleArtistClick = (artist: Artist) => {
		sounds.playClick();
		setSelectedArtist(artist);
	};

	const handleStartGame = (artist: Artist) => {
		sounds.playClick();
		if (audioRef.current) audioRef.current.pause();
		onSelectArtist(artist);
	};

	return (
		<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
			{/* Hero Header */}
			<div className="text-center max-w-xl mb-6 space-y-2">
				<h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F4F7]">
					Guess the track
					<span className="text-[#D4FF32]">.</span>
				</h1>

				<p className="text-[#8E8E9F] text-xs sm:text-sm font-body max-w-sm mx-auto">
					Hear short audio clips and test how fast you can identify the song.
				</p>

				{/* Minimal Mode Switcher */}
				<div className="inline-flex p-1 rounded-full bg-[#12131A] border border-white/[0.06] mt-3">
					<button
						onClick={() => {
							sounds.playClick();
							setActiveTab("artists");
						}}
						className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
							activeTab === "artists"
								? "bg-[#D4FF32] text-[#08080B] font-semibold"
								: "text-[#8E8E9F] hover:text-[#F4F4F7]"
						}`}
					>
						<Disc className="w-3.5 h-3.5" />
						<span>Artists</span>
					</button>
					<button
						onClick={() => {
							sounds.playClick();
							setActiveTab("playlists");
						}}
						className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
							activeTab === "playlists"
								? "bg-[#D4FF32] text-[#08080B] font-semibold"
								: "text-[#8E8E9F] hover:text-[#F4F4F7]"
						}`}
					>
						<ListMusic className="w-3.5 h-3.5" />
						<span>Playlists</span>
					</button>
				</div>
			</div>

			{activeTab === "artists" ? (
				<>
					{/* Minimal Search Input Box */}
					<div className="w-full max-w-md mb-8">
						<div className="relative flex items-center bg-[#12131A] border border-white/[0.08] rounded-xl focus-within:border-white/20 transition-colors">
							<div className="pl-3.5 text-[#8E8E9F]">
								{isSearching ? (
									<Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
								) : (
									<Search className="w-4 h-4 text-[#8E8E9F]" />
								)}
							</div>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search any artist..."
								className="w-full px-3 py-2.5 bg-transparent text-[#F4F4F7] placeholder-[#8E8E9F] text-sm focus:outline-none font-body"
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

						{/* Live Search Results Dropdown */}
						{searchQuery.trim() && (
							<div className="mt-2 bg-[#12131A] border border-white/[0.08] rounded-xl p-1.5 shadow-xl max-h-80 overflow-y-auto space-y-1">
								{isSearching ? (
									<div className="py-6 text-center text-xs text-[#8E8E9F] flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
										<span>Searching...</span>
									</div>
								) : searchResults.length > 0 ? (
									searchResults.map((artist) => (
										<div
											key={artist.id}
											onClick={() => handleArtistClick(artist)}
											className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
										>
											<div className="flex items-center gap-3 min-w-0">
												<img
													src={artist.imageUrl}
													alt={artist.name}
													className="w-9 h-9 rounded-md object-cover bg-black/40 shrink-0"
												/>
												<div className="min-w-0">
													<h4 className="font-medium text-[#F4F4F7] text-sm truncate">
														{artist.name}
													</h4>
													<p className="text-[11px] text-[#8E8E9F] truncate capitalize">
														{artist.genres.slice(0, 2).join(" • ") || "Artist"}
													</p>
												</div>
											</div>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleStartGame(artist);
												}}
												disabled={isLoadingQuiz}
												className="px-3 py-1 rounded-md text-xs font-medium bg-[#D4FF32] text-[#08080B] hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 ml-2"
											>
												<span>Play</span>
												<ArrowRight className="w-3 h-3" />
											</button>
										</div>
									))
								) : (
									<div className="py-6 text-center text-xs text-[#8E8E9F]">
										No artists found for &quot;{searchQuery}&quot;
									</div>
								)}
							</div>
						)}
					</div>

					{/* Selected Artist Confirmation Card */}
					{selectedArtist && (
						<div className="w-full max-w-md mb-8 p-3.5 sm:p-4 rounded-xl bg-[#12131A] border border-white/10 flex items-center justify-between gap-3">
							<div className="flex items-center gap-3 min-w-0">
								<img
									src={selectedArtist.imageUrl}
									alt={selectedArtist.name}
									className="w-12 h-12 rounded-lg object-cover shrink-0"
								/>
								<div className="min-w-0">
									<h3 className="font-semibold text-sm sm:text-base text-[#F4F4F7] truncate">
										{selectedArtist.name}
									</h3>
									<p className="text-xs text-[#8E8E9F]">10 questions</p>
								</div>
							</div>
							<button
								onClick={() => handleStartGame(selectedArtist)}
								disabled={isLoadingQuiz}
								className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 flex items-center gap-1.5 shrink-0 transition-opacity disabled:opacity-50"
							>
								{isLoadingQuiz ? (
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										<span>Loading</span>
									</>
								) : (
									<>
										<span>Play</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</>
								)}
							</button>
						</div>
					)}
				</>
			) : (
				/* Playlist Mode UI */
				<div className="w-full max-w-md mb-8 space-y-6">
					{/* Paste Playlist URL Box */}
					<div className="bg-[#12131A] border border-white/[0.08] p-4 rounded-xl space-y-2.5">
						<div className="flex items-center gap-1.5 text-xs font-medium text-[#F4F4F7]">
							<LinkIcon className="w-3.5 h-3.5 text-[#D4FF32]" />
							<span>Paste Spotify Playlist Link</span>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={playlistInput}
								onChange={(e) => setPlaylistInput(e.target.value)}
								placeholder="https://open.spotify.com/playlist/..."
								className="flex-1 px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-xs sm:text-sm text-[#F4F4F7] placeholder-[#8E8E9F] focus:outline-none focus:border-white/20"
							/>
							<button
								onClick={() => {
									if (playlistInput.trim() && onSelectPlaylist) {
										sounds.playClick();
										onSelectPlaylist(playlistInput.trim());
									}
								}}
								disabled={!playlistInput.trim() || isLoadingQuiz}
								className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:opacity-90 disabled:opacity-40 flex items-center gap-1 shrink-0 transition-opacity"
							>
								{isLoadingQuiz ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<span>Play</span>
								)}
							</button>
						</div>
					</div>

					{/* User's own playlists */}
					{user?.isSpotifyConnected ? (
						<div className="space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-[#F4F4F7] flex items-center gap-1.5">
									<Sparkles className="w-3.5 h-3.5 text-[#D4FF32]" />
									Your Playlists
								</span>
								<span className="text-[11px] text-[#8E8E9F] truncate max-w-[150px]">
									{user.displayName}
								</span>
							</div>

							{isLoadingUserPlaylists ? (
								<div className="py-6 text-center text-xs text-[#8E8E9F] flex items-center justify-center gap-2">
									<Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
									<span>Loading playlists...</span>
								</div>
							) : userPlaylistError ? (
								<div className="p-3 bg-[#12131A] border border-white/[0.08] rounded-xl flex items-center justify-between gap-3 text-xs">
									<span className="text-[#8E8E9F]">{userPlaylistError}</span>
									{onOpenSpotifyModal && (
										<button
											onClick={() => {
												sounds.playClick();
												onOpenSpotifyModal();
											}}
											className="text-[#D4FF32] hover:underline font-medium shrink-0"
										>
											Reconnect
										</button>
									)}
								</div>
							) : userPlaylists.length > 0 ? (
								<div className="space-y-1.5 max-h-60 overflow-y-auto">
									{userPlaylists.map((pl) => (
										<div
											key={pl.id}
											onClick={() => {
												if (onSelectPlaylist) {
													sounds.playClick();
													onSelectPlaylist(pl.id);
												}
											}}
											className="bg-[#12131A] hover:bg-white/[0.04] border border-white/[0.06] p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors"
										>
											<div className="flex items-center gap-2.5 min-w-0">
												{pl.imageUrl ? (
													<img
														src={pl.imageUrl}
														alt={pl.name}
														className="w-9 h-9 rounded-md object-cover shrink-0"
													/>
												) : (
													<div className="w-9 h-9 rounded-md bg-black/40 flex items-center justify-center shrink-0">
														<ListMusic className="w-4 h-4 text-[#8E8E9F]" />
													</div>
												)}
												<div className="min-w-0">
													<h4 className="text-xs font-medium text-[#F4F4F7] truncate">
														{pl.name}
													</h4>
													<p className="text-[10px] text-[#8E8E9F]">
														{pl.tracksCount} tracks
													</p>
												</div>
											</div>
											<span className="text-xs text-[#D4FF32] font-medium shrink-0">
												Play
											</span>
										</div>
									))}
								</div>
							) : (
								<div className="p-3 text-center text-xs text-[#8E8E9F]">
									No public playlists found in your account.
								</div>
							)}
						</div>
					) : (
						<div className="bg-[#12131A] border border-white/[0.06] p-3.5 rounded-xl flex items-center justify-between gap-3">
							<span className="text-xs text-[#8E8E9F]">
								Connect Spotify to quiz your saved playlists
							</span>
							<button
								onClick={() => {
									sounds.playClick();
									if (onOpenSpotifyModal) onOpenSpotifyModal();
								}}
								className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#1DB954] text-white hover:opacity-90 shrink-0 transition-opacity"
							>
								Connect
							</button>
						</div>
					)}

					{/* Popular Curated Playlists */}
					<div className="space-y-2">
						<span className="text-xs font-medium text-[#8E8E9F]">
							Popular Playlists
						</span>
						<div className="space-y-1.5">
							{popularPlaylists.map((pl) => (
								<div
									key={pl.id}
									onClick={() => {
										if (onSelectPlaylist) {
											sounds.playClick();
											onSelectPlaylist(pl.id);
										}
									}}
									className="bg-[#12131A] hover:bg-white/[0.04] border border-white/[0.06] p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<img
											src={pl.imageUrl}
											alt={pl.name}
											className="w-9 h-9 rounded-md object-cover shrink-0"
										/>
										<div className="min-w-0">
											<h4 className="text-xs font-medium text-[#F4F4F7] truncate">
												{pl.name}
											</h4>
											<p className="text-[10px] text-[#8E8E9F] truncate">
												{pl.description}
											</p>
										</div>
									</div>
									<span className="text-xs text-[#D4FF32] font-medium shrink-0">
										Play
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Featured Artists Grid (clean, compact & mobile-friendly) */}
			<div className="w-full space-y-3">
				<div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
					<span className="text-xs font-medium text-[#8E8E9F] tracking-wide">
						POPULAR ARTISTS
					</span>
					<span className="text-[11px] text-[#8E8E9F]">10 songs each</span>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
					{featuredArtists.map((artist) => (
						<div
							key={artist.id}
							onClick={() => handleStartGame(artist)}
							className="bg-[#12131A] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 sm:p-3 transition-colors cursor-pointer flex items-center gap-2.5 group"
						>
							<img
								src={artist.imageUrl}
								alt={artist.name}
								className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover bg-black/40 shrink-0"
							/>
							<div className="min-w-0 flex-1">
								<h4 className="font-medium text-[#F4F4F7] text-xs sm:text-sm truncate group-hover:text-[#D4FF32] transition-colors">
									{artist.name}
								</h4>
								<p className="text-[10px] text-[#8E8E9F] truncate capitalize">
									{artist.genres[0] || "Artist"}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
