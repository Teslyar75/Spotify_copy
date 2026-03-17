import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Search, Download, Music, Loader2, CheckCircle2 } from "lucide-react";

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
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const JamendoImportModal = ({ isOpen, onClose, onImported }: Props) => {
	const [query, setQuery] = useState("");
	const [tags, setTags] = useState("");
	const [results, setResults] = useState<JamendoTrack[]>([]);
	const [loading, setLoading] = useState(false);
	const [importing, setImporting] = useState<string | null>(null);
	const [imported, setImported] = useState<Set<string>>(new Set());

	const handleSearch = async () => {
		if (!query.trim() && !tags.trim()) {
			toast.error("Введите поисковый запрос или выберите жанр");
			return;
		}
		setLoading(true);
		setResults([]);
		try {
			const params = new URLSearchParams({ limit: "30" });
			if (query.trim()) params.set("q", query.trim());
			if (tags.trim()) params.set("tags", tags.trim());
			const res = await axiosInstance.get(`/jamendo/search?${params}`);
			setResults(res.data);
			if (res.data.length === 0) toast("Ничего не найдено");
		} catch {
			toast.error("Ошибка поиска. Проверьте подключение.");
		} finally {
			setLoading(false);
		}
	};

	const handleImport = async (track: JamendoTrack) => {
		setImporting(track.jamendo_id);
		try {
			const res = await axiosInstance.post("/jamendo/import", {
				jamendo_id: track.jamendo_id,
				title: track.title,
				artist: track.artist,
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
		setQuery("");
		setTags("");
		setResults([]);
		setImported(new Set());
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl w-full max-h-[85vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-xl flex items-center gap-2">
						<Music className="h-5 w-5 text-green-400" />
						Импорт из Jamendo
					</DialogTitle>
					<p className="text-zinc-400 text-sm mt-1">
						Бесплатная музыка под Creative Commons лицензией. Треки стримятся напрямую с серверов Jamendo.
					</p>
				</DialogHeader>

				{/* Search controls */}
				<div className="space-y-3 flex-shrink-0">
					<div className="flex gap-2">
						<Input
							placeholder="Поиск: название, артист..."
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
									setTags(genre);
									setQuery("");
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
					</div>
				</div>

				{/* Results */}
				<ScrollArea className="flex-1 min-h-0 mt-2">
					{loading && (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-green-500" />
							<span className="ml-3 text-zinc-400">Поиск на Jamendo...</span>
						</div>
					)}

					{!loading && results.length > 0 && (
						<div className="space-y-2 pr-2">
							{results.map((track) => {
								const isImported = imported.has(track.jamendo_id);
								const isImporting = importing === track.jamendo_id;
								return (
									<div
										key={track.jamendo_id}
										className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700/60 transition-colors"
									>
										<img
											src={track.image_url || "/album-placeholder.png"}
											alt=""
											className="w-12 h-12 rounded object-cover shrink-0"
										/>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-white truncate text-sm">{track.title}</p>
											<p className="text-xs text-zinc-400 truncate">
												{track.artist}
												{track.album_name ? ` · ${track.album_name}` : ""}
											</p>
											<div className="flex items-center gap-2 mt-0.5">
												<span className="text-xs text-zinc-500">{formatDuration(track.duration)}</span>
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
										<Button
											size="sm"
											onClick={() => handleImport(track)}
											disabled={isImporting || isImported}
											className={`shrink-0 ${
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
								);
							})}
						</div>
					)}

					{!loading && results.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-zinc-500">
							<Music className="h-12 w-12 mb-3 opacity-30" />
							<p className="text-sm">Введите запрос или выберите жанр для поиска</p>
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};
