import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import ArtistInfoSidebar from "./components/ArtistInfoSidebar";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { useEffect, useState } from "react";
import { useArtistStore } from "@/stores/useArtistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const location = useLocation();
	const { openArtist, toggleSidebar, isSidebarOpen } = useArtistStore();
	const { currentSong } = usePlayerStore();

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const handleOpenArtist = () => {
		if (currentSong) {
			openArtist({
				name: currentSong.artist,
				imageUrl: currentSong.image_url,
			});
		} else {
			toggleSidebar();
		}
	};

	return (
		<div className="h-screen bg-spotify-black text-white flex flex-col overflow-hidden">
			<AudioPlayer />
			<div className="flex-1 flex min-h-0">
				{/* Left sidebar - Spotify style */}
				<div
					className={`${
						isMobile ? "w-0 overflow-hidden" : "w-[280px] min-w-[280px]"
					} flex flex-col bg-spotify-sidebar transition-all duration-300`}
				>
					<LeftSidebar />
				</div>

				{/* Main content */}
				<div
					key={location.pathname}
					className="flex-1 min-w-0 flex flex-col overflow-hidden page-transition-enter"
				>
					<Outlet />
				</div>

				{/* Right sidebar — кнопка «Об исполнителе» */}
				{!isMobile && (
					<div className="w-[80px] min-w-[80px] flex flex-col items-center justify-start pt-6 border-l border-white/10">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleOpenArtist}
							className={`rounded-full font-medium transition-all flex flex-col gap-1 ${
								isSidebarOpen
									? "bg-spotify-green text-black hover:bg-spotify-green-hover"
									: "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<User className="h-5 w-5" />
							<span className="text-[10px]">Исполнитель</span>
						</Button>
					</div>
				)}
			</div>

			<PlaybackControls />
			<ArtistInfoSidebar />
		</div>
	);
};

export default MainLayout;
