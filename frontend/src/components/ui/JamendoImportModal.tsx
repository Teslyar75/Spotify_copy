import { useState, useEffect, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Search, Download, Music, Loader2, CheckCircle2, Play, Pause, Square } from "lucide-react";

interface JamendoTrack {
	jamendo_id: string;
	title: string;
	artist: string;
	album_name: string;
	duration: number;
	audio_url: string;
	image_url: string;
	license_url: string;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onImported: () => void;
}

const GENRE_PRESETS = [
	"rock", "pop", "electronic", "jazz", "classical",
	"hiphop", "lounge", "acoustic", "metal", "ambient",
];

const formatDuration = (s: number) => {
	if (!s || !isFinite(s)) return "0:00";
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const JamendoImportModal = ({ isOpen, onClose, onImported }: Props) => {
	const [query, setQuery] = useState("");
	const [tags, setTags] = useState("");
	const [results, setResults] = useState<JamendoTrack[]>([]);
	const [loading, setLoading] = useState(false);
	const [importing, setImporting] = useState<string | null>(null);
	const [imported, setImported] = useState<Set<string>>(new Set());

	// Preview player state
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [audioDuration, setAudioDuration] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Остановить и сбросить аудио
	const stopAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.src = "";
			audioRef.current = null;
		}
		setPlayingId(null);
		setProgress(0);
		setCurrentTime(0);
		setAudioDuration(0);
	};

	const handlePreview = (track: JamendoTrack) => {
		// Нажали на уже играющий трек — пауза/продолжить
		if (playingId === track.jamendo_id && audioRef.current) {
			if (!audioRef.current.paused) {
				audioRef.current.pause();
				setPlayingId(null);
			} else {
				audioRef.current.play().catch(() => {});
				setPlayingId(track.jamendo_id);
			}
			return;
		}

		// Останавливаем предыдущий
		stopAudio();

		const audio = new Audio(track.audio_url);
		audioRef.current = audio;

		audio.addEventListener("loadedmetadata", () => {
			setAudioDuration(audio.duration);
		});

		audio.addEventListener("timeupdate", () => {
			setCurrentTime(audio.currentTime);
			setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
		});

		audio.addEventListener("ended", () => {
			setPlayingId(null);
			setProgress(0);
			setCurrentTime(0);
		});

		audio.play()
			.then(() => setPlayingId(track.jamendo_id))
			.catch(() => toast.error("Не удалось воспроизвести трек"));
	};

	// При закрытии модала — останавливаем аудио
	useEffect(() => {
		if (!isOpen) stopAudio();
	}, [isOpen]);

	// Seekbar click
	const handleSeek = (e: React.MouseEvent<HTMLDivElement>, track: JamendoTrack) => {
		if (playingId !== track.jamendo_id || !audioRef.current) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		audioRef.current.currentTime = ratio * audioRef.current.duration;
	};

	const fetchTracks = async (q: string, t: string) => {
		setLoading(true);
		setResults([]);
		try {
			const params = new URLSearchParams({ limit: "30" });
			if (q.trim()) params.set("q", q.trim());
			if (t.trim()) params.set("tags", t.trim());
			const res = await axiosInstance.get(`/jamendo/search?${params}`);
			setResults(res.data);
			if (res.data.length === 0) toast("Ничего не найдено");
		} catch {
			toast.error("Ошибка загрузки. Проверьте подключение.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) fetchTracks("", "");
	}, [isOpen]);

	const handleSearch = () => fetchTracks(query, tags);

	const handleImport = async (track: JamendoTrack) => {
		setImporting(track.jamendo_id);
		try {
			const res = await axiosInstance.post("/jamendo/import", {
				jamendo_id: track.jamendo_id,
				title: track.title,
				artist: track.artist,
				album_name: track.album_name,
				duration: track.duration,
				audio_url: track.audio_url,
				image_url: track.image_url,
			});
			if (res.data.already_exists) {
				toast(`«${track.title}» уже в библиотеке`);
			} else {
				toast.success(`«${track.title}» импортирован!`);
				onImported();
			}
			setImported((prev) => new Set(prev).add(track.jamendo_id));
		} catch {
			toast.error("Ошибка импорта трека");
		} finally {
			setImporting(null);
		}
	};

	const handleClose = () => {
		stopAudio();
		setQuery("");
		setTags("");
		setResults([]);
		setImported(new Set());
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl w-full flex flex-col" style={{ maxHeight: "90vh" }}>
				<DialogHeader>
					<DialogTitle className="text-xl flex items-center gap-2">
						<Music className="h-5 w-5 text-green-400" />
						Импорт из Jamendo
					</DialogTitle>
					<p className="text-zinc-400 text-sm mt-1">
						Бесплатная музыка с{" "}
						<a href="https://www.jamendo.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
							jamendo.com
						</a>{" "}
						под Creative Commons. Нажми ▶ чтобы прослушать, затем «Добавить».
					</p>
				</DialogHeader>

				{/* Search controls */}
				<div className="space-y-3 flex-shrink-0">
					<div className="flex gap-2">
						<Input
							placeholder="Имя артиста или название трека..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
						/>
						<Button
							onClick={handleSearch}
							disabled={loading}
							className="bg-green-600 hover:bg-green-700 shrink-0"
						>
							{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
						</Button>
					</div>

					{/* Genre presets */}
					<div className="flex flex-wrap gap-2">
						{GENRE_PRESETS.map((genre) => (
							<button
								key={genre}
								onClick={() => {
									const newTags = tags === genre ? "" : genre;
									setTags(newTags);
									setQuery("");
									stopAudio();
									fetchTracks("", newTags);
								}}
								className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
									tags === genre
										? "bg-green-600 text-white"
										: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								}`}
							>
								{genre}
							</button>
						))}
						<button
							onClick={() => { setTags(""); setQuery(""); stopAudio(); fetchTracks("", ""); }}
							className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
								!tags ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
							}`}
						>
							🔥 популярные
						</button>
					</div>
				</div>

			{/* Results */}
			<div className="mt-2 overflow-y-auto" style={{ height: "420px", minHeight: "200px" }}>
					{loading && (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-green-500" />
							<span className="ml-3 text-zinc-400">Загрузка треков...</span>
						</div>
					)}

					{!loading && results.length > 0 && (
						<div className="space-y-2 pr-2">
							{results.map((track) => {
								const isImported = imported.has(track.jamendo_id);
								const isImporting = importing === track.jamendo_id;
								const isPlaying = playingId === track.jamendo_id;
								const isActive = isPlaying || (playingId === track.jamendo_id && audioRef.current?.paused);

								return (
									<div
										key={track.jamendo_id}
										className={`rounded-lg transition-colors ${
											isActive
												? "bg-zinc-700 ring-1 ring-green-500/40"
												: "bg-zinc-800 hover:bg-zinc-700/60"
										}`}
									>
										<div className="flex items-center gap-3 p-3">
											{/* Cover + play button overlay */}
											<div className="relative shrink-0 w-12 h-12 group">
												<img
													src={track.image_url || "/album-placeholder.png"}
													alt=""
													className="w-12 h-12 rounded object-cover"
												/>
												<button
													onClick={() => handlePreview(track)}
													className="absolute inset-0 flex items-center justify-center rounded bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
												>
													{isPlaying
														? <Pause className="h-5 w-5 text-white" fill="white" />
														: <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
													}
												</button>
												{isPlaying && (
													<div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-600 rounded-b">
														<div
															className="h-full bg-green-500 rounded-b transition-all"
															style={{ width: `${progress}%` }}
														/>
													</div>
												)}
											</div>

											{/* Track info */}
											<div className="flex-1 min-w-0">
												<p className="font-medium text-white truncate text-sm">{track.title}</p>
												<p className="text-xs text-zinc-400 truncate">
													{track.artist}
													{track.album_name ? ` · ${track.album_name}` : ""}
												</p>
												<div className="flex items-center gap-2 mt-0.5">
													<span className="text-xs text-zinc-500">
														{isPlaying
															? `${formatDuration(currentTime)} / ${formatDuration(audioDuration)}`
															: formatDuration(track.duration)
														}
													</span>
													{track.license_url && (
														<a
															href={track.license_url}
															target="_blank"
															rel="noopener noreferrer"
															className="text-xs text-green-500 hover:text-green-400"
														>
															CC лицензия
														</a>
													)}
												</div>
											</div>

											{/* Action buttons */}
											<div className="flex items-center gap-1 shrink-0">
												{/* Preview button */}
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handlePreview(track)}
													className={`h-8 w-8 p-0 ${
														isPlaying
															? "text-green-400 hover:text-green-300"
															: "text-zinc-400 hover:text-white"
													}`}
												>
													{isPlaying
														? <Pause className="h-4 w-4" fill="currentColor" />
														: <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
													}
												</Button>

												{/* Import button */}
												<Button
													size="sm"
													onClick={() => handleImport(track)}
													disabled={isImporting || isImported}
													className={`${
														isImported
															? "bg-zinc-700 text-green-400 cursor-default"
															: "bg-green-600 hover:bg-green-700"
													}`}
												>
													{isImporting ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : isImported ? (
														<CheckCircle2 className="h-4 w-4" />
													) : (
														<>
															<Download className="h-4 w-4 mr-1" />
															Добавить
														</>
													)}
												</Button>
											</div>
										</div>

										{/* Seekbar — только для активного трека */}
										{isPlaying && (
											<div
												className="mx-3 mb-2 h-1.5 bg-zinc-600 rounded-full cursor-pointer"
												onClick={(e) => handleSeek(e, track)}
											>
												<div
													className="h-full bg-green-500 rounded-full transition-all"
													style={{ width: `${progress}%` }}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}

					{!loading && results.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-zinc-500">
							<Music className="h-12 w-12 mb-3 opacity-30" />
							<p className="text-sm text-center">Ничего не найдено</p>
							<p className="text-xs text-center mt-1 text-zinc-600">
								Попробуй другой запрос или выбери жанр
							</p>
						</div>
					)}
				</div>

				{/* Now playing bar */}
				{playingId && (() => {
					const playing = results.find(t => t.jamendo_id === playingId);
					if (!playing) return null;
					return (
						<div className="flex-shrink-0 mt-2 p-3 rounded-lg bg-zinc-800 border border-green-500/30 flex items-center gap-3">
							<img
								src={playing.image_url || "/album-placeholder.png"}
								alt=""
								className="w-8 h-8 rounded object-cover shrink-0"
							/>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-white truncate">{playing.title}</p>
								<p className="text-xs text-zinc-400 truncate">{playing.artist}</p>
							</div>
							<span className="text-xs text-zinc-400 shrink-0">
								{formatDuration(currentTime)} / {formatDuration(audioDuration)}
							</span>
							<button
								onClick={stopAudio}
								className="text-zinc-400 hover:text-white transition-colors"
							>
								<Square className="h-4 w-4" fill="currentColor" />
							</button>
						</div>
					);
				})()}
			</DialogContent>
		</Dialog>
	);
};
