import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboardIcon, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
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
		<div className="flex items-center justify-between p-4 sticky top-0 z-10">
			<div className="flex gap-2 items-center">
				<button
					onClick={handleBack}
					className="flex items-center justify-center w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-spotify-text-muted hover:text-white disabled:opacity-50"
				>
					<ChevronLeft className="w-5 h-5" />
				</button>
				<button
					onClick={handleForward}
					className="flex items-center justify-center w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-spotify-text-muted hover:text-white disabled:opacity-50"
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>

			<div className="flex items-center gap-3">
				{isAuthenticated && (
					<>
						<Link to="/admin">
							<Button
								variant="ghost"
								size="sm"
								className="rounded-full bg-white/10 text-white hover:bg-white/20"
							>
								<LayoutDashboardIcon className="size-4 mr-2" />
								Admin
							</Button>
						</Link>

						<div className="flex items-center gap-2 pl-2 border-l border-white/10">
							<Avatar className="h-8 w-8">
								<AvatarImage src={user?.avatar_url || ""} alt={user?.username} />
								<AvatarFallback className="bg-spotify-charcoal text-spotify-text-muted text-sm">
									{user?.username?.[0].toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium text-white hidden sm:inline">
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
