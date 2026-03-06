import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Home, Search, Library } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";

const LeftSidebar = () => {
	const { albums, fetchAlbums } = useMusicStore();
	const { playAlbum } = usePlayerStore();
	const location = useLocation();

	const handlePlayAlbum = (albumSongs: any[]) => {
		playAlbum(albumSongs, 0);
	};

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	return (
		<div className="h-full flex flex-col bg-black">
			{/* Logo */}
			<div className="p-6">
				<Link to="/" className="flex items-center gap-3 group">
					<img src="/spotify.png" className="h-10 w-10" alt="Spotify" />
					<span className="font-bold text-white text-xl tracking-tight">Spotify</span>
				</Link>
			</div>

			{/* Main nav - как в Spotify */}
			<nav className="px-3 mb-2">
				<Link
					to="/"
					className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
						location.pathname === "/" ? "text-white" : "text-spotify-text-muted hover:text-white"
					}`}
				>
					<Home className="h-6 w-6" fill={location.pathname === "/" ? "currentColor" : "none"} />
					<span className="font-medium">Home</span>
				</Link>
				<Link
					to="/search"
					className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
						location.pathname === "/search" ? "text-white" : "text-spotify-text-muted hover:text-white"
					}`}
				>
					<Search className="h-6 w-6" fill={location.pathname === "/search" ? "currentColor" : "none"} />
					<span className="font-medium">Search</span>
				</Link>
				<Link
					to="/library"
					className={`flex items-center gap-4 px-3 py-2 rounded-md transition-colors ${
						location.pathname === "/library" ? "text-white" : "text-spotify-text-muted hover:text-white"
					}`}
				>
					<Library className="h-6 w-6" fill={location.pathname === "/library" ? "currentColor" : "none"} />
					<span className="font-medium">Your Library</span>
				</Link>
			</nav>

			{/* Playlists & Albums */}
			<ScrollArea className="flex-1 px-3 pt-2 scrollbar-spotify">
				<div className="space-y-6 pb-6">
					{/* Albums */}
					<div>
						<div className="flex items-center gap-2 px-3 mb-2">
							<button className="p-2 rounded-full hover:bg-white/10 transition-colors">
								<Library className="h-5 w-5 text-spotify-text-muted" />
							</button>
							<span className="text-sm font-medium text-spotify-text-muted hover:text-white transition-colors cursor-pointer">
								Albums
							</span>
						</div>
						<div className="space-y-1">
							{albums.slice(0, 8).map((album) => (
								<div
									key={album.id}
									className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
									onClick={() => handlePlayAlbum(album.songs)}
								>
									<img
										src={album.image_url || "/album-placeholder.png"}
										alt={album.title}
										className="h-10 w-10 rounded object-cover shadow-md"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate text-white">{album.title}</p>
										<p className="text-xs text-spotify-text-muted truncate">{album.artist}</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black hover:scale-110"
									>
										<Play className="h-4 w-4 ml-0.5" fill="currentColor" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};

export default LeftSidebar;
