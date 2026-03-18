import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, Search, User, Heart, Loader2 } from "lucide-react";
import { Song, Album } from "@/types";
import { axiosInstance } from "@/lib/axios";

// Маппинг кнопок жанров на значения для API (совпадает с Jamendo tags)
const GENRE_MAP: Record<string, string> = {
	Rock: "rock",
	Pop: "pop",
	Jazz: "jazz",
	Classical: "classical",
	Electronic: "electronic",
	"Hip-Hop": "hiphop",
	"R&B": "rnb",
	Ambient: "ambient",
};

const SearchPage = () => {
	const [query, setQuery] = useState("");
	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [isLoadingTracks, setIsLoadingTracks] = useState(false);
	const [browseTracks, setBrowseTracks] = useState<Song[]>([]);
	const [tracksByGenre, setTracksByGenre] = useState<Record<string, Song[]>>({});
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { playAlbum, setCurrentSong } = usePlayerStore();
	const { likeSong, unlikeSong, isSongLiked } = useLibraryStore();
	const { albums, fetchAlbums } = useMusicStore();

	const [results, setResults] = useState<{
		tracks: Song[];
		albums: Album[];
		artists: { name: string }[];
	}>({ tracks: [], albums: [], artists: [] });

	// Загружаем альбомы
	useEffect(() => {
		fetchAlbums();
	}, [fetchAlbums]);

	// Загружаем треки для просмотра (все или по жанру) — когда нет текстового поиска
	const fetchBrowseTracks = useCallback(async (genre: string | null) => {
		setIsLoadingTracks(true);
		try {
			if (genre) {
				const params = { limit: "500", genre };
				const res = await axiosInstance.get("/songs/", { params });
				setBrowseTracks(res.data);
				setTracksByGenre({});
			} else {
				const res = await axiosInstance.get("/songs/browse-by-genre", {
					params: { limit_per_genre: 25 },
				});
				setTracksByGenre(res.data);
				setBrowseTracks([]);
			}
		} catch {
			setBrowseTracks([]);
			setTracksByGenre({});
		} finally {
			setIsLoadingTracks(false);
		}
	}, []);

	useEffect(() => {
		if (!query.trim()) fetchBrowseTracks(selectedGenre);
	}, [query, selectedGenre, fetchBrowseTracks]);

	const doSearch = async (q: string) => {
		if (!q.trim()) {
			setResults({ tracks: [], albums: [], artists: [] });
			fetchBrowseTracks(selectedGenre);
			return;
		}
		setIsSearching(true);
		try {
			const response = await axiosInstance.get("/search/", {
				params: { q: q.trim() },
			});
			setResults(response.data);
		} catch {
			setResults({ tracks: [], albums: [], artists: [] });
		} finally {
			setIsSearching(false);
		}
	};

	const handleQueryChange = (value: string) => {
		setQuery(value);
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		if (!value.trim()) {
			setResults({ tracks: [], albums: [], artists: [] });
			return;
		}
		debounceTimer.current = setTimeout(() => doSearch(value), 400);
	};

	const handleGenreClick = (genreLabel: string) => {
		const genreValue = GENRE_MAP[genreLabel] ?? genreLabel.toLowerCase();
		setSelectedGenre((prev) => (prev === genreValue ? null : genreValue));
		setQuery("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		doSearch(query);
	};

	const handlePlayAlbum = (e: React.MouseEvent, album: Album) => {
		e.preventDefault();
		e.stopPropagation();
		if (album.songs?.length) playAlbum(album.songs, 0);
	};

	const hasResults =
		results.tracks.length > 0 ||
		results.albums.length > 0 ||
		results.artists.length > 0;

	return (
		<main className="flex flex-1 flex-col min-h-0 overflow-hidden bg-spotify-charcoal">
			<div className="relative h-[260px] min-h-[260px] sm:h-[300px] sm:min-h-[300px] md:h-[360px] md:min-h-[360px] lg:h-[400px] lg:min-h-[400px] overflow-hidden">
				{/* Фоновое изображение */}
				<img
					src="/search-header-bg.png"
					alt=""
					className="absolute inset-0 h-full w-full object-cover object-top"
				/>
				{/* Тёмный градиент поверх фото */}
				<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-spotify-charcoal" />

				<div className="relative z-10">
					<Topbar />
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 sm:px-5 md:px-6 md:pb-6">
					<h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:mb-5 md:text-4xl">
						Search
					</h1>

					<form onSubmit={handleSubmit} className="relative max-w-xl">
						{isSearching ? (
							<Loader2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-green animate-spin sm:h-5 sm:w-5" />
						) : (
							<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-text-muted sm:h-5 sm:w-5" />
						)}
						<Input
							type="text"
							placeholder="What do you want to listen to?"
							value={query}
							onChange={(e) => handleQueryChange(e.target.value)}
							className="h-11 rounded-full border-0 bg-white/10 pl-11 text-sm text-white placeholder:text-spotify-text-muted focus-visible:ring-2 focus-visible:ring-white/30 sm:h-12 sm:pl-12 sm:text-base md:h-14 md:text-lg"
							autoFocus
						/>
					</form>
				</div>
			</div>


			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="relative z-10 px-4 pb-28 pt-4 sm:px-5 sm:pt-5 md:px-6 md:pb-32">
					{!query.trim() ? (
						/* Начальный экран — жанры, треки (все или по жанру), альбомы */
						<div className="space-y-6">
							<div>
								<h2 className="mb-3 text-base font-bold text-white sm:text-lg">
									Browse by genre
								</h2>
								<div className="flex flex-wrap gap-2 sm:gap-3">
									<Button
										variant="ghost"
										className={`rounded-full px-4 text-sm sm:px-5 ${
											!selectedGenre ? "bg-spotify-green text-black hover:bg-spotify-green-hover" : "bg-white/10 text-white hover:bg-white/20"
										}`}
										onClick={() => setSelectedGenre(null)}
									>
										All
									</Button>
									{["Rock", "Pop", "Jazz", "Classical", "Electronic", "Hip-Hop", "R&B", "Ambient"].map((genre) => {
										const genreValue = GENRE_MAP[genre] ?? genre.toLowerCase();
										const isActive = selectedGenre === genreValue;
										return (
											<Button
												key={genre}
												variant="ghost"
												className={`rounded-full px-4 text-sm sm:px-5 ${
													isActive ? "bg-spotify-green text-black hover:bg-spotify-green-hover" : "bg-white/10 text-white hover:bg-white/20"
												}`}
												onClick={() => handleGenreClick(genre)}
											>
												{genre}
											</Button>
										);
									})}
								</div>
							</div>

							{/* Треки — по категориям (жанрам) или по выбранному жанру */}
							{isLoadingTracks ? (
								<div className="flex items-center gap-3 py-8 text-sm text-spotify-text-muted">
									<Loader2 className="h-5 w-5 animate-spin text-spotify-green" />
									<span>Loading tracks...</span>
								</div>
							) : selectedGenre ? (
								<div>
									<h2 className="mb-3 text-base font-bold text-white sm:text-lg">
										Tracks: {selectedGenre}
									</h2>
									{browseTracks.length > 0 ? (
										<div className="space-y-2">
											{browseTracks.map((song, i) => (
												<div
													key={song.id}
													className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/10 sm:gap-4 sm:p-3"
													onClick={() => setCurrentSong(song)}
												>
													<span className="w-5 text-xs text-spotify-text-muted sm:w-6 sm:text-sm">{i + 1}</span>
													<img
														src={song.image_url || "/album-placeholder.png"}
														alt=""
														className="h-10 w-10 rounded object-cover sm:h-12 sm:w-12"
													/>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-medium text-white sm:text-base">{song.title}</p>
														<p className="truncate text-xs text-spotify-text-muted sm:text-sm">{song.artist}</p>
													</div>
													<button
														onClick={(e) => {
															e.stopPropagation();
															isSongLiked(song.id) ? unlikeSong(song.id) : likeSong(song);
														}}
														className={`transition-transform hover:scale-110 ${
															isSongLiked(song.id) ? "" : "opacity-0 group-hover:opacity-100"
														}`}
													>
														<Heart
															className={`h-4 w-4 ${isSongLiked(song.id) ? "text-spotify-green" : "text-white/50 hover:text-white"}`}
															fill={isSongLiked(song.id) ? "currentColor" : "none"}
														/>
													</button>
													<Button
														size="icon"
														className="h-9 w-9 rounded-full bg-spotify-green opacity-0 transition-opacity group-hover:opacity-100 hover:bg-spotify-green-hover sm:h-10 sm:w-10"
														onClick={(e) => {
															e.stopPropagation();
															setCurrentSong(song);
														}}
													>
														<Play className="ml-0.5 h-4 w-4 text-black sm:h-5 sm:w-5" fill="currentColor" />
													</Button>
												</div>
											))}
										</div>
									) : (
										<p className="py-6 text-sm text-spotify-text-muted">
											No tracks in genre &quot;{selectedGenre}&quot;
										</p>
									)}
								</div>
							) : Object.keys(tracksByGenre).length > 0 ? (
								<div className="space-y-8">
									{Object.entries(tracksByGenre).map(([genre, songs]) => (
										<div key={genre}>
											<h2 className="mb-3 text-base font-bold text-white sm:text-lg">
												{genre}
											</h2>
											<div className="space-y-2">
												{songs.map((song, i) => (
													<div
														key={song.id}
														className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/10 sm:gap-4 sm:p-3"
														onClick={() => setCurrentSong(song)}
													>
														<span className="w-5 text-xs text-spotify-text-muted sm:w-6 sm:text-sm">{i + 1}</span>
														<img
															src={song.image_url || "/album-placeholder.png"}
															alt=""
															className="h-10 w-10 rounded object-cover sm:h-12 sm:w-12"
														/>
														<div className="min-w-0 flex-1">
															<p className="truncate text-sm font-medium text-white sm:text-base">{song.title}</p>
															<p className="truncate text-xs text-spotify-text-muted sm:text-sm">{song.artist}</p>
														</div>
														<button
															onClick={(e) => {
																e.stopPropagation();
																isSongLiked(song.id) ? unlikeSong(song.id) : likeSong(song);
															}}
															className={`transition-transform hover:scale-110 ${
																isSongLiked(song.id) ? "" : "opacity-0 group-hover:opacity-100"
															}`}
														>
															<Heart
																className={`h-4 w-4 ${isSongLiked(song.id) ? "text-spotify-green" : "text-white/50 hover:text-white"}`}
																fill={isSongLiked(song.id) ? "currentColor" : "none"}
															/>
														</button>
														<Button
															size="icon"
															className="h-9 w-9 rounded-full bg-spotify-green opacity-0 transition-opacity group-hover:opacity-100 hover:bg-spotify-green-hover sm:h-10 sm:w-10"
															onClick={(e) => {
																e.stopPropagation();
																setCurrentSong(song);
															}}
														>
															<Play className="ml-0.5 h-4 w-4 text-black sm:h-5 sm:w-5" fill="currentColor" />
														</Button>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="py-6 text-sm text-spotify-text-muted">
									No tracks yet. Import from Jamendo or add via admin panel.
								</p>
							)}

							{albums.length > 0 && (
								<div>
									<h2 className="mb-3 text-base font-bold text-white sm:text-lg">
										All albums
									</h2>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
										{albums.map((album) => (
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
														onClick={(e) => handlePlayAlbum(e, album)}
														className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-spotify-green opacity-0 shadow-xl transition-all hover:bg-spotify-green-hover group-hover:opacity-100 md:h-12 md:w-12"
													>
														<Play className="ml-0.5 h-4 w-4 text-black md:h-5 md:w-5" fill="currentColor" />
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
								</div>
							)}
						</div>
					) : isSearching ? (
						<div className="flex items-center gap-3 py-4 text-sm text-spotify-text-muted">
							<Loader2 className="h-4 w-4 animate-spin text-spotify-green" />
							<span>Searching for "{query}"...</span>
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
												onClick={() => setCurrentSong(song)}
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

												<button
													onClick={(e) => {
														e.stopPropagation();
														isSongLiked(song.id) ? unlikeSong(song.id) : likeSong(song);
													}}
													className={`transition-transform hover:scale-110 ${
														isSongLiked(song.id) ? "" : "opacity-0 group-hover:opacity-100"
													}`}
												>
													<Heart
														className={`h-4 w-4 ${isSongLiked(song.id) ? "text-spotify-green" : "text-white/50 hover:text-white"}`}
														fill={isSongLiked(song.id) ? "currentColor" : "none"}
													/>
												</button>

												<Button
													size="icon"
													className="h-9 w-9 rounded-full bg-spotify-green opacity-0 transition-opacity group-hover:opacity-100 hover:bg-spotify-green-hover sm:h-10 sm:w-10"
													onClick={(e) => {
														e.stopPropagation();
														setCurrentSong(song);
													}}
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
														onClick={(e) => handlePlayAlbum(e, album)}
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

							{!hasResults && (
								<div className="py-8 text-center">
									<p className="text-base font-semibold text-white mb-2">
										No results found
									</p>
									<p className="text-sm text-spotify-text-muted">
										Try searching for something else — tracks, albums, or artists
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default SearchPage;
