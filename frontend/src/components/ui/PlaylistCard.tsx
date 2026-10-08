import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Play } from "lucide-react";
import { Playlist } from "@/types";

interface Props {
  playlist: Playlist;
  onDeleted: (id: string) => void;
  onPlay: (playlist: Playlist) => void;
}

const PlaylistCard = ({ playlist, onDeleted, onPlay }: Props) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const tokenData = localStorage.getItem("spotify_tokens");
  const accessToken = tokenData ? JSON.parse(tokenData).access_token : null;

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete playlist "${playlist.title}"?`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await axios.delete(`${apiUrl}/playlists/${playlist.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      onDeleted(playlist.id);
    } catch (e) {
      console.error("Delete failed", e);
      alert("Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => navigate(`/playlists/${playlist.id}`);

  return (
    <div
      className="group relative min-w-0 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer"
      onClick={() => onPlay(playlist)}
    >
      <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded mb-3 flex items-center justify-center">
        <Play className="h-12 w-12 text-white/80" />
      </div>

      <p className="font-medium text-white truncate">{playlist.title}</p>
      <p className="text-sm text-spotify-text-muted">
        Playlist • {playlist.tracks?.length || 0} songs
      </p>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
          className="bg-black/40 hover:bg-black/70"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isDeleting}
          className="bg-black/40 hover:bg-red-600/80"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlaylistCard;