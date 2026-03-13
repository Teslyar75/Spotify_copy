import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";

const HomePage = () => {
	const {
		fetchFeaturedSongs,
		fetchMadeForYouSongs,
		fetchTrendingSongs,
		isLoading,
		madeForYouSongs,
		featuredSongs,
		trendingSongs,
	} = useMusicStore();

	const { initializeQueue } = usePlayerStore();

	useEffect(() => {
		fetchFeaturedSongs();
		fetchMadeForYouSongs();
		fetchTrendingSongs();
	}, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

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
			{/* Gradient header - как в Spotify */}
			<div className="relative h-[220px] min-h-[220px] sm:h-[260px] sm:min-h-[260px] md:h-[300px] md:min-h-[300px] lg:h-[332px] lg:minh-[332px] bg-gradient-to-b from-indigo-600/80 via-spotify-charcoal to-spotify-charcoal">
				<Topbar />

				<div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-0 sm:px-5 md:px-6 md:pb-6">
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
						{getGreeting()}
					</h1>

					<p className="text-xs sm:text-sm text-spotify-text-muted max-w-[520px]">
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
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default HomePage;
