import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Music,
  ArrowRight,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  Volume2,
  Sliders,
  Disc,
} from 'lucide-react';
import type { Artist, FeaturedTrackItem } from '../types';
import { sounds } from '../utils/audioSynth';

interface ArtistSearchProps {
  featuredArtists: Artist[];
  featuredTracks?: FeaturedTrackItem[];
  onSelectArtist: (artist: Artist) => void;
  isLoadingQuiz: boolean;
  onSearch: (query: string) => Promise<Artist[]>;
}

export const ArtistSearch: React.FC<ArtistSearchProps> = ({
  featuredArtists,
  featuredTracks = [],
  onSelectArtist,
  isLoadingQuiz,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Audio preview playback for featured songs on home page
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (track: FeaturedTrackItem) => {
    sounds.playClick();
    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.previewUrl);
      audio.volume = 0.7;
      audio.onended = () => setPlayingTrackId(null);
      audio.play().catch((e) => console.warn('Audio play error:', e));
      audioRef.current = audio;
      setPlayingTrackId(track.id);
    }
  };

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
        console.error('Search failed:', err);
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12131A] border border-white/[0.08] text-xs font-mono text-[#8E8E9F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF32]" />
          <span>Audio Recognition Engine</span>
        </div>

        <h1 className="font-headline text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F4F7] leading-tight">
          Recognize tracks from <br />
          <span className="text-[#D4FF32]">artist discographies.</span>
        </h1>

        <p className="text-[#8E8E9F] text-xs sm:text-sm font-body max-w-lg mx-auto">
          Stream 10 audio excerpts per session. Measure recognition speed, ear precision, and catalog depth across certified artist discographies.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="w-full max-w-xl mb-8">
        <div className="relative group">
          <div className="relative flex items-center bg-[#0D0D11] border border-white/[0.08] rounded-full shadow-lg overflow-hidden focus-within:border-[#D4FF32] transition-colors">
            <div className="pl-4 sm:pl-5 text-[#8E8E9F]">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
              ) : (
                <Search className="w-4 h-4 text-[#8E8E9F] group-focus-within:text-[#D4FF32] transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog by artist (e.g. Queen, Radiohead, Daft Punk...)"
              className="w-full px-3 sm:px-4 py-3 bg-transparent text-[#F4F4F7] placeholder-[#8E8E9F] text-xs sm:text-sm focus:outline-none font-body"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-4 sm:pr-5 text-xs text-[#8E8E9F] hover:text-[#F4F4F7] font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Live Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="mt-2 bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-2 shadow-2xl max-h-80 overflow-y-auto space-y-1 animate-fade-in">
            {isSearching ? (
              <div className="py-6 text-center text-xs text-[#8E8E9F] flex items-center justify-center gap-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-[#D4FF32]" />
                <span>Querying artist database...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => handleArtistClick(artist)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#12131A] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-11 h-11 rounded-lg object-cover bg-[#181924]"
                    />
                    <div>
                      <h4 className="font-headline font-semibold text-[#F4F4F7] text-sm group-hover:text-[#D4FF32] transition-colors">
                        {artist.name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#8E8E9F] capitalize">
                        {artist.genres.slice(0, 2).join(' • ') || 'Artist Discography'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartGame(artist);
                    }}
                    disabled={isLoadingQuiz}
                    className="px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] transition-all flex items-center gap-1.5"
                  >
                    <span>Begin Session</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#8E8E9F] font-body">
                No catalog matches found for "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Artist Confirmation Card */}
      {selectedArtist && (
        <div className="w-full max-w-xl mb-8 p-4 sm:p-5 rounded-2xl bg-[#0D0D11] border border-[#D4FF32]/40 shadow-xl relative overflow-hidden animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <img
              src={selectedArtist.imageUrl}
              alt={selectedArtist.name}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover border border-white/[0.08]"
            />
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#D4FF32]/10 text-[#D4FF32] border border-[#D4FF32]/30">
                Catalog Selected
              </span>
              <h3 className="font-headline text-lg sm:text-xl font-bold text-[#F4F4F7]">{selectedArtist.name}</h3>
              <p className="text-xs text-[#8E8E9F] font-body">
                Evaluation session: 10 audio excerpts from {selectedArtist.name}.
              </p>
            </div>
            <button
              onClick={() => handleStartGame(selectedArtist)}
              disabled={isLoadingQuiz}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoadingQuiz ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Session...</span>
                </>
              ) : (
                <>
                  <span>Begin Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Curated Master Audio Excerpts */}
      {featuredTracks.length > 0 && (
        <div className="w-full mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#D4FF32]" />
              <h3 className="font-headline text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F4F4F7]">
                Curated Audio Excerpts
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8E8E9F]">Preview Audio Stream</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className="bg-[#0D0D11] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-3 flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {track.albumCover ? (
                      <img
                        src={track.albumCover}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover border border-white/[0.06] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#12131A] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-[#8E8E9F]" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="font-headline font-semibold text-xs sm:text-sm text-[#F4F4F7] truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] font-mono text-[#8E8E9F] truncate">
                        {track.artistName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {track.previewUrl && (
                      <button
                        onClick={() => togglePreview(track)}
                        title={isPlaying ? "Pause audio excerpt" : "Play audio excerpt"}
                        className={`p-2 rounded-full transition-colors ${
                          isPlaying
                            ? 'bg-[#D4FF32] text-[#08080B]'
                            : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] hover:bg-[#181924]'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const matched = featuredArtists.find(
                          (a) => a.name.toLowerCase() === track.artistName.toLowerCase()
                        );
                        if (matched) {
                          handleStartGame(matched);
                        } else {
                          handleStartGame({
                            id: `artist_${track.artistName.toLowerCase().replace(/\s+/g, '_')}`,
                            name: track.artistName,
                            imageUrl: track.albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                            genres: ['discography'],
                          });
                        }
                      }}
                      title="Evaluate this artist catalog"
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-headline font-semibold bg-[#12131A] text-[#D4FF32] border border-[#D4FF32]/30 hover:bg-[#D4FF32] hover:text-[#08080B] transition-colors flex items-center gap-1"
                    >
                      <span>Assess</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Artist Catalogs */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-[#D4FF32]" />
            <h3 className="font-headline text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F4F4F7]">
              Featured Artist Catalogs
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#8E8E9F]">Certified Discographies</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {featuredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => handleStartGame(artist)}
              className="group bg-[#0D0D11] hover:bg-[#12131A] border border-white/[0.08] hover:border-white/[0.2] rounded-xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover bg-[#181924]"
                />
                <div className="overflow-hidden">
                  <h4 className="font-headline font-semibold text-[#F4F4F7] text-xs sm:text-sm truncate group-hover:text-[#D4FF32] transition-colors">
                    {artist.name}
                  </h4>
                  <p className="text-[10px] font-mono text-[#8E8E9F] truncate capitalize">
                    {artist.genres[0] || 'Catalog'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-[#8E8E9F]">
                <span className="font-mono text-[10px]">
                  10 Excerpts
                </span>
                <span className="flex items-center gap-1 text-[#D4FF32] font-headline font-medium text-xs group-hover:translate-x-0.5 transition-transform">
                  Start <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
