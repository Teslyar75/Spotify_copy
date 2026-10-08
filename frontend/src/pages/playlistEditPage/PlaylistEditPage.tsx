import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Topbar from "@/components/Topbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Song } from "@/types";
import { Search, Plus, Check, X, Play, Pause, Heart } from "lucide-react";
import { useSkinStore } from "@/stores/useSkinStore";

const PlaylistEditPage = () => {
  const { id: playlistId } = useParams();
  const { search } = useMusicStore();
  const { currentSong, isPlaying, togglePlay, playAlbum } = usePlayerStore();
  const { likeSong, unlikeSong, isSongLiked } = useLibraryStore();
  const { activeSkin } = useSkinStore();

  const [playlist, setPlaylist] = useState<{ id: string; title: string; tracks: Song[] } | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const tokenData = localStorage.getItem("spotify_tokens");
  const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };
  const apiUrl = import.meta.env.VITE_API_URL;

  const loadPlaylist = useCallback(async () => {
    if (!playlistId) return;
    setIsLoading(true);
    const res = await axios.get(`${apiUrl}/playlists/${playlistId}`, authHeader);
    setPlaylist(res.data);
    setAddedTracks(new Set(res.data.tracks.map((t: Song) => t.id)));
    setIsLoading(false);
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(async () => {
      if (!value.trim()) {
        setResults([]);
        return;
      }
      const data = await search(value.trim());
      setResults(data.tracks);
    }, 300);

    setSearchTimeout(timeout);
  };

  const addTrack = async (trackId: string) => {
    try {
      await axios.post(`${apiUrl}/playlists/${playlistId}/tracks`, { track_id: trackId, position: null }, authHeader);
      await loadPlaylist();
    } catch (err) {
      console.error("Failed to add track", err);
    }
  };

  const removeTrack = async (trackId: string) => {
    try {
      await axios.delete(`${apiUrl}/playlists/${playlistId}/tracks/${trackId}`, authHeader);
      if (playlist) {
        setPlaylist({ ...playlist, tracks: playlist.tracks.filter((t) => t.id !== trackId) });
      }
      setAddedTracks((prev) => {
        const copy = new Set(prev);
        copy.delete(trackId);
        return copy;
      });
    } catch (err) {
      console.error("Failed to remove track", err);
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist) return;
    const isPlaylistPlaying = isPlaying && playlist.tracks.some((s) => s.id === currentSong?.id);
    if (isPlaylistPlaying) {
      togglePlay();
      return;
    }
    const currentIndex = playlist.tracks.findIndex((s) => s.id === currentSong?.id);
    playAlbum(playlist.tracks, currentIndex >= 0 ? currentIndex : 0);
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playAlbum(playlist?.tracks || [], index);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || !playlist) {
    return (
      <main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
        <Topbar />
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
          <p className="text-sm text-spotify-text-muted">Loading...</p>
        </div>
      </main>
    );
  }

  const isPlaylistPlaying = isPlaying && playlist.tracks.some((s) => s.id === currentSong?.id);

  return (
    <main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
      <Topbar />
      <div className="relative h-[260px] min-h-[260px] sm:h-[320px] sm:min-h-[320px] md:h-[360px] md:min-h-[360px] lg:h-[420px] lg:min-h-[420px] overflow-hidden">
        <img src={activeSkin?.banners?.player || activeSkin?.banner_url || "/album-header-bg.png"} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-spotify-charcoal" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5 lg:gap-6">
            <div className="h-28 w-28 rounded bg-white/10 shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 flex items-center justify-center text-white font-bold">🎵</div>
            <div className="flex min-w-0 flex-col justify-end">
              <h1 className="mt-2 mb-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:mb-4">{playlist.title}</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-spotify-text-muted sm:text-sm">
                <span>{playlist.tracks.length} songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 scrollbar-spotify">
        <div className="relative z-10 px-4 pb-28 pt-5 sm:px-5 sm:pt-6 md:px-6 md:pb-32">
          <div className="flex items-center gap-4 pb-4">
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-spotify-green shadow-xl transition-all hover:scale-105 hover:bg-spotify-green-hover sm:h-14 sm:w-14"
              onClick={handlePlayPlaylist}
            >
              {isPlaylistPlaying ? (
                <Pause className="h-6 w-6 text-black sm:h-7 sm:w-7" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-6 w-6 text-black sm:h-7 sm:w-7" fill="currentColor" />
              )}
            </Button>
          </div>

          <Input
            placeholder="Search tracks to add..."
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12 h-12 rounded-full bg-white/10 border-0 text-white mb-6"
          />

          {results.length > 0 && (
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Search Results</h2>
              <div className="space-y-2">
                {results.map((song) => {
                  const isAdded = addedTracks.has(song.id);
                  return (
                    <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                      <img src={song.image_url || "/album-placeholder.png"} className="h-12 w-12 rounded" />
                      <div className="flex-1">
                        <p className="text-white">{song.title}</p>
                        <p className="text-sm text-spotify-text-muted">{song.artist}</p>
                      </div>
                      <Button
                        size="icon"
                        disabled={isAdded}
                        onClick={() => addTrack(song.id)}
                        className={`rounded-full ${isAdded ? "bg-green-600 cursor-not-allowed" : "bg-spotify-green hover:bg-spotify-green-hover"}`}
                      >
                        {isAdded ? <Check className="h-5 w-5 text-black" /> : <Plus className="h-5 w-5 text-black" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {playlist.tracks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Playlist Tracks</h2>
              <div className="space-y-2">
                {playlist.tracks.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      className={`group flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors sm:gap-4 sm:px-3 ${
                        isCurrent ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                      onClick={() => handlePlaySong(song, index)}
                    >
                      <div className="flex w-6 shrink-0 items-center justify-center text-xs text-spotify-text-muted group-hover:text-white sm:w-8 sm:text-sm">
                        {isCurrent && isPlaying ? (
                          <div className="flex h-4 items-center justify-center gap-0.5">
                            <div className="h-3 w-1 rounded bg-spotify-green animate-pulse" />
                            <div className="h-4 w-1 rounded bg-spotify-green animate-pulse delay-75" />
                            <div className="h-2 w-1 rounded bg-spotify-green animate-pulse delay-150" />
                          </div>
                        ) : (
                          <span className="group-hover:hidden">{index + 1}</span>
                        )}
                      </div>

                      <div className="hidden w-6 shrink-0 group-hover:flex items-center justify-center sm:w-8">
                        <Play className="h-4 w-4 text-white" fill="currentColor" />
                      </div>

                      <img src={song.image_url || "/album-placeholder.png"} className="h-10 w-10 shrink-0 rounded object-cover sm:h-11 sm:w-11" />

                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium sm:text-base ${isCurrent ? "text-spotify-green" : "text-white"}`}>{song.title}</p>
                        <p className="truncate text-xs text-spotify-text-muted sm:text-sm">{song.artist}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          isSongLiked(song.id) ? unlikeSong(song.id) : likeSong(song);
                        }}
                        className={`shrink-0 transition-transform hover:scale-110 ${isSongLiked(song.id) ? "" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${isSongLiked(song.id) ? "text-spotify-green" : "text-white/50 hover:text-white"}`}
                          fill={isSongLiked(song.id) ? "currentColor" : "none"}
                        />
                      </button>

                      <span className="shrink-0 text-xs text-spotify-text-muted sm:text-sm">{formatDuration(song.duration)}</span>

                      <Button size="icon" variant="ghost" onClick={() => removeTrack(song.id)} className="opacity-0 group-hover:opacity-100 transition ml-2">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default PlaylistEditPage;