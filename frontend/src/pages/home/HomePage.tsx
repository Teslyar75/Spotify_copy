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
		<main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal">
			{/* Gradient header - как в Spotify */}
			<div className="h-[332px] min-h-[332px] bg-gradient-to-b from-indigo-600/80 via-spotify-charcoal to-spotify-charcoal relative">
				<Topbar />
				<div className="absolute bottom-0 left-0 right-0 p-6 pt-0">
					<h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{getGreeting()}</h1>
					<p className="text-spotify-text-muted text-sm">We'll recommend music based on your taste</p>
				</div>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="p-6 pt-0 -mt-8 relative z-10">
					<div className="space-y-10">
						<SectionGrid title="Made For You" songs={madeForYouSongs} isLoading={isLoading} />
						<SectionGrid title="Featured" songs={featuredSongs} isLoading={isLoading} />
						<SectionGrid title="Trending" songs={trendingSongs} isLoading={isLoading} />
					</div>
				</div>
			</ScrollArea>
		</main>
	);
};

export default HomePage;
