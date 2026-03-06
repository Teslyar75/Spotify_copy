import { Outlet, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import { PlaybackControls } from "./components/PlaybackControls";
import { useEffect, useState } from "react";

const MainLayout = () => {
	const [isMobile, setIsMobile] = useState(false);
	const location = useLocation();

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<div className="h-screen bg-spotify-black text-white flex flex-col overflow-hidden">
			<AudioPlayer />
			<div className="flex-1 flex min-h-0">
				{/* Left sidebar - Spotify style: узкая колонка */}
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

				{/* Right sidebar - Friend Activity */}
				{!isMobile && (
					<div className="w-[350px] min-w-[350px] flex flex-col border-l border-white/10">
						<FriendsActivity />
					</div>
				)}
			</div>

			<PlaybackControls />
		</div>
	);
};

export default MainLayout;
