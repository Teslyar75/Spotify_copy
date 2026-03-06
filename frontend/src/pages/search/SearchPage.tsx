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
		<main className="flex-1 flex flex-col min-h-0 bg-spotify-charcoal">
			<div className="h-[340px] min-h-[340px] bg-gradient-to-b from-indigo-900/60 via-spotify-charcoal to-spotify-charcoal relative">
				<Topbar />
				<div className="absolute bottom-0 left-0 right-0 p-6">
					<h1 className="text-4xl font-bold text-white mb-6">Search</h1>
					<form onSubmit={handleSubmit} className="relative max-w-xl">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-spotify-text-muted" />
						<Input
							type="text"
							placeholder="What do you want to listen to?"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-12 h-14 rounded-full bg-white/10 border-0 text-white text-lg placeholder:text-spotify-text-muted focus-visible:ring-2 focus-visible:ring-white/30"
							autoFocus
						/>
					</form>
				</div>
			</div>

			<ScrollArea className="flex-1 scrollbar-spotify">
				<div className="p-6 space-y-10">
					{isLoading ? (
						<p className="text-spotify-text-muted">Searching...</p>
					) : !query.trim() ? (
						<div className="flex flex-wrap gap-4">
							{["Rock", "Pop", "Jazz", "Classical", "Electronic"].map((genre) => (
								<Button
									key={genre}
									variant="ghost"
									className="rounded-full bg-white/10 hover:bg-white/20 text-white px-6"
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
						<>
							{results.tracks.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold text-white mb-4">Songs</h2>
									<div className="space-y-2">
										{results.tracks.map((song, i) => (
											<div
												key={song.id}
												className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
												onClick={() => handlePlayTrack(song)}
											>
												<span className="w-6 text-spotify-text-muted text-sm">
													{i + 1}
												</span>
												<img
													src={song.image_url || "/album-placeholder.png"}
													alt=""
													className="h-12 w-12 rounded object-cover"
												/>
												<div className="flex-1 min-w-0">
													<p className="font-medium text-white truncate">{song.title}</p>
													<p className="text-sm text-spotify-text-muted truncate">
														{song.artist}
													</p>
												</div>
												<Button
													size="icon"
													className="opacity-0 group-hover:opacity-100 rounded-full bg-spotify-green hover:bg-spotify-green-hover h-10 w-10"
												>
													<Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
												</Button>
											</div>
										))}
									</div>
								</section>
							)}

							{results.albums.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold text-white mb-4">Albums</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
										{results.albums.map((album) => (
											<Link
												key={album.id}
												to={`/albums/${album.id}`}
												className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors block"
											>
												<div className="relative mb-3">
													<img
														src={album.image_url || "/album-placeholder.png"}
														alt={album.title}
														className="aspect-square object-cover rounded-lg w-full"
													/>
													<Button
														size="icon"
														onClick={(e) => {
															e.preventDefault();
															handlePlayAlbum(album);
														}}
														className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover opacity-0 group-hover:opacity-100 shadow-xl"
													>
														<Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
													</Button>
												</div>
												<p className="font-medium text-white truncate">{album.title}</p>
												<p className="text-sm text-spotify-text-muted truncate">
													{album.artist}
												</p>
											</Link>
										))}
									</div>
								</section>
							)}

							{results.artists.length > 0 && (
								<section>
									<h2 className="text-2xl font-bold text-white mb-4">Artists</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
										{results.artists.map((artist) => (
											<div
												key={artist.name}
												className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-center"
											>
												<div className="h-32 w-32 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
													<User className="h-16 w-16 text-white/80" />
												</div>
												<p className="font-medium text-white truncate">{artist.name}</p>
												<p className="text-sm text-spotify-text-muted">Artist</p>
											</div>
										))}
									</div>
								</section>
							)}

							{query.trim() &&
								results.tracks.length === 0 &&
								results.albums.length === 0 &&
								results.artists.length === 0 && (
									<p className="text-spotify-text-muted">No results found for "{query}"</p>
								)}
						</>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default SearchPage;
