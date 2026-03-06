import { usePlayerStore } from "@/stores/usePlayerStore";
import { useChatStore } from "@/stores/useChatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const FriendsActivity = () => {
	const { users, onlineUsers, userActivities, setSelectedUser, isChatOpen, toggleChat } =
		useChatStore();
	const { currentSong } = usePlayerStore();

	const getUserActivity = (userId: string) => {
		return userActivities.get(userId) || "Idle";
	};

	const isUserOnline = (userId: string) => {
		return onlineUsers.has(userId);
	};

	return (
		<div className="h-full flex flex-col bg-spotify-black">
			<div className="p-4 flex items-center justify-between border-b border-white/10">
				<h2 className="font-semibold text-base text-white">Friend Activity</h2>
				<button
					onClick={toggleChat}
					className={cn(
						"px-4 py-2 rounded-full text-sm font-medium transition-all",
						isChatOpen
							? "bg-spotify-green text-black hover:bg-spotify-green-hover"
							: "bg-white/10 text-white hover:bg-white/20"
					)}
				>
					{isChatOpen ? "Chat On" : "Chat Off"}
				</button>
			</div>

			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="p-4 space-y-6">
					{users.map((user) => {
						const activity = getUserActivity(user.id);
						const online = isUserOnline(user.id);

						return (
							<div
								key={user.id}
								className="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors"
								onClick={() => setSelectedUser(user)}
							>
								<div className="relative">
									<Avatar className="h-12 w-12 ring-2 ring-spotify-black">
										<AvatarImage src={user.avatar_url || ""} alt={user.username} />
										<AvatarFallback className="bg-spotify-charcoal text-spotify-text-muted">
											{user.username[0].toUpperCase()}
										</AvatarFallback>
									</Avatar>
									{online && (
										<div className="absolute bottom-0 right-0 h-3 w-3 bg-spotify-green rounded-full border-2 border-spotify-black" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-white truncate">{user.username}</p>
									<p className="text-sm text-spotify-text-muted truncate">
										{activity === "Idle" ? "Idle" : activity.replace("Playing ", "")}
									</p>
								</div>
							</div>
						);
					})}

					{users.length === 0 && (
						<div className="text-center py-12">
							<p className="text-spotify-text-muted text-sm mb-2">No friends online</p>
							<p className="text-spotify-text-dim text-xs">Invite friends to see what they're listening to</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default FriendsActivity;
