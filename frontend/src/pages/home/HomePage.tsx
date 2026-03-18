import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";

const HomePage = () => {
	const {
		fetchFeaturedSongs,
		fetchMadeForYouSongs,
		fetchTrendingSongs,
		fetchTracksByGenre,
		isLoading,
		madeForYouSongs,
		featuredSongs,
		trendingSongs,
	} = useMusicStore();

	const [tracksByGenre, setTracksByGenre] = useState<Record<string, Song[]>>({});
	const [isLoadingGenres, setIsLoadingGenres] = useState(false);

	const { initializeQueue } = usePlayerStore();

	useEffect(() => {
		fetchFeaturedSongs();
		fetchMadeForYouSongs();
		fetchTrendingSongs();
	}, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

	useEffect(() => {
		let cancelled = false;
		setIsLoadingGenres(true);
		fetchTracksByGenre().then((data) => {
			if (!cancelled) {
				setTracksByGenre(data);
				setIsLoadingGenres(false);
			}
		});
		return () => { cancelled = true; };
	}, [fetchTracksByGenre]);

	useEffect(() => {
		if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {
			const allSongs = [...featuredSongs, ...madeForYouSongs, ...trendingSongs];
			initializeQueue(allSongs);
		}
	}, [initializeQueue, madeForYouSongs, trendingSongs, featuredSongs]);

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	};

	return (
		<main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal overflow-hidden">
		{/* Header с фоновой картинкой */}
		<div className="relative h-[220px] min-h-[220px] sm:h-[260px] sm:min-h-[260px] md:h-[300px] md:min-h-[300px] lg:h-[332px] lg:min-h-[332px] overflow-hidden">
			{/* Фоновое изображение */}
			<img
				src="/home-header-bg.png"
				alt=""
				className="absolute inset-0 h-full w-full object-cover object-center"
			/>
			{/* Градиент для читаемости текста */}
			<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-spotify-charcoal" />

			<div className="relative z-10">
				<Topbar />
			</div>

			<div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
				<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
					{getGreeting()}
				</h1>

				<p className="text-xs sm:text-sm text-white/70 drop-shadow max-w-[520px]">
					We'll recommend music based on your taste
				</p>
			</div>
		</div>

			{/* Content */}
			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="relative z-10 -mt-6 px-4 pb-28 pt-0 sm:-mt-7 sm:px-5 md:-mt-8 md:px-6 md:pb-32">
					<div className="space-y-8 md:space-y-10">
						<SectionGrid 
							title="Made For You" 
							songs={madeForYouSongs} 
							isLoading={isLoading} 
						/>

						<SectionGrid 
							title="Featured" 
							songs={featuredSongs} 
							isLoading={isLoading} 
						/>

						<SectionGrid 
							title="Trending" 
							songs={trendingSongs} 
							isLoading={isLoading} 
						/>

						{Object.entries(tracksByGenre).map(([genre, songs]) => (
							<SectionGrid
								key={genre}
								title={genre}
								songs={songs}
								isLoading={isLoadingGenres}
							/>
						))}
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default HomePage;
