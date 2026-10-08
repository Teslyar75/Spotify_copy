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

	const handlePlayAlbum = (e: React.MouseEvent, albumSongs: any[] | undefined) => {
		e.preventDefault();
		e.stopPropagation();
		if (albumSongs?.length) playAlbum(albumSongs, 0);
	};

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	const navLinkClass = (isActive: boolean) =>
		`flex items-center gap-4 rounded-md transition-all px-3 py-2.5 ${
			isActive
				? "bg-white/10 text-white"
				: "text-spotify-text-muted hover:text-white hover:bg-white/5"
		}`;

	return (
		<div className="h-full flex flex-col bg-black">
			{/* Logo */}
			<div className="px-6 py-6 flex items-center">
				<Link to="/" className="flex items-center gap-3 group min-w-0">
					<img src="/spotify.png" className="h-10 w-10 shrink-0" alt="Spotify" />
					<span className="font-bold text-white text-lg tracking-tight truncate">Spotify</span>
				</Link>
			</div>

			<nav className="px-3 mb-2">
				<Link to="/" className={navLinkClass(location.pathname === "/")}>
					<Home className="h-6 w-6 shrink-0" fill={location.pathname === "/" ? "currentColor" : "none"} />
					<span className="font-medium text-sm truncate">Home</span>
				</Link>
				<Link to="/search" className={navLinkClass(location.pathname === "/search")}>
					<Search className="h-6 w-6 shrink-0" fill={location.pathname === "/search" ? "currentColor" : "none"} />
					<span className="font-medium text-sm truncate">Search</span>
				</Link>
				<Link to="/library" className={navLinkClass(location.pathname === "/library")}>
					<Library className="h-6 w-6 shrink-0" fill={location.pathname === "/library" ? "currentColor" : "none"} />
					<span className="font-medium text-sm truncate">Your Library</span>
				</Link>
			</nav>

			<ScrollArea className="flex-1 px-3 pt-2 scrollbar-spotify">
				<div className="space-y-6 pb-6">
					<div>
						<div className="flex items-center gap-2 px-3 mb-2">
							<Library className="h-5 w-5 text-spotify-text-muted" />
							<span className="text-sm font-medium text-spotify-text-muted">Albums</span>
						</div>
						<div className="space-y-1">
							{albums.map((album) => (
								<Link
									key={album.id}
									to={`/albums/${album.id}`}
									className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
								>
								<img
									src={album.image_url || "/album-placeholder.png"}
									alt={album.title}
									className="h-10 w-10 rounded object-cover shadow-md shrink-0"
									onError={(e) => { (e.target as HTMLImageElement).src = "/album-placeholder.png"; }}
								/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate text-white">{album.title}</p>
										<p className="text-xs text-spotify-text-muted truncate">{album.artist}</p>
									</div>
								<Button
									variant="ghost"
									size="icon"
									className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full skin-accent-bg text-white shrink-0"
									onClick={(e) => handlePlayAlbum(e, album.songs)}
								>
									<Play className="h-4 w-4 ml-0.5" fill="currentColor" />
								</Button>
								</Link>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};

export default LeftSidebar;
