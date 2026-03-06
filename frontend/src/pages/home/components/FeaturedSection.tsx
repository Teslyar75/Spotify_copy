import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect } from "react";
import { Song } from "@/types";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";

const FeaturedSection = () => {
	const { featuredSongs, isLoading } = useMusicStore();
	const { setCurrentSong } = usePlayerStore();

	if (isLoading || featuredSongs.length === 0) return null;

	const featured = featuredSongs.slice(0, 6);

	return (
		<div className='mb-8'>
			<h2 className='text-xl font-bold mb-4'>Featured</h2>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
				{featured.map((song, index) => (
					<div
						key={song.id}
						className={`group relative flex gap-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg overflow-hidden transition-colors cursor-pointer ${
							index === 0 ? "sm:col-span-2" : ""
						}`}
						onClick={() => setCurrentSong(song)}
					>
						<img
							src={song.image_url || "/album-placeholder.png"}
							alt={song.title}
							className='h-20 w-20 sm:h-24 sm:w-24 object-cover shadow-lg'
						/>
						<div className='flex-1 flex items-center justify-between pr-4'>
							<div>
								<h3 className='font-bold text-lg'>{song.title}</h3>
								<p className='text-sm text-zinc-400'>{song.artist}</p>
							</div>
							<Button
								size='icon'
								className='h-12 w-12 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 shadow-xl'
							>
								<Play className='h-5 w-5 text-black ml-1' />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default FeaturedSection;
