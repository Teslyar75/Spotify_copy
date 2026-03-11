import { useArtistStore } from "@/stores/useArtistStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Заглушка: mock-расписание концертов по имени артиста
function getMockConcerts(artistName: string) {
	const seed = artistName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const venues = ["Red Rocks", "The Fillmore", "House of Blues", "Roxy Theatre", "Blue Note"];
	const cities = ["Denver", "San Francisco", "Chicago", "New York", "Los Angeles"];
	return [
		{ date: "2025-04-15", venue: venues[seed % 5], city: cities[seed % 5] },
		{ date: "2025-05-22", venue: venues[(seed + 1) % 5], city: cities[(seed + 1) % 5] },
		{ date: "2025-06-10", venue: venues[(seed + 2) % 5], city: cities[(seed + 2) % 5] },
	];
}

const ArtistInfoSidebar = () => {
	const { selectedArtist, isSidebarOpen, closeSidebar } = useArtistStore();

	const artist = selectedArtist;
	const concerts = artist ? getMockConcerts(artist.name) : [];

	return (
		<>
			{/* Overlay на мобильных */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={closeSidebar}
					aria-hidden="true"
				/>
			)}

			{/* Панель — слайдер справа */}
			<div
				className={cn(
					"fixed top-0 right-0 h-full w-full max-w-[380px] bg-spotify-charcoal border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ease-out",
					isSidebarOpen ? "translate-x-0" : "translate-x-full"
				)}
			>
				<div className="p-4 flex items-center justify-between border-b border-white/10">
					<h2 className="font-semibold text-base text-white">Об исполнителе</h2>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeSidebar}
						className="rounded-full text-spotify-text-muted hover:text-white"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				<ScrollArea className="flex-1 scrollbar-spotify">
					<div className="p-4 space-y-6">
						{artist ? (
							<>
								<div className="flex flex-col items-center gap-4">
									<img
										src={artist.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(artist.name)}/300/300`}
										alt={artist.name}
										className="h-40 w-40 rounded-full object-cover shadow-lg"
									/>
									<h3 className="text-xl font-bold text-white text-center">{artist.name}</h3>
								</div>

								{artist.bio && (
									<div>
										<h4 className="text-sm font-medium text-spotify-text-muted mb-2">О себе</h4>
										<p className="text-sm text-white leading-relaxed">{artist.bio}</p>
									</div>
								)}

								{!artist.bio && (
									<p className="text-sm text-spotify-text-muted italic">
										Информация об исполнителе скоро появится.
									</p>
								)}

								{/* Расписание концертов */}
								<div>
									<h4 className="text-sm font-medium text-spotify-text-muted mb-3 flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										Ближайшие концерты
									</h4>
									{concerts.length > 0 ? (
										<div className="space-y-3">
											{concerts.map((c, i) => (
												<div
													key={i}
													className="p-3 rounded-lg bg-white/5 border border-white/10"
												>
													<p className="text-white font-medium">{c.venue}</p>
													<p className="text-sm text-spotify-text-muted flex items-center gap-1 mt-1">
														<MapPin className="h-3 w-3" />
														{c.city} · {new Date(c.date).toLocaleDateString("ru-RU")}
													</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-spotify-text-muted italic">
											Расписание концертов пока не добавлено.
										</p>
									)}
								</div>
							</>
						) : (
							<div className="text-center py-12">
								<p className="text-spotify-text-muted text-sm">
									Нажмите на имя исполнителя, чтобы увидеть информацию
								</p>
							</div>
						)}
					</div>
				</ScrollArea>
			</div>
		</>
	);
};

export default ArtistInfoSidebar;
