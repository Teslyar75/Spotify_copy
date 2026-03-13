import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import { Playlist, Album } from "@/types";
import { axiosInstance } from "@/lib/axios";

const LibraryPage = () => {
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
		if (playlist.tracks?.length) {
			playAlbum(playlist.tracks, 0);
		}
	};

	const handlePlayAlbum = (album: Album) => {
		playAlbum(album.songs, 0);
	};

	return (
		<main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
			<div className="relative h-[220px] min-h-[220px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal sm:h-[260px] sm:min-h-[260px] md:h-[300px] md:min-h-[300px] lg:h-[340px] lg:min-h-[340px]">
				<Topbar />

				<div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
					<h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:mb-5 md:text-4xl">
						Your Library
					</h1>

					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => setActiveTab("playlists")}
							className={`rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5 md:px-6 ${
								activeTab === "playlists"
									? "bg-white text-black"
									: "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							Playlists
						</button>

						<button
							onClick={() => setActiveTab("albums")}
							className={`rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5 md:px-6 ${
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
				<div className="relative z-10 -mt-6 px-4 pb-28 pt-0 sm:-mt-7 sm:px-5 md:-mt-8 md:px-6 md:pb-32">
					{isLoading ? (
						<p className="text-sm text-spotify-text-muted">Loading...</p>
					) : activeTab === "playlists" ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
							{/* Create playlist card */}
							<div className="relative flex min-h-[170px] items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-3 transition-colors hover:bg-white/10 sm:min-h-[190px] sm:p-4">
								<Plus className="h-10 w-10 text-spotify-text-muted sm:h-12 sm:w-12" />
								<p className="absolute bottom-3 left-3 right-3 truncate text-sm font-medium text-white sm:bottom-4 sm:left-4 sm:right-4">
									Create playlist
								</p>
							</div>

							{playlists.map((playlist) => (
								<div
									key={playlist.id}
									className="group cursor-pointer rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10 sm:p-4"
									onClick={() => handlePlayPlaylist(playlist)}
								>
									<div className="relative mb-3">
										<div className="aspect-square w-full rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
											<Play className="h-10 w-10 text-white/80 sm:h-12 sm:w-12" />
										</div>

										<Button
											size="icon"
											className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-spotify-green opacity-0 shadow-xl transition-all hover:bg-spotify-green-hover group-hover:opacity-100 md:h-12 md:w-12"
										>
											<Play
												className="ml-0.5 h-4 w-4 text-black md:h-5 md:w-5"
												fill="currentColor"
											/>
										</Button>
									</div>

									<p className="truncate text-sm font-medium text-white sm:text-base">
										{playlist.title}
									</p>
									<p className="text-xs text-spotify-text-muted sm:text-sm">
										Playlist • {playlist.tracks?.length || 0} songs
									</p>
								</div>
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
							{albums.map((album) => (
								<div
									key={album.id}
									className="group cursor-pointer rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10 sm:p-4"
									onClick={() => handlePlayAlbum(album)}
								>
									<div className="relative mb-3">
										<img
											src={album.image_url || "/album-placeholder.png"}
											alt={album.title}
											className="aspect-square w-full rounded-lg object-cover"
										/>

										<Button
											size="icon"
											className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-spotify-green opacity-0 shadow-xl transition-all hover:bg-spotify-green-hover group-hover:opacity-100 md:h-12 md:w-12"
										>
											<Play
												className="ml-0.5 h-4 w-4 text-black md:h-5 md:w-5"
												fill="currentColor"
											/>
										</Button>
									</div>

									<p className="truncate text-sm font-medium text-white sm:text-base">
										{album.title}
									</p>
									<p className="truncate text-xs text-spotify-text-muted sm:text-sm">
										{album.artist}
									</p>
								</div>
							))}
						</div>
					)}

					{activeTab === "playlists" && playlists.length === 0 && !isLoading && (
						<p className="py-8 text-sm text-spotify-text-muted">
							You don't have any playlists yet. Create one to get started.
						</p>
					)}

					{activeTab === "albums" && albums.length === 0 && !isLoading && (
						<p className="py-8 text-sm text-spotify-text-muted">
							No albums in your library. Browse and add some!
						</p>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default LibraryPage;