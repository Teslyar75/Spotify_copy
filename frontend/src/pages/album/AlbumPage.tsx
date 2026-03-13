import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useArtistStore } from "@/stores/useArtistStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import Topbar from "@/components/Topbar";
import { Album, Song } from "@/types";

const AlbumPage = () => {
	const { albumId } = useParams<{ albumId: string }>();
	const { fetchAlbumById } = useMusicStore();
	const { currentSong, isPlaying, togglePlay, playAlbum } = usePlayerStore();
	const { openArtist } = useArtistStore();
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
			<main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
				<Topbar />
				<div className="flex flex-1 items-center justify-center p-6 sm:p-8">
					<p className="text-sm text-spotify-text-muted">Loading...</p>
				</div>
			</main>
		);
	}

	const isAlbumPlaying = isPlaying && album.songs.some((s) => s.id === currentSong?.id);

	return (
		<main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
			<div className="relative h-[260px] min-h-[260px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal sm:h-[320px] sm:min-h-[320px] md:h-[360px] md:min-h-[360px] lg:h-[420px] lg:min-h-[420px]">
				<Topbar />

				<div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5 lg:gap-6">
						<img
							src={album.image_url || "/album-placeholder.png"}
							alt={album.title}
							className="h-28 w-28 rounded object-cover shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48"
						/>

						<div className="flex min-w-0 flex-col justify-end">
							<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
								Album
							</p>

							<h1 className="mt-2 mb-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:mb-4">
								{album.title}
							</h1>

							<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-spotify-text-muted sm:text-sm">
								<button
									onClick={() =>
										openArtist({ name: album.artist, imageUrl: album.image_url })
									}
									className="font-semibold text-white hover:text-spotify-green hover:underline"
								>
									{album.artist}
								</button>
								<span>•</span>
								<span>{album.release_year}</span>
								<span>•</span>
								<span>{album.songs.length} songs</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="relative z-10 -mt-4 px-4 pb-28 pt-0 sm:-mt-5 sm:px-5 md:-mt-6 md:px-6 md:pb-32">
					<div className="pb-4">
						<Button
							size="icon"
							className="h-12 w-12 rounded-full bg-spotify-green shadow-xl transition-all hover:scale-105 hover:bg-spotify-green-hover sm:h-14 sm:w-14"
							onClick={handlePlayAlbum}
						>
							{isAlbumPlaying ? (
								<Pause className="h-6 w-6 text-black sm:h-7 sm:w-7" fill="currentColor" />
							) : (
								<Play
									className="ml-0.5 h-6 w-6 text-black sm:h-7 sm:w-7"
									fill="currentColor"
								/>
							)}
						</Button>
					</div>

					<div className="space-y-1">
						{album.songs.map((song, index) => {
							const isCurrentSong = currentSong?.id === song.id;

							return (
								<div
									key={song.id}
									className={`group flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors sm:gap-4 sm:px-3 ${
										isCurrentSong ? "bg-white/10" : "hover:bg-white/5"
									}`}
									onClick={() => handlePlaySong(song, index)}
								>
									<div className="flex w-6 shrink-0 items-center justify-center text-xs text-spotify-text-muted group-hover:text-white sm:w-8 sm:text-sm">
										{isCurrentSong && isPlaying ? (
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

									<img
										src={song.image_url || "/album-placeholder.png"}
										alt={song.title}
										className="h-10 w-10 shrink-0 rounded object-cover sm:h-11 sm:w-11"
									/>

									<div className="min-w-0 flex-1">
										<p
											className={`truncate text-sm font-medium sm:text-base ${
												isCurrentSong ? "text-spotify-green" : "text-white"
											}`}
										>
											{song.title}
										</p>
										<p className="truncate text-xs text-spotify-text-muted sm:text-sm">
											{song.artist}
										</p>
									</div>

									<span className="shrink-0 text-xs text-spotify-text-muted sm:text-sm">
										{formatDuration(song.duration)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default AlbumPage;