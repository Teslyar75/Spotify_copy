import { useArtistStore } from "@/stores/useArtistStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock-расписание концертов с будущими датами
function getMockConcerts(artistName: string) {
	const seed = artistName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const venues = ["Red Rocks", "The Fillmore", "House of Blues", "Roxy Theatre", "Blue Note"];
	const cities = ["Denver", "San Francisco", "Chicago", "New York", "Los Angeles"];

	const baseDate = new Date();
	baseDate.setMonth(baseDate.getMonth() + 1);

	return [0, 1, 2].map((offset) => {
		const date = new Date(baseDate);
		date.setDate(date.getDate() + offset * 28 + (seed % 7));

		return {
			date: date.toISOString(),
			venue: venues[(seed + offset) % venues.length],
			city: cities[(seed + offset) % cities.length],
		};
	});
}

const ArtistInfoSidebar = () => {
	const { selectedArtist, isSidebarOpen, closeSidebar } = useArtistStore();

	const artist = selectedArtist;
	const concerts = artist ? getMockConcerts(artist.name) : [];

	return (
		<>
			{/* Overlay for mobile/tablet */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
					onClick={closeSidebar}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed top-0 right-0 z-50 flex h-full w-full max-w-full flex-col border-l border-white/10 bg-spotify-charcoal shadow-2xl transition-transform duration-300 ease-out sm:max-w-[380px] md:max-w-[420px]",
					isSidebarOpen ? "translate-x-0" : "translate-x-full"
				)}
			>
				<div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
					<h2 className="text-base font-semibold text-white sm:text-lg">
						Об исполнителе
					</h2>

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
					<div className="space-y-5 p-4 sm:space-y-6 sm:p-5">
						{artist ? (
							<>
								<div className="flex flex-col items-center gap-4">
									<img
										src={
											artist.imageUrl ||
											`https://picsum.photos/seed/${encodeURIComponent(artist.name)}/400/400`
										}
										alt={artist.name}
										className="h-28 w-28 rounded-full object-cover shadow-lg sm:h-36 sm:w-36 md:h-40 md:w-40"
									/>

									<h3 className="text-center text-xl font-bold text-white sm:text-2xl">
										{artist.name}
									</h3>
								</div>

								{artist.bio ? (
									<div>
										<h4 className="mb-2 text-sm font-medium text-spotify-text-muted">
											О себе
										</h4>
										<p className="text-sm leading-relaxed text-white sm:text-[15px]">
											{artist.bio}
										</p>
									</div>
								) : (
									<p className="text-sm italic text-spotify-text-muted">
										Информация об исполнителе скоро появится.
									</p>
								)}

								<div>
									<h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-spotify-text-muted">
										<Calendar className="h-4 w-4" />
										Ближайшие концерты
									</h4>

									{concerts.length > 0 ? (
										<div className="space-y-3">
											{concerts.map((concert, i) => (
												<div
													key={i}
													className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4"
												>
													<p className="font-medium text-white">
														{concert.venue}
													</p>

													<p className="mt-1 flex items-center gap-1 text-sm text-spotify-text-muted">
														<MapPin className="h-3.5 w-3.5 shrink-0" />
														<span className="truncate">
															{concert.city} ·{" "}
															{new Date(concert.date).toLocaleDateString("ru-RU")}
														</span>
													</p>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm italic text-spotify-text-muted">
											Расписание концертов пока не добавлено.
										</p>
									)}
								</div>
							</>
						) : (
							<div className="py-12 text-center">
								<p className="text-sm text-spotify-text-muted">
									Нажмите на имя исполнителя, чтобы увидеть информацию
								</p>
							</div>
						)}
					</div>
				</ScrollArea>
			</aside>
		</>
	);
};

export default ArtistInfoSidebar;
