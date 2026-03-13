import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	LayoutDashboardIcon,
	LogOut,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Topbar = () => {
	const { user, logout, isAuthenticated } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	const handleBack = () => navigate(-1);
	const handleForward = () => navigate(1);

	return (
		<div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-5 md:px-6">
			<div className="flex items-center gap-2">
				<button
					onClick={handleBack}
					className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-spotify-text-muted transition-colors hover:bg-black/50 hover:text-white disabled:opacity-50"
				>
					<ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
				</button>

				<button
					onClick={handleForward}
					className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-spotify-text-muted transition-colors hover:bg-black/50 hover:text-white disabled:opacity-50"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			<div className="flex items-center gap-2 sm:gap-3">
				{isAuthenticated && (
					<>
						<Link to="/admin">
							<Button
								variant="ghost"
								size="sm"
								className="h-8 rounded-full bg-white/10 px-3 text-white hover:bg-white/20 sm:px-4"
							>
								<LayoutDashboardIcon className="h-4 w-4 sm:mr-2" />
								<span className="ml-2 text-sm sm:ml-0">Admin</span>
							</Button>
						</Link>

						<div className="flex items-center gap-2 pl-2 sm:border-l sm:border-white/10 sm:pl-3">
							<Avatar className="h-8 w-8">
								<AvatarImage src={user?.avatar_url || ""} alt={user?.username} />
								<AvatarFallback className="bg-spotify-charcoal text-sm text-spotify-text-muted">
									{user?.username?.[0].toUpperCase()}
								</AvatarFallback>
							</Avatar>

							<span className="hidden text-sm font-medium text-white md:inline">
								{user?.username}
							</span>

							<Button
								variant="ghost"
								size="icon"
								onClick={handleLogout}
								className="h-8 w-8 text-spotify-text-muted hover:text-white"
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Topbar;
