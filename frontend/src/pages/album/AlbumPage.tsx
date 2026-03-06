import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import Topbar from "@/components/Topbar";
import { Album, Song } from "@/types";

const AlbumPage = () => {
	const { albumId } = useParams<{ albumId: string }>();
	const { fetchAlbumById } = useMusicStore();
	const { currentSong, isPlaying, togglePlay, playAlbum } = usePlayerStore();
	const [album, setAlbum] = useState<Album | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadAlbum = async () => {
			if (!albumId) return;
			setIsLoading(true);
			const data = await fetchAlbumById(albumId);
			setAlbum(data);
			setIsLoading(false);
		};
		loadAlbum();
	}, [albumId, fetchAlbumById]);

	const handlePlayAlbum = () => {
		if (!album) return;
		const currentIndex = album.songs.findIndex((s) => s.id === currentSong?.id);
		playAlbum(album.songs, currentIndex >= 0 ? currentIndex : 0);
	};

	const handlePlaySong = (song: Song, index: number) => {
		if (currentSong?.id === song.id) {
			togglePlay();
		} else {
			playAlbum(album?.songs || [], index);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (isLoading || !album) {
		return (
			<main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal">
				<Topbar />
				<div className="p-8 flex items-center justify-center flex-1">
					<p className="text-spotify-text-muted">Loading...</p>
				</div>
			</main>
		);
	}

	return (
		<main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal">
			{/* Header with gradient from album art */}
			<div className="h-[340px] min-h-[340px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal relative">
				<Topbar />
				<div className="absolute bottom-0 left-0 right-0 p-6">
					<div className="flex gap-6 items-end">
						<img
							src={album.image_url || "/album-placeholder.png"}
							alt={album.title}
							className="h-48 w-48 object-cover shadow-2xl rounded"
						/>
						<div className="flex flex-col justify-end pb-2">
							<p className="text-sm uppercase font-bold text-white/80 tracking-wider">Album</p>
							<h1 className="text-4xl font-bold text-white mt-2 mb-4">{album.title}</h1>
							<div className="flex items-center gap-2 text-sm text-spotify-text-muted">
								<span className="font-semibold text-white">{album.artist}</span>
								<span>•</span>
								<span>{album.release_year}</span>
								<span>•</span>
								<span>{album.songs.length} songs</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Play button & tracks */}
			<div className="bg-spotify-charcoal">
				<div className="px-6 pb-4">
					<Button
						size="icon"
						className="h-14 w-14 rounded-full bg-spotify-green hover:bg-spotify-green-hover hover:scale-105 transition-all shadow-xl"
						onClick={handlePlayAlbum}
					>
						{isPlaying && album.songs.some((s) => s.id === currentSong?.id) ? (
							<Pause className="h-7 w-7 text-black" fill="currentColor" />
						) : (
							<Play className="h-7 w-7 text-black ml-0.5" fill="currentColor" />
						)}
					</Button>
				</div>

				<ScrollArea className="h-[calc(100vh-480px)] scrollbar-spotify">
					<div className="px-6 space-y-1">
						{album.songs.map((song, index) => {
							const isCurrentSong = currentSong?.id === song.id;

							return (
								<div
									key={song.id}
									className={`group flex items-center gap-4 px-3 py-2 rounded-md cursor-pointer transition-colors ${
										isCurrentSong ? "bg-white/10" : "hover:bg-white/5"
									}`}
									onClick={() => handlePlaySong(song, index)}
								>
									<div className="w-8 text-center text-spotify-text-muted group-hover:text-white">
										{isCurrentSong && isPlaying ? (
											<div className="flex gap-0.5 justify-center items-center h-4">
												<div className="w-1 h-3 bg-spotify-green animate-pulse rounded" />
												<div className="w-1 h-4 bg-spotify-green animate-pulse rounded delay-75" />
												<div className="w-1 h-2 bg-spotify-green animate-pulse rounded delay-150" />
											</div>
										) : (
											<span className="group-hover:hidden">{index + 1}</span>
										)}
									</div>
									<div className="w-8 hidden group-hover:block">
										<Play className="h-4 w-4 mx-auto text-white" fill="currentColor" />
									</div>

									<img
										src={song.image_url || "/album-placeholder.png"}
										alt={song.title}
										className="h-10 w-10 rounded object-cover"
									/>

									<div className="flex-1 min-w-0">
										<p
											className={`font-medium truncate ${
												isCurrentSong ? "text-spotify-green" : "text-white"
											}`}
										>
											{song.title}
										</p>
										<p className="text-sm text-spotify-text-muted truncate">{song.artist}</p>
									</div>

									<span className="text-sm text-spotify-text-muted">
										{formatDuration(song.duration)}
									</span>
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</div>
		</main>
	);
};

export default AlbumPage;
