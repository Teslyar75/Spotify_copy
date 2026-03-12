import { Song } from "@/types";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useArtistStore } from "@/stores/useArtistStore";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { Link } from "react-router-dom";

interface SectionGridProps {
	title: string;
	songs: Song[];
	isLoading: boolean;
}

const SectionGrid = ({ title, songs, isLoading }: SectionGridProps) => {
	const { setCurrentSong, isPlaying, currentSong } = usePlayerStore();
	const { openArtist } = useArtistStore();

	const handlePlay = (e: React.MouseEvent, song: Song) => {
		e.preventDefault();
		e.stopPropagation();
		if (currentSong?.id === song.id) return;
		setCurrentSong(song);
	};

	if (isLoading) {
		return (
			<section>
				<h2 className="text-xl font-bold text-white mb-4">{title}</h2>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="space-y-3">
							<Skeleton className="aspect-square rounded-lg bg-white/10" />
							<Skeleton className="h-4 w-3/4 bg-white/10" />
							<Skeleton className="h-3 w-1/2 bg-white/10" />
						</div>
					))}
				</div>
			</section>
		);
	}

	if (songs.length === 0) return null;

	return (
		<section>
			<h2 className="text-xl font-bold text-white mb-4">{title}</h2>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{songs.map((song) => {
					const isActive = currentSong?.id === song.id;
					const albumId = song.album_id;

					return (
						<Link
							key={song.id}
							to={albumId ? `/albums/${albumId}` : "#"}
							className="group relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer"
						>
							<div className="relative mb-4">
								<img
									src={song.image_url || "/album-placeholder.png"}
									alt={song.title}
									className="aspect-square object-cover rounded-lg shadow-spotify-card w-full"
								/>
								<Button
									size="icon"
									onClick={(e) => handlePlay(e, song)}
									className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-xl border-0"
								>
									<Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
								</Button>
							</div>
							<h3 className="font-semibold text-white truncate mb-1">{song.title}</h3>
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									openArtist({ name: song.artist, imageUrl: song.image_url });
								}}
								className="text-sm text-spotify-text-muted truncate hover:text-spotify-green hover:underline text-left block w-full"
							>
								{song.artist}
							</button>
						</Link>
					);
				})}
			</div>
		</section>
	);
};

export default SectionGrid;
