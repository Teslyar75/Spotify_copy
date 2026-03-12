import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import Topbar from "@/components/Topbar";
import { Button } from "@/components/ui/button";

const NewPlaylistPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlaylist = async () => {
    if (!title.trim()) {
      setError("Please enter a playlist name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/playlists", { title: title.trim() });
      navigate("/library"); // после создания возвращаем в библиотеку
    } catch (err: any) {
      console.error("Failed to create playlist:", err);
      setError("Failed to create playlist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-spotify-charcoal">
      <Topbar />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold text-white mb-4">Create New Playlist</h1>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Playlist name"
          className="w-full max-w-md p-3 rounded bg-white/10 text-white placeholder-white/60 mb-4 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <Button
          onClick={handleCreatePlaylist}
          disabled={isLoading}
          className="bg-spotify-green hover:bg-spotify-green-hover px-6 py-3 text-black font-bold"
        >
          {isLoading ? "Creating..." : "Create Playlist"}
        </Button>
      </div>
    </main>
  );
};

export default NewPlaylistPage;