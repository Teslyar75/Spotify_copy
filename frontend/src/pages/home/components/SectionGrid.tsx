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
	const { setCurrentSong, currentSong } = usePlayerStore();
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
				<h2 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-xl">
					{title}
				</h2>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="space-y-2 sm:space-y-3">
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
			<h2 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-xl">
				{title}
			</h2>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{songs.map((song) => {
					const albumId = song.album_id;

					return (
						<Link
							key={song.id}
							to={albumId ? `/albums/${albumId}` : "#"}
							className="group relative rounded-lg bg-white/5 p-3 transition-all duration-200 hover:bg-white/10 sm:p-4 cursor-pointer"
						>
							<div className="relative mb-3 sm:mb-4">
								<img
									src={song.image_url || "/album-placeholder.png"}
									alt={song.title}
									className="aspect-square w-full rounded-lg object-cover shadow-spotify-card"
								/>

								<Button
									size="icon"
									onClick={(e) => handlePlay(e, song)}
									className="absolute bottom-2 right-2 h-10 w-10 rounded-full border-0 bg-spotify-green opacity-0 shadow-xl transition-all hover:scale-110 hover:bg-spotify-green-hover group-hover:opacity-100 md:h-12 md:w-12"
								>
									<Play className="ml-0.5 h-4 w-4 text-black md:h-5 md:w-5" 
									fill="currentColor" 
								/>
								</Button>
							</div>

							<h3 className="mb-1 truncate text-sm font-semibold text-white sm:text-base">
								{song.title}
							</h3>

							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									openArtist({ name: song.artist, imageUrl: song.image_url });
								}}
								className="block w-full truncate text-left text-xs text-spotify-text-muted hover:text-spotify-green hover:underline sm:text-sm"
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
