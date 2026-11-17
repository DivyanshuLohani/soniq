import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  Activity,
  BarChart3,
  Server,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Trophy,
  Loader2,
  ArrowLeft,
  Sparkles,
  Music,
  Plus,
  Play,
  Pause,
  Edit3,
  Save,
  X,
  Volume2,
  Flame,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audioSynth';
import type { AnalyticsOverview, AdminUserItem, DiagnosticsData, FeaturedTrackItem } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'showcase' | 'analytics' | 'users' | 'sessions' | 'diagnostics'>('showcase');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [featuredTracks, setFeaturedTracks] = useState<FeaturedTrackItem[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRebuildingCache, setIsRebuildingCache] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Audio preview playback in admin
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states for adding new featured song
  const [showAddSongForm, setShowAddSongForm] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongAlbum, setNewSongAlbum] = useState('');
  const [newSongCover, setNewSongCover] = useState('');
  const [newSongPreview, setNewSongPreview] = useState('');
  const [newSongOrder, setNewSongOrder] = useState('0');

  // Form states for adding new featured artist
  const [showAddArtistForm, setShowAddArtistForm] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistImage, setNewArtistImage] = useState('');
  const [newArtistGenres, setNewArtistGenres] = useState('pop, rock');
  const [newArtistOrder, setNewArtistOrder] = useState('0');

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const loadTabContent = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'showcase') {
        const [tracks, artists] = await Promise.all([
          api.getFeaturedTracksAdmin(),
          api.getFeaturedArtistsAdmin(),
        ]);
        setFeaturedTracks(tracks);
        setFeaturedArtists(artists);
      } else if (activeTab === 'analytics') {
        const data = await api.getAdminAnalytics();
        setAnalyticsData(data);
      } else if (activeTab === 'users') {
        const data = await api.getAdminUsers();
        setUsers(data);
      } else if (activeTab === 'sessions') {
        const data = await api.getAdminRecentSessions();
        setSessions(data);
      } else if (activeTab === 'diagnostics') {
        const data = await api.getAdminDiagnostics();
        setDiagnostics(data);
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePreview = (track: FeaturedTrackItem) => {
    sounds.playClick();
    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const a = new Audio(track.previewUrl);
      a.volume = 0.7;
      a.onended = () => setPlayingTrackId(null);
      a.play().catch((e) => console.warn('Preview error:', e));
      audioRef.current = a;
      setPlayingTrackId(track.id);
    }
  };

  // 1. Create Featured Song
  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim() || !newSongArtist.trim()) {
      setFeedbackMessage('Song title and artist name are required');
      return;
    }
    sounds.playClick();
    try {
      const res = await api.createFeaturedTrack({
        title: newSongTitle.trim(),
        artistName: newSongArtist.trim(),
        albumName: newSongAlbum.trim() || undefined,
        albumCover: newSongCover.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        previewUrl: newSongPreview.trim() || undefined,
        displayOrder: parseInt(newSongOrder) || 0,
        isActive: true,
      });
      setFeaturedTracks((prev) => [...prev, res.track]);
      setShowAddSongForm(false);
      setNewSongTitle('');
      setNewSongArtist('');
      setNewSongAlbum('');
      setNewSongCover('');
      setNewSongPreview('');
      setFeedbackMessage('Featured song added to home page successfully!');
    } catch (err: any) {
      setFeedbackMessage('Failed to add song: ' + err.message);
    }
  };

  // Toggle Song Active
  const handleToggleSongActive = async (track: FeaturedTrackItem) => {
    sounds.playClick();
    try {
      const updated = await api.updateFeaturedTrack(track.id, { isActive: !track.isActive });
      setFeaturedTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, isActive: updated.track.isActive } : t))
      );
      setFeedbackMessage(`Song "${track.title}" visibility toggled!`);
    } catch (err: any) {
      setFeedbackMessage('Failed to update song: ' + err.message);
    }
  };

  // Delete Featured Song
  const handleDeleteSong = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" from home page?`)) return;
    sounds.playClick();
    try {
      await api.deleteFeaturedTrack(id);
      setFeaturedTracks((prev) => prev.filter((t) => t.id !== id));
      setFeedbackMessage('Featured song removed from home page');
    } catch (err: any) {
      setFeedbackMessage('Failed to delete song: ' + err.message);
    }
  };

  // 2. Create Featured Artist
  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim() || !newArtistImage.trim()) {
      setFeedbackMessage('Artist name and image URL are required');
      return;
    }
    sounds.playClick();
    try {
      const res = await api.createFeaturedArtist({
        name: newArtistName.trim(),
        imageUrl: newArtistImage.trim(),
        genres: newArtistGenres.trim(),
        displayOrder: parseInt(newArtistOrder) || 0,
        isActive: true,
      });
      setFeaturedArtists((prev) => [...prev, res.artist]);
      setShowAddArtistForm(false);
      setNewArtistName('');
      setNewArtistImage('');
      setFeedbackMessage('Featured artist added to home page successfully!');
    } catch (err: any) {
      setFeedbackMessage('Failed to add artist: ' + err.message);
    }
  };

  // Toggle Artist Active
  const handleToggleArtistActive = async (artist: any) => {
    sounds.playClick();
    try {
      const updated = await api.updateFeaturedArtist(artist.id, { isActive: !artist.isActive });
      setFeaturedArtists((prev) =>
        prev.map((a) => (a.id === artist.id ? { ...a, isActive: updated.artist.isActive } : a))
      );
      setFeedbackMessage(`Artist "${artist.name}" visibility toggled!`);
    } catch (err: any) {
      setFeedbackMessage('Failed to update artist: ' + err.message);
    }
  };

  // Delete Featured Artist
  const handleDeleteArtist = async (id: string, name: string) => {
    if (!confirm(`Delete artist "${name}" from home page?`)) return;
    sounds.playClick();
    try {
      await api.deleteFeaturedArtist(id);
      setFeaturedArtists((prev) => prev.filter((a) => a.id !== id));
      setFeedbackMessage('Featured artist removed from home page');
    } catch (err: any) {
      setFeedbackMessage('Failed to delete artist: ' + err.message);
    }
  };

  const handleRebuildCache = async () => {
    sounds.playClick();
    setIsRebuildingCache(true);
    setFeedbackMessage(null);
    try {
      const res = await api.rebuildAnalyticsCache();
      const updated = await api.getAdminAnalytics(true);
      setAnalyticsData(updated);
      setFeedbackMessage(`Database cache index rebuilt in ${res.computationTimeMs}ms!`);
    } catch (err: any) {
      setFeedbackMessage('Failed to rebuild cache index: ' + err.message);
    } finally {
      setIsRebuildingCache(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    sounds.playClick();
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setFeedbackMessage(`User role updated to ${newRole}`);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    sounds.playClick();
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setFeedbackMessage('User deleted successfully');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-2xl font-bold text-[#F4F4F7] tracking-tight">soniq admin</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4FF32]/10 border border-[#D4FF32]/30 text-[#D4FF32] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>
            <p className="text-xs font-body text-[#8E8E9F]">
              Live Home Showcase Management & PostgreSQL Database Cache
            </p>
          </div>
        </div>

        {/* Cache Index Rebuild Button */}
        <button
          onClick={handleRebuildCache}
          disabled={isRebuildingCache}
          className="px-4 py-2 rounded-full font-headline text-xs font-bold bg-[#181924] hover:bg-[#202230] text-[#D4FF32] border border-[#D4FF32]/30 flex items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRebuildingCache ? 'animate-spin' : ''}`} />
          <span>{isRebuildingCache ? 'Rebuilding Index...' : 'Rebuild Cache Index'}</span>
        </button>
      </div>

      {/* Notification Banner */}
      {feedbackMessage && (
        <div className="mb-6 p-3 rounded-2xl bg-[#12131A] border border-[#D4FF32]/30 text-[#F4F4F7] text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4FF32] shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-[#8E8E9F] hover:text-[#F4F4F7] text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-white/[0.08] scrollbar-none">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('showcase');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'showcase'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          } active:scale-[0.97]`}
        >
          <Music className="w-4 h-4" />
          <span>Catalog Showcase</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('analytics');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          } active:scale-[0.97]`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('users');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          } active:scale-[0.97]`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('sessions');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'sessions'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          } active:scale-[0.97]`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Sessions</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('diagnostics');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'diagnostics'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          } active:scale-[0.97]`}
        >
          <Server className="w-4 h-4" />
          <span>Diagnostics</span>
        </button>
      </div>

      {/* Tab Body */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4FF32]" />
          <span className="text-xs font-mono text-[#8E8E9F]">Loading soniq data...</span>
        </div>
      ) : activeTab === 'showcase' ? (
        /* HOME SHOWCASE MANAGEMENT TAB */
        <div className="space-y-8 animate-fade-in">
          {/* SECTION 1: FEATURED SONGS ON HOME PAGE */}
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#D4FF32]" />
                  <h3 className="font-headline font-bold text-base sm:text-lg text-[#F4F4F7]">
                    Homepage Featured Songs
                  </h3>
                </div>
                <p className="text-xs font-body text-[#8E8E9F]">
                  Curate the tracks highlighted directly on the home page with live audio previews.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setShowAddSongForm(!showAddSongForm);
                }}
                className="px-3.5 py-1.5 rounded-full font-headline text-xs font-bold bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center gap-1.5 self-start sm:self-auto active:scale-[0.97]"
              >
                {showAddSongForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddSongForm ? 'Cancel' : 'Add New Song'}</span>
              </button>
            </div>

            {/* Add Song Form */}
            {showAddSongForm && (
              <form onSubmit={handleCreateSong} className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.08] space-y-3 animate-fade-in">
                <h4 className="font-headline font-bold text-sm text-[#F4F4F7]">Add Song to Home Page</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Song Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bohemian Rhapsody"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Artist Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Queen"
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Album Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. A Night at the Opera"
                      value={newSongAlbum}
                      onChange={(e) => setNewSongAlbum(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Album Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newSongCover}
                      onChange={(e) => setNewSongCover(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Audio Preview URL (.mp3 / .m4a)</label>
                    <input
                      type="url"
                      placeholder="https://audio-ssl.itunes.apple.com/..."
                      value={newSongPreview}
                      onChange={(e) => setNewSongPreview(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Display Order</label>
                    <input
                      type="number"
                      value={newSongOrder}
                      onChange={(e) => setNewSongOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#D4FF32] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSongForm(false)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full text-xs font-headline font-bold bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] active:scale-[0.97]"
                  >
                    Save Song
                  </button>
                </div>
              </form>
            )}

            {/* List of Featured Songs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredTracks.map((t) => {
                const isPlaying = playingTrackId === t.id;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#12131A] border border-white/[0.08] flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {t.albumCover ? (
                        <img
                          src={t.albumCover}
                          alt={t.title}
                          className="w-12 h-12 rounded-xl object-cover border border-white/[0.06] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#08080B] border border-white/[0.06] flex items-center justify-center shrink-0">
                          <Music className="w-5 h-5 text-[#B49BFF]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-headline font-bold text-xs sm:text-sm text-[#F4F4F7] truncate">
                          {t.title}
                        </h4>
                        <p className="text-[11px] font-body text-[#8E8E9F] truncate">
                          {t.artistName}
                        </p>
                        <span className="font-mono text-[9px] text-[#8E8E9F]">
                          Order: {t.displayOrder}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.previewUrl && (
                        <button
                          onClick={() => handleTogglePreview(t)}
                          title={isPlaying ? "Pause" : "Play preview"}
                          className={`p-1.5 rounded-full transition-colors ${
                            isPlaying
                              ? 'bg-[#D4FF32] text-[#08080B]'
                              : 'bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7]'
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
                        onClick={() => handleToggleSongActive(t)}
                        title={t.isActive ? "Hide from home" : "Show on home"}
                        className={`px-2 py-1 rounded-full font-mono text-[9px] font-bold border transition-colors ${
                          t.isActive
                            ? 'bg-[#D4FF32]/10 text-[#D4FF32] border-[#D4FF32]/30'
                            : 'bg-white/5 text-[#8E8E9F] border-white/10'
                        }`}
                      >
                        {t.isActive ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => handleDeleteSong(t.id, t.title)}
                        title="Delete song"
                        className="p-1.5 rounded-full text-[#8E8E9F] hover:text-[#FF4694] hover:bg-[#FF4694]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: FEATURED ARTISTS ON HOME PAGE */}
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B49BFF]" />
                  <h3 className="font-headline font-bold text-base sm:text-lg text-[#F4F4F7]">
                    Homepage Featured Artists
                  </h3>
                </div>
                <p className="text-xs font-body text-[#8E8E9F]">
                  Manage the quick-start quiz artists featured on the home page.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setShowAddArtistForm(!showAddArtistForm);
                }}
                className="px-3.5 py-1.5 rounded-full font-headline text-xs font-bold bg-[#B49BFF] text-[#08080B] hover:bg-[#c3b1ff] flex items-center gap-1.5 self-start sm:self-auto active:scale-[0.97]"
              >
                {showAddArtistForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddArtistForm ? 'Cancel' : 'Add New Artist'}</span>
              </button>
            </div>

            {/* Add Artist Form */}
            {showAddArtistForm && (
              <form onSubmit={handleCreateArtist} className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.08] space-y-3 animate-fade-in">
                <h4 className="font-headline font-bold text-sm text-[#F4F4F7]">Add Featured Artist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Artist Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coldplay"
                      value={newArtistName}
                      onChange={(e) => setNewArtistName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#B49BFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Image URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={newArtistImage}
                      onChange={(e) => setNewArtistImage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#B49BFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Genres (comma separated)</label>
                    <input
                      type="text"
                      value={newArtistGenres}
                      onChange={(e) => setNewArtistGenres(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#B49BFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E8E9F] mb-1">Display Order</label>
                    <input
                      type="number"
                      value={newArtistOrder}
                      onChange={(e) => setNewArtistOrder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#08080B] border border-white/[0.08] text-xs text-[#F4F4F7] focus:border-[#B49BFF] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddArtistForm(false)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full text-xs font-headline font-bold bg-[#B49BFF] text-[#08080B] hover:bg-[#c3b1ff] active:scale-[0.97]"
                  >
                    Save Artist
                  </button>
                </div>
              </form>
            )}

            {/* List of Featured Artists */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featuredArtists.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl bg-[#12131A] border border-white/[0.08] flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#08080B] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-headline font-bold text-xs sm:text-sm text-[#F4F4F7] truncate">
                        {a.name}
                      </h4>
                      <p className="text-[10px] font-body text-[#8E8E9F] truncate">
                        {a.genres}
                      </p>
                      <span className="font-mono text-[9px] text-[#8E8E9F]">
                        Order: {a.displayOrder}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleToggleArtistActive(a)}
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border transition-colors ${
                        a.isActive
                          ? 'bg-[#D4FF32]/10 text-[#D4FF32] border-[#D4FF32]/30'
                          : 'bg-white/5 text-[#8E8E9F] border-white/10'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => handleDeleteArtist(a.id, a.name)}
                      title="Delete artist"
                      className="p-1 rounded-full text-[#8E8E9F] hover:text-[#FF4694] hover:bg-[#FF4694]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'analytics' && analyticsData ? (
        /* Analytics Tab */
        <div className="space-y-6 animate-fade-in">
          {/* Cache Metadata Card */}
          <div className="p-4 rounded-2xl bg-[#0D0D11] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[#D4FF32]" />
              <span className="text-[#F4F4F7] font-semibold">
                Database Cache Index Status:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D4FF32]/10 text-[#D4FF32] border border-[#D4FF32]/30 font-mono font-bold text-[10px]">
                Indexed in {analyticsData.cacheMetadata.computationTimeMs}ms
              </span>
            </div>
            <div className="text-[#8E8E9F] font-mono text-[11px]">
              Last updated: {new Date(analyticsData.cacheMetadata.lastUpdated).toLocaleTimeString()} • TTL: 5 min
            </div>
          </div>

          {/* 4 Core KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[#8E8E9F] text-xs font-bold mb-1">
                <Target className="w-3.5 h-3.5 text-[#D4FF32]" />
                <span>Total Quizzes</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#F4F4F7]">
                {analyticsData.totalQuizzes.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8E8E9F] font-mono">Sessions completed</span>
            </div>

            <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[#8E8E9F] text-xs font-bold mb-1">
                <Users className="w-3.5 h-3.5 text-[#B49BFF]" />
                <span>Registered Users</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#F4F4F7]">
                {analyticsData.totalUsers.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8E8E9F] font-mono">Active profiles</span>
            </div>

            <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[#8E8E9F] text-xs font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF32]" />
                <span>Global Accuracy</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#D4FF32]">
                {analyticsData.globalAccuracy}%
              </div>
              <span className="text-[10px] text-[#8E8E9F] font-mono">
                {analyticsData.totalCorrectAnswers.toLocaleString()}/{analyticsData.totalQuestionsAnswered.toLocaleString()} correct
              </span>
            </div>

            <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-[#8E8E9F] text-xs font-bold mb-1">
                <Trophy className="w-3.5 h-3.5 text-[#FF4694]" />
                <span>Average Score</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#FF4694]">
                {analyticsData.averageScore.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8E8E9F] font-mono">
                Fastest: {analyticsData.fastestGame}s
              </span>
            </div>
          </div>

          {/* Top Artists Ranked by Popularity */}
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-headline font-bold text-sm text-[#F4F4F7] mb-4">
              Top Trivia Artists Ranked by Plays
            </h3>
            <div className="space-y-2">
              {analyticsData.topArtists.slice(0, 5).map((artist, i) => (
                <div
                  key={artist.artistName}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#12131A] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#8E8E9F] w-4">
                      {i + 1}
                    </span>
                    <span className="font-headline font-bold text-sm text-[#F4F4F7]">
                      {artist.artistName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#8E8E9F]">{artist.totalGames} games</span>
                    <span className="text-[#D4FF32] font-bold">Top {artist.highScore} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* Users Tab */
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          <div className="p-4 border-b border-white/[0.08] font-headline font-bold text-sm text-[#F4F4F7] flex items-center justify-between">
            <span>User Accounts ({users.length})</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#12131A] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName)}&backgroundColor=12131a&textColor=d4ff32`}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-full object-cover bg-[#181924]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-bold text-sm text-[#F4F4F7]">
                        {u.displayName}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          u.role === 'ADMIN'
                            ? 'bg-[#B49BFF]/15 text-[#B49BFF] border-[#B49BFF]/30'
                            : 'bg-white/5 text-[#8E8E9F] border-white/10'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8E9F]">
                      {u.email || 'Guest Profile'} • {u.totalGames} games played
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRole(u.id, u.role)}
                    className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
                  >
                    {u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    title="Delete User"
                    className="p-1.5 rounded-full text-[#8E8E9F] hover:text-[#FF4694] hover:bg-[#FF4694]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'sessions' ? (
        /* Live Recent Sessions Tab */
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl animate-fade-in">
          <div className="p-4 border-b border-white/[0.08] font-headline font-bold text-sm text-[#F4F4F7]">
            Live Game Sessions Feed (Latest 30)
          </div>

          <div className="divide-y divide-white/[0.06]">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#12131A] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#12131A] border border-white/[0.08] flex items-center justify-center font-headline font-bold text-xs text-[#D4FF32] shrink-0">
                    {s.artistName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline font-bold text-[#F4F4F7] text-sm truncate">
                      {s.artistName}
                    </div>
                    <div className="text-xs text-[#8E8E9F]">
                      Player: <span className="text-[#F4F4F7]">{s.user?.displayName || s.guestName || 'Anonymous'}</span> •{' '}
                      {s.correctCount}/{s.totalQuestions} ({s.accuracy}%) in {s.timeTakenSeconds}s
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-[#D4FF32] text-sm sm:text-base">
                    {s.score.toLocaleString()} pts
                  </div>
                  <div className="text-[10px] text-[#8E8E9F] font-mono">
                    {new Date(s.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Diagnostics Tab */
        diagnostics && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#8E8E9F] text-xs font-bold mb-2">
                  <Database className="w-4 h-4 text-[#D4FF32]" />
                  <span>Database Engine</span>
                </div>
                <div className="font-headline text-xl font-bold text-[#F4F4F7]">
                  {diagnostics.database.engine}
                </div>
                <div className="text-xs text-[#D4FF32] font-mono mt-1">
                  Latency: {diagnostics.database.latencyMs}ms • Connected
                </div>
              </div>

              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#8E8E9F] text-xs font-bold mb-2">
                  <BarChart3 className="w-4 h-4 text-[#B49BFF]" />
                  <span>Google Analytics</span>
                </div>
                <div className="font-headline text-xl font-bold text-[#F4F4F7]">
                  {diagnostics.analytics.googleAnalyticsConfigured ? 'Active (GA4)' : 'Not Configured'}
                </div>
                <div className="text-xs text-[#8E8E9F] font-mono mt-1">
                  via GA_MEASUREMENT_ID
                </div>
              </div>

              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#8E8E9F] text-xs font-bold mb-2">
                  <Server className="w-4 h-4 text-[#FF4694]" />
                  <span>Spotify API</span>
                </div>
                <div className="font-headline text-xl font-bold text-[#F4F4F7]">
                  {diagnostics.spotify.configured ? 'Configured' : 'Open / Preview Mode'}
                </div>
                <div className="text-xs text-[#8E8E9F] font-mono mt-1">
                  OAuth & API status
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
