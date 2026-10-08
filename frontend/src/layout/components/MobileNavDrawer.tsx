import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMobileMenuStore } from "@/stores/useMobileMenuStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Home, Search, Library, Palette, X } from "lucide-react";

const MobileNavDrawer = () => {
	const { albums, fetchAlbums } = useMusicStore();
	const { playAlbum } = usePlayerStore();
	const { isOpen, close } = useMobileMenuStore();
	const location = useLocation();

	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	// Close on route change
	useEffect(() => {
		close();
	}, [location.pathname, close]);

	const handlePlayAlbum = (e: React.MouseEvent, albumSongs: any[] | undefined) => {
		e.preventDefault();
		e.stopPropagation();
		if (albumSongs?.length) playAlbum(albumSongs, 0);
	};

	if (!isOpen) return null;

	const navLinkClass = (isActive: boolean) =>
		`flex items-center gap-4 rounded-md px-4 py-3 text-base font-medium transition-colors ${
			isActive ? "bg-white/10 text-white" : "text-spotify-text-muted hover:text-white hover:bg-white/5"
		}`;

	return (
		<>
			<div
				className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
				onClick={close}
				aria-hidden="true"
			/>
			<aside
				className="fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] flex flex-col bg-spotify-sidebar border-r border-white/10 shadow-2xl lg:hidden transition-transform duration-200 ease-out"
				role="dialog"
				aria-label="Navigation menu"
			>
				<div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
					<Link to="/" className="flex items-center gap-3" onClick={close}>
						<img src="/spotify.png" className="h-10 w-10" alt="Spotify" />
						<span className="font-bold text-white text-lg">Spotify</span>
					</Link>
					<Button variant="ghost" size="icon" onClick={close} className="h-10 w-10 rounded-full">
						<X className="h-5 w-5" />
					</Button>
				</div>

				<nav className="p-3 space-y-1">
					<Link to="/" className={navLinkClass(location.pathname === "/")} onClick={close}>
						<Home className="h-6 w-6 shrink-0" fill={location.pathname === "/" ? "currentColor" : "none"} />
						Home
					</Link>
					<Link to="/search" className={navLinkClass(location.pathname === "/search")} onClick={close}>
						<Search className="h-6 w-6 shrink-0" fill={location.pathname === "/search" ? "currentColor" : "none"} />
						Search
					</Link>
				<Link to="/library" className={navLinkClass(location.pathname === "/library")} onClick={close}>
					<Library className="h-6 w-6 shrink-0" fill={location.pathname === "/library" ? "currentColor" : "none"} />
					Your Library
				</Link>
				<Link to="/skins" className={navLinkClass(location.pathname === "/skins")} onClick={close}>
					<Palette className="h-6 w-6 shrink-0" />
					Скины
				</Link>
				</nav>

				<div className="flex-1 min-h-0 flex flex-col px-3 pt-2">
					<div className="flex items-center gap-2 px-2 mb-2">
						<Library className="h-5 w-5 text-spotify-text-muted" />
						<span className="text-sm font-medium text-spotify-text-muted">Albums</span>
					</div>
					<ScrollArea className="flex-1 -mx-2 px-2 scrollbar-spotify">
						<div className="space-y-1 pb-6">
							{albums.map((album) => (
								<Link
									key={album.id}
									to={`/albums/${album.id}`}
									className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
									onClick={close}
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
										className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black shrink-0"
										onClick={(e) => handlePlayAlbum(e, album.songs)}
									>
										<Play className="h-4 w-4 ml-0.5" fill="currentColor" />
									</Button>
								</Link>
							))}
						</div>
					</ScrollArea>
				</div>
			</aside>
		</>
	);
};

export default MobileNavDrawer;
