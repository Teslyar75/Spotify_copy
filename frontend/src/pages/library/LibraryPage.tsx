import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "@/components/Topbar";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import { Playlist, Album } from "@/types";
import { axiosInstance } from "@/lib/axios";

const LibraryPage = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<"playlists" | "albums">("playlists");
  const [isLoading, setIsLoading] = useState(true);

  const { playAlbum } = usePlayerStore();
  const { fetchAlbums, albums } = useMusicStore();

  useEffect(() => {
    const loadPlaylists = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get<Playlist[]>("/playlists/me");
        setPlaylists(res.data);
      } catch (error) {
        console.error("Library load error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlaylists();
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks?.length) playAlbum(playlist.tracks, 0);
  };

  const handlePlayAlbum = (album: Album) => {
    playAlbum(album.songs, 0);
  };

  const handleCreatePlaylist = () => {
    navigate("/playlists/new");
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal">
      <div className="h-[340px] min-h-[340px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal relative">
        <Topbar />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-4xl font-bold text-white mb-6">Your Library</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("playlists")}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "playlists"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab("albums")}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "albums"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Albums
            </button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 scrollbar-spotify">
        <div className="p-6">
          {isLoading ? (
            <p className="text-spotify-text-muted">Loading...</p>
          ) : activeTab === "playlists" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Create playlist card */}
              <div
                className="relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-h-[200px] flex items-center justify-center border-2 border-dashed border-white/20 cursor-pointer"
                onClick={handleCreatePlaylist}
              >
                <Plus className="h-12 w-12 text-spotify-text-muted" />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white truncate">
                  Create playlist
                </p>
              </div>

              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => handlePlayPlaylist(playlist)}
                >
                  <div className="relative mb-3">
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white/80" />
                    </div>
                    <Button
                      size="icon"
                      className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover opacity-0 group-hover:opacity-100 shadow-xl"
                    >
                      <Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                  <p className="font-medium text-white truncate">{playlist.title}</p>
                  <p className="text-sm text-spotify-text-muted">
                    Playlist • {playlist.tracks?.length || 0} songs
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => handlePlayAlbum(album)}
                >
                  <div className="relative mb-3">
                    <img
                      src={album.image_url || "/album-placeholder.png"}
                      alt={album.title}
                      className="aspect-square object-cover rounded-lg w-full"
                    />
                    <Button
                      size="icon"
                      className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover opacity-0 group-hover:opacity-100 shadow-xl"
                    >
                      <Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                    </Button>
                  </div>
                  <p className="font-medium text-white truncate">{album.title}</p>
                  <p className="text-sm text-spotify-text-muted truncate">{album.artist}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "playlists" && playlists.length === 0 && !isLoading && (
            <p className="text-spotify-text-muted py-8">
              You don't have any playlists yet. Create one to get started.
            </p>
          )}

          {activeTab === "albums" && albums.length === 0 && !isLoading && (
            <p className="text-spotify-text-muted py-8">
              No albums in your library. Browse and add some!
            </p>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default LibraryPage;