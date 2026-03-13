import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Search, User } from "lucide-react";
import { Song, Album } from "@/types";

const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialQuery = searchParams.get("q") || "";
	const [query, setQuery] = useState(initialQuery);

	const { search, isLoading } = useMusicStore();
	const { setCurrentSong, playAlbum } = usePlayerStore();

	const [results, setResults] = useState<{
		tracks: Song[];
		albums: Album[];
		artists: { name: string }[];
	}>({ tracks: [], albums: [], artists: [] });

	const doSearch = useCallback(async () => {
		if (!query.trim()) {
			setResults({ tracks: [], albums: [], artists: [] });
			return;
		}

		const data = await search(query.trim());
		setResults(data);
		setSearchParams({ q: query.trim() });
	}, [query, search, setSearchParams]);

	useEffect(() => {
		if (initialQuery) {
			setQuery(initialQuery);
			search(initialQuery).then(setResults);
		} else {
			setResults({ tracks: [], albums: [], artists: [] });
		}
	}, [initialQuery, search]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		doSearch();
	};

	const handlePlayTrack = (song: Song) => {
		setCurrentSong(song);
	};

	const handlePlayAlbum = (album: Album) => {
		playAlbum(album.songs, 0);
	};

	return (
		<main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
			<div className="relative h-[220px] min-h-[220px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal sm:h-[260px] sm:min-h-[260px] md:h-[300px] md:min-h-[300px] lg:h-[340px] lg:min-h-[340px]">
				<Topbar />

				<div className="absolute bottom-0 left-0 right-0 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
					<h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:mb-5 md:text-4xl">
						Search
					</h1>

					<form onSubmit={handleSubmit} className="relative max-w-xl">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-text-muted sm:h-5 sm:w-5" />
						<Input
							type="text"
							placeholder="What do you want to listen to?"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="h-11 rounded-full border-0 bg-white/10 pl-11 text-sm text-white placeholder:text-spotify-text-muted focus-visible:ring-2 focus-visible:ring-white/30 sm:h-12 sm:pl-12 sm:text-base md:h-14 md:text-lg"
							autoFocus
						/>
					</form>
				</div>
			</div>

			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="relative z-10 -mt-6 px-4 pb-28 pt-0 sm:-mt-7 sm:px-5 md:-mt-8 md:px-6 md:pb-32">
					{isLoading ? (
						<p className="text-sm text-spotify-text-muted">Searching...</p>
					) : !query.trim() ? (
						<div className="flex flex-wrap gap-2 sm:gap-3">
							{["Rock", "Pop", "Jazz", "Classical", "Electronic"].map((genre) => (
								<Button
									key={genre}
									variant="ghost"
									className="rounded-full bg-white/10 px-4 text-sm text-white hover:bg-white/20 sm:px-5"
									onClick={async () => {
										setQuery(genre);
										const data = await search(genre);
										setResults(data);
									}}
								>
									{genre}
								</Button>
							))}
						</div>
					) : (
						<div className="space-y-8 md:space-y-10">
							{results.tracks.length > 0 && (
								<section>
									<h2 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-2xl">
										Songs
									</h2>

									<div className="space-y-2">
										{results.tracks.map((song, i) => (
											<div
												key={song.id}
												className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/10 sm:gap-4 sm:p-3"
												onClick={() => handlePlayTrack(song)}
											>
												<span className="w-5 text-xs text-spotify-text-muted sm:w-6 sm:text-sm">
													{i + 1}
												</span>

												<img
													src={song.image_url || "/album-placeholder.png"}
													alt=""
													className="h-10 w-10 rounded object-cover sm:h-12 sm:w-12"
												/>

												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-white sm:text-base">
														{song.title}
													</p>
													<p className="truncate text-xs text-spotify-text-muted sm:text-sm">
														{song.artist}
													</p>
												</div>

												<Button
													size="icon"
													className="h-9 w-9 rounded-full bg-spotify-green opacity-0 transition-opacity group-hover:opacity-100 hover:bg-spotify-green-hover sm:h-10 sm:w-10"
												>
													<Play
														className="ml-0.5 h-4 w-4 text-black sm:h-5 sm:w-5"
														fill="currentColor"
													/>
												</Button>
											</div>
										))}
									</div>
								</section>
							)}

							{results.albums.length > 0 && (
								<section>
									<h2 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-2xl">
										Albums
									</h2>

									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
										{results.albums.map((album) => (
											<Link
												key={album.id}
												to={`/albums/${album.id}`}
												className="group block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10 sm:p-4"
											>
												<div className="relative mb-3">
													<img
														src={album.image_url || "/album-placeholder.png"}
														alt={album.title}
														className="aspect-square w-full rounded-lg object-cover"
													/>

													<Button
														size="icon"
														onClick={(e) => {
															e.preventDefault();
															handlePlayAlbum(album);
														}}
														className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-spotify-green opacity-0 shadow-xl transition-all hover:bg-spotify-green-hover group-hover:opacity-100 md:h-12 md:w-12"
													>
														<Play
															className="ml-0.5 h-4 w-4 text-black md:h-5 md:w-5"
															fill="currentColor"
														/>
													</Button>
												</div>

												<p className="truncate text-sm font-medium text-white sm:text-base">
													{album.title}
												</p>
												<p className="truncate text-xs text-spotify-text-muted sm:text-sm">
													{album.artist}
												</p>
											</Link>
										))}
									</div>
								</section>
							)}

							{results.artists.length > 0 && (
								<section>
									<h2 className="mb-3 text-lg font-bold text-white sm:mb-4 sm:text-2xl">
										Artists
									</h2>

									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
										{results.artists.map((artist) => (
											<div
												key={artist.name}
												className="group rounded-lg bg-white/5 p-3 text-center transition-colors hover:bg-white/10 sm:p-4"
											>
												<div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 sm:h-28 sm:w-28 md:h-32 md:w-32">
													<User className="h-12 w-12 text-white/80 sm:h-14 sm:w-14 md:h-16 md:w-16" />
												</div>

												<p className="truncate text-sm font-medium text-white sm:text-base">
													{artist.name}
												</p>
												<p className="text-xs text-spotify-text-muted sm:text-sm">
													Artist
												</p>
											</div>
										))}
									</div>
								</section>
							)}

							{query.trim() &&
								results.tracks.length === 0 &&
								results.albums.length === 0 &&
								results.artists.length === 0 && (
									<p className="text-sm text-spotify-text-muted">
										No results found for "{query}"
									</p>
								)}
						</div>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default SearchPage;