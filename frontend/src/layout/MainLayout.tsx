import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import ArtistInfoSidebar from "./components/ArtistInfoSidebar";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { useArtistStore } from "@/stores/useArtistStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const MainLayout = () => {
	const location = useLocation();
	const { openArtist, toggleSidebar, isSidebarOpen } = useArtistStore();
	const { currentSong } = usePlayerStore();

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

			<div className="flex flex-1 min-h-0 overflow-hidden">
				{/* Left sidebar */}
				<aside className="hidden md:flex md:w-[88px] md:min-w-[88px] lg:w-[280px] lg:min-w-[280px] shrink-0 border-r border-white/10 bg-spotify-sidebar">
					<LeftSidebar />
				</aside>

				{/* Main content */}
				<main
					key={location.pathname}
					className="flex-1 min-w-0 flex flex-col overflow-hidden page-transition-enter"
				>
					<Outlet />
				</main>

				{/* Right artist rail */}
				<aside className="hidden lg:flex w-[84px] min-w-[84px] shrink-0 border-l border-white/10 bg-black/30">
					<div className="w-full flex flex-col items-center pt-5 px-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleOpenArtist}
							className={`h-12 w-12 rounded-2xl transition-all ${
								isSidebarOpen
									? "bg-spotify-green text-black hover:bg-spotify-green-hover"
									: "bg-white/10 text-white hover:bg-white/20"
							}`}
						>
							<User className="h-5 w-5" />
						</Button>

						<span className="mt-2 text-[11px] leading-tight text-center text-spotify-text-muted">
							Исполнитель
						</span>
					</div>
				</aside>
			</div>

			{/* Mobile / tablet floating artist button */}
			<div className="hidden md:flex lg:hidden fixed right-2 bottom-24 z-30">
				<Button
					variant="ghost"
					size="icon"
					onClick={handleOpenArtist}
					className={`h-9 w-9 rounded-full shadow-lg transition-all ${
						isSidebarOpen
							? "bg-spotify-green text-black hover:bg-spotify-green-hover"
							: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
					}`}
				>
					<User className="h-4 w-4" />
				</Button>
			</div>

			<PlaybackControls />
			<ArtistInfoSidebar />
		</div>
	);
};

export default MainLayout;
