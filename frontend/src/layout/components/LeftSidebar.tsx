import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Home, Search, Library } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { isCancel } from "axios";

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

	const navLinkClass = (isActive: boolean) =>
		`flex items-center md:justify-center lg:justify-start gap-3 lg:gap-4 rounded-md transition-all px-3 py-2.5 lg:px-3 lg:py-2 ${
			isActive
				? "bg-white/10 text-white"
				: "text-spotify-text-muted hover:text-white hover:bg-white/5"
		}`;

	return (
		<div className="h-full flex flex-col bg-black">
			{/* Logo */}
			<div className="px-3 py-4 lg:px-6 lg:py-6 flex justify-center lg:justify-start">
				<Link to="/" className="flex items-center gap-3 group min-w-0">
					<img 
						src="/spotify.png" 
						className="h-8 w-8 lg:h-10 lg:w-10 shrink-0" 
						alt="Spotify" 
					/>
					<span className="hidden lg:block font-bold text-white text-lg xl:text-xl tracking-tight truncate">
						Spotify
					</span>
				</Link>
			</div>

			{/* Main nav - как в Spotify */}
			<nav className="px-2 lg:px-3 mb-2">
				<Link
					to="/"
					className={navLinkClass(location.pathname === "/")}>
					<Home 
						className="h-5 w-5 lg:h-6 lg:w-6 shrink-0" 
						fill={location.pathname === "/" ? "currentColor" : "none"} 
					/>
					<span className="hidden lg:block font-medium text-sm lg:text-base truncate">
						Home
					</span>
				</Link>

				<Link
					to="/search"
					className={navLinkClass(location.pathname === "/search")}
				>
					<Search 
						className="h-5 w-5 lg:h-6 lg:w-6 shrink-0" 
						fill={location.pathname === "/search" ? "currentColor" : "none"} 
					/>
					<span className="hidden lg:block font-medium text-sm lg:text-base truncate">
						Search
					</span>
				</Link>

				<Link
					to="/library"
					className={navLinkClass(location.pathname === "/library")}
				>
					<Library 
						className="h-5 w-5 lg:h-6 lg:w-6 shrink-0" 
						fill={location.pathname === "/library" ? "currentColor" : "none"} 
					/>
					<span className="hidden lg:block font-medium text-sm lg:text-base truncate">
						Your Library
					</span>
				</Link>
			</nav>

			{/* Playlists & Albums */}
			<ScrollArea className="hidden lg:block flex-1 px-2 lg:px-3 pt-2 scrollbar-spotify">
				<div className="space-y-4 lg:space-y-6 pb-4 lg:pb-6">
					{/* Albums */}
					<div className="hidden lg:block">
						<div className="flex items-center gap-2 px-3 mb-2">
							<button className="p-2 rounded-full hover:bg-white/10 transition-colors shrink-0">
								<Library className="h-4 w-4 lg:h-5 lg:w-5 text-spotify-text-muted" />
							</button>

							<span className="text-xs lg:text-sm font-medium text-spotify-text-muted hover:text-white transition-colors cursor-pointer truncate">
								Albums
							</span>
						</div>

						<div className="space-y-1">
							{albums.slice(0, 8).map((album) => (
								<div
									key={album.id}
									className="group flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
									onClick={() => handlePlayAlbum(album.songs)}
								>
									<img
										src={album.image_url || "/album-placeholder.png"}
										alt={album.title}
										className="h-9 w-9 lg:h-10 lg:w-10 rounded object-cover shadow-md shrink-0"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-xs lg:text-sm font-medium truncate text-white">
											{album.title}
										</p>
										<p className="text-[11px] lg:text-xs text-spotify-text-muted truncate">
											{album.artist}
										</p>
									</div>

									<Button
										variant="ghost"
										size="icon"
										className="hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black hover:scale-110 shrink-0"
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
