import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Music2, Users, ArrowRight, Play, Loader2, Disc3 } from 'lucide-react';
import type { Artist } from '../types';
import { sounds } from '../utils/audioSynth';

interface ArtistSearchProps {
  featuredArtists: Artist[];
  onSelectArtist: (artist: Artist) => void;
  isLoadingQuiz: boolean;
  onSearch: (query: string) => Promise<Artist[]>;
}

export const ArtistSearch: React.FC<ArtistSearchProps> = ({
  featuredArtists,
  onSelectArtist,
  isLoadingQuiz,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

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
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleArtistClick = (artist: Artist) => {
    sounds.playClick();
    setSelectedArtist(artist);
  };

  const handleStartGame = (artist: Artist) => {
    sounds.playClick();
    onSelectArtist(artist);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-10 flex flex-col items-center">
      {/* Hero Header (Matiks Inspired) */}
      <div className="text-center max-w-2xl mb-6 sm:mb-8 space-y-2.5 sm:space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Speed Music Trivia</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-none">
          CAN YOU NAME <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            THE ARTIST'S TRACK?
          </span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-base font-normal max-w-lg mx-auto">
          Pick any artist. Listen to 10 rapid-fire song snippets against the clock. Pick the right title out of 3 choices from the same artist to conquer the leaderboard!
        </p>
      </div>

      {/* Search Input Box */}
      <div className="w-full max-w-xl mb-6 sm:mb-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-indigo-500/30 to-purple-500/30 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="relative flex items-center bg-[#101728] border border-white/10 rounded-2xl shadow-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
            <div className="pl-4 sm:pl-5 text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-emerald-400" />
              ) : (
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any artist (e.g. Queen, Drake, Nirvana, Adele...)"
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-transparent text-white placeholder-slate-500 text-xs sm:text-base focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="pr-4 sm:pr-5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Live Search Results Dropdown/Grid */}
        {searchQuery.trim() && (
          <div className="mt-3 bg-[#101728] border border-white/10 rounded-2xl p-2 shadow-2xl max-h-80 overflow-y-auto space-y-1.5 animate-fade-in">
            {isSearching ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Searching Spotify & Music database...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => handleArtistClick(artist)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800"
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                        {artist.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {artist.genres.slice(0, 2).join(' • ') || 'Music Artist'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartGame(artist);
                    }}
                    disabled={isLoadingQuiz}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No artists found matching "{searchQuery}". Try another spelling!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Artist Confirmation Card (if selected) */}
      {selectedArtist && (
        <div className="w-full max-w-xl mb-10 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <img
              src={selectedArtist.imageUrl}
              alt={selectedArtist.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-lg border border-white/10"
            />
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ready to play
              </span>
              <h3 className="text-2xl font-black text-white">{selectedArtist.name}</h3>
              <p className="text-xs text-slate-400">
                10 random songs will be chosen with 3 choices each from {selectedArtist.name}.
              </p>
            </div>
            <button
              onClick={() => handleStartGame(selectedArtist)}
              disabled={isLoadingQuiz}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoadingQuiz ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Songs...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START QUIZ</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Featured Popular Artists */}
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Featured Artists
            </h3>
          </div>
          <span className="text-xs text-slate-500">Pick one to start immediately</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {featuredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => handleStartGame(artist)}
              className="group relative bg-[#101728]/80 hover:bg-[#162038] border border-white/5 hover:border-emerald-500/40 rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 active:scale-95"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover group-hover:scale-105 transition-transform shadow-md"
                />
                <div className="overflow-hidden">
                  <h4 className="font-extrabold text-white text-sm sm:text-base truncate group-hover:text-emerald-300 transition-colors">
                    {artist.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate capitalize">
                    {artist.genres[0] || 'Popular Artist'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Music2 className="w-3 h-3 text-emerald-400" />
                  10 Questions
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                  Play <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
