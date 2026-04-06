import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Music, Disc, Upload, Pencil, Trash2, ChevronDown, ChevronUp, Radio } from "lucide-react";
import { JamendoImportModal } from "@/components/ui/JamendoImportModal";
import { TrackCoverImg } from "@/components/TrackCoverImg";
import { Card, CardContent } from "@/components/ui/card";
import { Album, Song } from "@/types";
import toast from "react-hot-toast";

// Вынесен за пределы AdminPage — иначе React пересоздаёт тип компонента
// при каждом ре-рендере и размонтирует поля ввода.
interface FileOrUrlInputProps {
	label: string;
	accept: string;
	value: string;
	onChange: (v: string) => void;
	file: File | null;
	onFileChange: (f: File | null) => void;
	onAudioFileSelect?: (file: File) => void;
}

const FileOrUrlInput = ({
	label,
	accept,
	value,
	onChange,
	file,
	onFileChange,
	onAudioFileSelect,
}: FileOrUrlInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div>
			<label className="text-sm text-zinc-400 block mb-1">{label}</label>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
				<button
					type="button"
					className="flex w-full sm:flex-1 min-h-10 items-center justify-center gap-2 px-3 rounded-md bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-700 shrink-0"
					onClick={() => inputRef.current?.click()}
				>
					<Upload className="h-4 w-4 shrink-0" />
					<span className="text-sm truncate max-w-[min(100%,14rem)]">{file ? file.name.slice(0, 18) + "…" : "С файла"}</span>
				</button>
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];
						if (f) {
							onFileChange(f);
							onChange("");
							onAudioFileSelect?.(f);
						}
					}}
				/>
				<span className="text-zinc-500 text-sm text-center sm:self-center sm:px-0.5 shrink-0">или</span>
				<Input
					placeholder="URL"
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						onFileChange(null);
					}}
					className="w-full sm:flex-1 min-w-0"
				/>
			</div>
			{file && <p className="text-xs text-green-400 mt-1">✓ {file.name}</p>}
		</div>
	);
};

const AdminPage = () => {
	const {
		albums,
		allSongs,
		fetchAlbums,
		fetchAllSongs,
		createAlbum,
		createSong,
		updateAlbum,
		deleteAlbum,
		updateSong,
		deleteSong,
		uploadImage,
		uploadAudio,
		error,
		clearError,
		setError,
	} = useMusicStore();

	const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
	const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
	const [isJamendoOpen, setIsJamendoOpen] = useState(false);
	const [isEditAlbumDialogOpen, setIsEditAlbumDialogOpen] = useState(false);
	const [isEditSongDialogOpen, setIsEditSongDialogOpen] = useState(false);
	const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
	const [editingSong, setEditingSong] = useState<Song | null>(null);
	const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
	const [deleteConfirm, setDeleteConfirm] = useState<{
		type: "album" | "song";
		id: string;
		title: string;
	} | null>(null);
	const [uploading, setUploading] = useState(false);

	const [songForm, setSongForm] = useState({
		title: "",
		artist: "",
		album_id: "",
		image_url: "",
		imageFile: null as File | null,
		file_url: "",
		audioFile: null as File | null,
		duration: 0,
	});

	const [albumForm, setAlbumForm] = useState({
		title: "",
		artist: "",
		image_url: "",
		imageFile: null as File | null,
		release_year: new Date().getFullYear(),
	});

	const [editAlbumForm, setEditAlbumForm] = useState({
		title: "",
		artist: "",
		image_url: "",
		imageFile: null as File | null,
		release_year: new Date().getFullYear(),
	});

	const [editSongForm, setEditSongForm] = useState({
		title: "",
		artist: "",
		album_id: "",
		image_url: "",
		imageFile: null as File | null,
		file_url: "",
		audioFile: null as File | null,
		duration: 0,
	});

	const refreshAll = () => {
		fetchAlbums();
		fetchAllSongs();
	};

	useEffect(() => {
		refreshAll();
	}, []);

	const toggleAlbumExpand = (id: string) => {
		setExpandedAlbums((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleCreateAlbum = async () => {
		clearError();
		const title = albumForm.title.trim();
		const artist = albumForm.artist.trim();
		const imageUrl = albumForm.image_url.trim();

		if (!title || !artist) {
			toast.error("Заполните название и артиста");
			return;
		}
		if (!imageUrl && !albumForm.imageFile) {
			toast.error("Укажите обложку: файл или URL");
			return;
		}

		setUploading(true);
		let finalImageUrl = imageUrl;

		if (albumForm.imageFile) {
			const url = await uploadImage(albumForm.imageFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки обложки");
				setUploading(false);
				return;
			}
			finalImageUrl = url;
		}

		const result = await createAlbum({
			title,
			artist,
			image_url: finalImageUrl,
			release_year: albumForm.release_year,
		});

		setUploading(false);
		if (result) {
			toast.success("Альбом создан!");
			setIsAlbumDialogOpen(false);
			setAlbumForm({ title: "", artist: "", image_url: "", imageFile: null, release_year: new Date().getFullYear() });
			refreshAll();
		} else {
			toast.error(useMusicStore.getState().error || "Ошибка создания альбома");
		}
	};

	const handleCreateSong = async () => {
		clearError();
		const title = songForm.title.trim();
		const artist = songForm.artist.trim();

		if (!title || !artist) {
			toast.error("Заполните название и артиста");
			return;
		}
		if (!songForm.image_url.trim() && !songForm.imageFile) {
			toast.error("Укажите обложку трека");
			return;
		}
		if (!songForm.file_url.trim() && !songForm.audioFile) {
			toast.error("Укажите аудиофайл");
			return;
		}

		setUploading(true);
		let imageUrl = songForm.image_url.trim();
		let fileUrl = songForm.file_url.trim();

		if (songForm.imageFile) {
			const url = await uploadImage(songForm.imageFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки обложки");
				setUploading(false);
				return;
			}
			imageUrl = url;
		}
		if (songForm.audioFile) {
			const url = await uploadAudio(songForm.audioFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки аудио");
				setUploading(false);
				return;
			}
			fileUrl = url;
		}

		const result = await createSong({
			title,
			artist,
			album_id: songForm.album_id || undefined,
			image_url: imageUrl,
			file_url: fileUrl,
			duration: songForm.duration,
		});

		setUploading(false);
		if (result) {
			toast.success("Трек создан!");
			setIsSongDialogOpen(false);
			setSongForm({ title: "", artist: "", album_id: "", image_url: "", imageFile: null, file_url: "", audioFile: null, duration: 0 });
			refreshAll();
		} else {
			toast.error(useMusicStore.getState().error || "Ошибка создания трека");
		}
	};

	const openEditAlbum = (album: Album) => {
		setEditingAlbum(album);
		setEditAlbumForm({
			title: album.title,
			artist: album.artist,
			image_url: album.image_url || "",
			imageFile: null,
			release_year: album.release_year,
		});
		setIsEditAlbumDialogOpen(true);
	};

	const handleEditAlbum = async () => {
		if (!editingAlbum) return;
		clearError();

		if (!editAlbumForm.image_url.trim() && !editAlbumForm.imageFile) {
			toast.error("Укажите обложку альбома");
			return;
		}

		setUploading(true);
		let imageUrl = editAlbumForm.image_url.trim();

		if (editAlbumForm.imageFile) {
			const url = await uploadImage(editAlbumForm.imageFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки обложки");
				setUploading(false);
				return;
			}
			imageUrl = url;
		}

		const result = await updateAlbum(editingAlbum.id, {
			title: editAlbumForm.title,
			artist: editAlbumForm.artist,
			image_url: imageUrl,
			release_year: editAlbumForm.release_year,
		});

		setUploading(false);
		if (result) {
			toast.success("Альбом обновлён!");
			setIsEditAlbumDialogOpen(false);
			setEditingAlbum(null);
			refreshAll();
		} else {
			toast.error(useMusicStore.getState().error || "Ошибка обновления альбома");
		}
	};

	const handleDeleteAlbum = async () => {
		if (!deleteConfirm || deleteConfirm.type !== "album") return;
		const ok = await deleteAlbum(deleteConfirm.id);
		if (ok) {
			toast.success("Альбом удалён");
			setDeleteConfirm(null);
			refreshAll();
		} else {
			toast.error("Ошибка удаления");
		}
	};

	const openEditSong = (song: Song) => {
		setEditingSong(song);
		setEditSongForm({
			title: song.title,
			artist: song.artist,
			album_id: song.album_id || "",
			image_url: song.image_url || "",
			imageFile: null,
			file_url: song.file_url || "",
			audioFile: null,
			duration: song.duration || 0,
		});
		setIsEditSongDialogOpen(true);
	};

	const handleEditSong = async () => {
		if (!editingSong) return;
		clearError();
		setUploading(true);

		let imageUrl = editSongForm.image_url.trim();
		let fileUrl = editSongForm.file_url.trim();

		if (editSongForm.imageFile) {
			const url = await uploadImage(editSongForm.imageFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки обложки");
				setUploading(false);
				return;
			}
			imageUrl = url;
		}
		if (editSongForm.audioFile) {
			const url = await uploadAudio(editSongForm.audioFile);
			if (!url) {
				toast.error(useMusicStore.getState().error || "Ошибка загрузки аудио");
				setUploading(false);
				return;
			}
			fileUrl = url;
		}

		const result = await updateSong(editingSong.id, {
			title: editSongForm.title,
			artist: editSongForm.artist,
			album_id: editSongForm.album_id || null,
			image_url: imageUrl || null,
			file_url: fileUrl,
			duration: editSongForm.duration,
		});

		setUploading(false);
		if (result) {
			toast.success("Трек обновлён!");
			setIsEditSongDialogOpen(false);
			setEditingSong(null);
			refreshAll();
		} else {
			toast.error(useMusicStore.getState().error || "Ошибка обновления трека");
		}
	};

	const handleDeleteSong = async () => {
		if (!deleteConfirm || deleteConfirm.type !== "song") return;
		const ok = await deleteSong(deleteConfirm.id);
		if (ok) {
			toast.success("Трек удалён");
			setDeleteConfirm(null);
			refreshAll();
		} else {
			toast.error("Ошибка удаления");
		}
	};

	return (
		<div className="min-h-0 h-[100dvh] bg-zinc-900 text-white flex flex-col overflow-hidden">
			{/* Header */}
			<div className="p-4 sm:p-6 border-b border-zinc-800 flex-shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<h1 className="text-2xl sm:text-3xl font-bold mb-1">Admin Dashboard</h1>
						<p className="text-zinc-400 text-xs sm:text-sm break-words">Вход: test@example.com / test123</p>
					</div>
					<Link
						to="/"
						className="inline-flex items-center justify-center shrink-0 px-4 py-2.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors w-full sm:w-auto text-center"
					>
						← На главную
					</Link>
				</div>
				{error && (
					<div className="mt-3 p-3 rounded bg-red-900/30 border border-red-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-red-300 text-sm break-words flex-1 min-w-0">{error}</p>
						<button type="button" onClick={clearError} className="text-red-300 hover:text-white self-end sm:self-auto text-lg leading-none shrink-0">×</button>
					</div>
				)}
			</div>

			{/* Кнопки вне ScrollArea — иначе во viewport Radix текст на кнопках мог визуально пропадать на узком экране */}
			<div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900">
				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap max-w-[1600px] mx-auto w-full min-w-0">
					<Button
						className="bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-11 shrink-0 justify-center overflow-visible whitespace-normal sm:whitespace-nowrap px-4"
						onClick={() => { clearError(); setIsSongDialogOpen(true); }}
					>
						<Music className="h-4 w-4 shrink-0" />
						<span className="shrink-0">Добавить трек</span>
					</Button>
					<Button
						className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-11 shrink-0 justify-center overflow-visible whitespace-normal sm:whitespace-nowrap px-4"
						onClick={() => { clearError(); setIsAlbumDialogOpen(true); }}
					>
						<Disc className="h-4 w-4 shrink-0" />
						<span className="shrink-0">Добавить альбом</span>
					</Button>
					<Button
						className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-11 shrink-0 justify-center overflow-visible whitespace-normal sm:whitespace-nowrap px-4"
						onClick={() => { clearError(); setIsJamendoOpen(true); }}
					>
						<Radio className="h-4 w-4 shrink-0" />
						<span className="shrink-0">Импорт из Jamendo</span>
					</Button>
				</div>
			</div>

			<ScrollArea className="flex-1 min-h-0 min-w-0 touch-pan-y">
				<div className="p-4 sm:p-6 pb-8 space-y-8 max-w-[1600px] mx-auto w-full min-w-0">
				{/* All Songs list */}
				<div>
					<h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Все треки ({allSongs.length})</h2>
					<div className="space-y-2">
						{allSongs.length === 0 && (
							<p className="text-zinc-500 text-sm px-1">Треков пока нет</p>
						)}
						{allSongs.map((song) => (
							<div
								key={song.id}
								className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700/60 transition-colors overflow-hidden"
							>
								<div className="flex items-start gap-3 min-w-0 flex-1">
									<TrackCoverImg
										src={song.image_url}
										alt=""
										className="w-11 h-11 object-cover rounded shrink-0 mt-0.5"
									/>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-white break-words sm:truncate">{song.title}</p>
										<p className="text-xs text-zinc-400 mt-0.5 break-words">
											{song.artist}
											{song.album_name ? ` · ${song.album_name}` : " · Без альбома"}
											{" · "}{song.duration} сек
										</p>
									</div>
								</div>
								<div className="flex gap-2 shrink-0 w-full sm:w-auto justify-stretch sm:justify-end pt-1 sm:pt-0 border-t border-zinc-700/50 sm:border-0">
									<Button
										size="sm"
										variant="ghost"
										className="flex-1 sm:flex-initial min-h-10 h-auto py-2 px-3 sm:h-8 sm:w-8 sm:min-w-8 sm:p-0 text-zinc-300 hover:text-white hover:bg-zinc-700/80"
										title="Редактировать"
										onClick={() => openEditSong(song)}
									>
										<Pencil className="h-4 w-4 shrink-0" />
										<span className="ml-2 text-xs sm:sr-only">Правка</span>
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="flex-1 sm:flex-initial min-h-10 h-auto py-2 px-3 sm:h-8 sm:w-8 sm:min-w-8 sm:p-0 text-red-400 hover:bg-red-900/30 hover:text-red-200"
										title="Удалить"
										onClick={() => setDeleteConfirm({ type: "song", id: song.id, title: song.title })}
									>
										<Trash2 className="h-4 w-4 shrink-0" />
										<span className="ml-2 text-xs sm:sr-only">Удалить</span>
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Albums list */}
				<div>
					<h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Альбомы ({albums.length})</h2>
						<div className="space-y-4">
							{albums.map((album) => (
								<Card key={album.id} className="bg-zinc-800 border-zinc-700 overflow-hidden">
									<CardContent className="p-3 sm:p-4">
										<div className="flex flex-col sm:flex-row gap-4">
											<TrackCoverImg
												src={album.image_url}
												alt={album.title}
												className="w-full max-w-[12rem] h-48 sm:h-24 sm:w-24 object-cover rounded mx-auto sm:mx-0 shrink-0"
											/>
											<div className="flex-1 min-w-0 text-center sm:text-left">
												<h3 className="font-semibold break-words sm:truncate">{album.title}</h3>
												<p className="text-sm text-zinc-400 break-words sm:truncate mt-0.5">{album.artist}</p>
												<p className="text-xs text-zinc-500">{album.release_year}</p>
												<p className="text-xs text-zinc-500">{album.songs?.length ?? 0} треков</p>
												<div className="flex flex-col sm:flex-row gap-2 mt-2 sm:flex-wrap sm:justify-start">
													<Button size="sm" variant="outline" className="border-zinc-600 w-full sm:w-auto min-h-9 shrink-0 justify-center overflow-visible whitespace-normal sm:whitespace-nowrap" onClick={() => openEditAlbum(album)}>
														<Pencil className="h-3 w-3 mr-1 shrink-0" />
														<span>Изменить</span>
													</Button>
													<Button
														size="sm"
														variant="outline"
														className="border-red-600 text-red-400 hover:bg-red-900/30 w-full sm:w-auto min-h-9 shrink-0 justify-center overflow-visible whitespace-normal sm:whitespace-nowrap"
														onClick={() => setDeleteConfirm({ type: "album", id: album.id, title: album.title })}
													>
														<Trash2 className="h-3 w-3 mr-1 shrink-0" />
														<span>Удалить</span>
													</Button>
													{(album.songs?.length ?? 0) > 0 && (
														<Button
															size="sm"
															variant="ghost"
															className="w-full sm:w-auto min-h-9 shrink-0 justify-center gap-1"
															onClick={() => toggleAlbumExpand(album.id)}
															aria-expanded={expandedAlbums.has(album.id)}
														>
															{expandedAlbums.has(album.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
															<span className="text-xs sm:inline">Треки ({album.songs?.length ?? 0})</span>
														</Button>
													)}
												</div>
											</div>
										</div>

										{expandedAlbums.has(album.id) && (
											<div className="mt-4 pt-4 border-t border-zinc-700 space-y-2">
												{(album.songs ?? []).map((song) => (
													<div key={song.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2.5 px-3 rounded bg-zinc-900">
														<div className="flex items-center gap-3 min-w-0 flex-1">
															<TrackCoverImg src={song.image_url} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
															<div className="min-w-0">
																<p className="font-medium truncate">{song.title}</p>
																<p className="text-xs text-zinc-500 line-clamp-2 sm:truncate">{song.artist} · {song.duration} сек</p>
															</div>
														</div>
														<div className="flex gap-1 shrink-0 justify-end">
															<Button size="sm" variant="ghost" onClick={() => openEditSong(song)}>
																<Pencil className="h-3 w-3" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="text-red-400 hover:bg-red-900/30"
																onClick={() => setDeleteConfirm({ type: "song", id: song.id, title: song.title })}
															>
																<Trash2 className="h-3 w-3" />
															</Button>
														</div>
													</div>
												))}
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>

			{/* === Create Album Dialog === */}
			<Dialog open={isAlbumDialogOpen} onOpenChange={(open) => { setIsAlbumDialogOpen(open); if (!open) clearError(); }}>
				<DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Новый альбом</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Название *</label>
							<Input
								placeholder="Название альбома"
								value={albumForm.title}
								onChange={(e) => setAlbumForm((f) => ({ ...f, title: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Артист *</label>
							<Input
								placeholder="Имя артиста"
								value={albumForm.artist}
								onChange={(e) => setAlbumForm((f) => ({ ...f, artist: e.target.value }))}
							/>
						</div>
						<FileOrUrlInput
							label="Обложка * (файл или URL)"
							accept="image/jpeg,image/png,image/webp,image/jpg"
							value={albumForm.image_url}
							onChange={(v) => setAlbumForm((f) => ({ ...f, image_url: v }))}
							file={albumForm.imageFile}
							onFileChange={(file) => setAlbumForm((f) => ({ ...f, imageFile: file }))}
						/>
						<p className="text-xs text-zinc-500">Пример URL: https://picsum.photos/300/300</p>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Год</label>
							<Input
								type="number"
								value={albumForm.release_year}
								onChange={(e) => setAlbumForm((f) => ({ ...f, release_year: parseInt(e.target.value) || new Date().getFullYear() }))}
							/>
						</div>
						<Button className="w-full" disabled={uploading} onClick={handleCreateAlbum}>
							{uploading ? "Создание..." : "Создать альбом"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* === Create Song Dialog === */}
			<Dialog open={isSongDialogOpen} onOpenChange={(open) => { setIsSongDialogOpen(open); if (!open) clearError(); }}>
				<DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Новый трек</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Название *</label>
							<Input
								placeholder="Название трека"
								value={songForm.title}
								onChange={(e) => setSongForm((f) => ({ ...f, title: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Артист *</label>
							<Input
								placeholder="Имя артиста"
								value={songForm.artist}
								onChange={(e) => setSongForm((f) => ({ ...f, artist: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Альбом</label>
							<select
								className="w-full h-10 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white"
								value={songForm.album_id}
								onChange={(e) => setSongForm((f) => ({ ...f, album_id: e.target.value }))}
							>
								<option value="">— Без альбома —</option>
								{albums.map((a) => (
									<option key={a.id} value={a.id}>{a.title} — {a.artist}</option>
								))}
							</select>
						</div>
						<FileOrUrlInput
							label="Обложка * (файл или URL)"
							accept="image/jpeg,image/png,image/webp,image/jpg"
							value={songForm.image_url}
							onChange={(v) => setSongForm((f) => ({ ...f, image_url: v }))}
							file={songForm.imageFile}
							onFileChange={(file) => setSongForm((f) => ({ ...f, imageFile: file }))}
						/>
						<FileOrUrlInput
							label="Аудио * (файл или URL)"
							accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
							value={songForm.file_url}
							onChange={(v) => setSongForm((f) => ({ ...f, file_url: v }))}
							file={songForm.audioFile}
							onFileChange={(file) => setSongForm((f) => ({ ...f, audioFile: file }))}
							onAudioFileSelect={(f) => {
								const audio = new Audio();
								audio.onloadedmetadata = () => {
									setSongForm((s) => ({ ...s, duration: Math.round(audio.duration) }));
								};
								audio.src = URL.createObjectURL(f);
							}}
						/>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Длительность (сек)</label>
							<Input
								type="number"
								value={songForm.duration || ""}
								onChange={(e) => setSongForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
							/>
						</div>
						<Button className="w-full" disabled={uploading} onClick={handleCreateSong}>
							{uploading ? "Создание..." : "Создать трек"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* === Edit Album Dialog === */}
			<Dialog open={isEditAlbumDialogOpen} onOpenChange={(open) => { setIsEditAlbumDialogOpen(open); if (!open) clearError(); }}>
				<DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Редактировать альбом</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Название</label>
							<Input
								value={editAlbumForm.title}
								onChange={(e) => setEditAlbumForm((f) => ({ ...f, title: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Артист</label>
							<Input
								value={editAlbumForm.artist}
								onChange={(e) => setEditAlbumForm((f) => ({ ...f, artist: e.target.value }))}
							/>
						</div>
						<FileOrUrlInput
							label="Обложка"
							accept="image/jpeg,image/png,image/webp,image/jpg"
							value={editAlbumForm.image_url}
							onChange={(v) => setEditAlbumForm((f) => ({ ...f, image_url: v }))}
							file={editAlbumForm.imageFile}
							onFileChange={(file) => setEditAlbumForm((f) => ({ ...f, imageFile: file }))}
						/>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Год</label>
							<Input
								type="number"
								value={editAlbumForm.release_year}
								onChange={(e) => setEditAlbumForm((f) => ({ ...f, release_year: parseInt(e.target.value) || new Date().getFullYear() }))}
							/>
						</div>
						<Button className="w-full" disabled={uploading} onClick={handleEditAlbum}>
							{uploading ? "Сохранение..." : "Сохранить"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* === Edit Song Dialog === */}
			<Dialog open={isEditSongDialogOpen} onOpenChange={(open) => { setIsEditSongDialogOpen(open); if (!open) clearError(); }}>
				<DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Редактировать трек</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Название</label>
							<Input
								value={editSongForm.title}
								onChange={(e) => setEditSongForm((f) => ({ ...f, title: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Артист</label>
							<Input
								value={editSongForm.artist}
								onChange={(e) => setEditSongForm((f) => ({ ...f, artist: e.target.value }))}
							/>
						</div>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Альбом</label>
							<select
								className="w-full h-10 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-white"
								value={editSongForm.album_id}
								onChange={(e) => setEditSongForm((f) => ({ ...f, album_id: e.target.value }))}
							>
								<option value="">— Без альбома —</option>
								{albums.map((a) => (
									<option key={a.id} value={a.id}>{a.title} — {a.artist}</option>
								))}
							</select>
						</div>
						<FileOrUrlInput
							label="Обложка"
							accept="image/jpeg,image/png,image/webp,image/jpg"
							value={editSongForm.image_url}
							onChange={(v) => setEditSongForm((f) => ({ ...f, image_url: v }))}
							file={editSongForm.imageFile}
							onFileChange={(file) => setEditSongForm((f) => ({ ...f, imageFile: file }))}
						/>
						<FileOrUrlInput
							label="Аудио"
							accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
							value={editSongForm.file_url}
							onChange={(v) => setEditSongForm((f) => ({ ...f, file_url: v }))}
							file={editSongForm.audioFile}
							onFileChange={(file) => setEditSongForm((f) => ({ ...f, audioFile: file }))}
							onAudioFileSelect={(f) => {
								const audio = new Audio();
								audio.onloadedmetadata = () => {
									setEditSongForm((s) => ({ ...s, duration: Math.round(audio.duration) }));
								};
								audio.src = URL.createObjectURL(f);
							}}
						/>
						<div>
							<label className="text-sm text-zinc-400 block mb-1">Длительность (сек)</label>
							<Input
								type="number"
								value={editSongForm.duration || ""}
								onChange={(e) => setEditSongForm((f) => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
							/>
						</div>
						<Button className="w-full" disabled={uploading} onClick={handleEditSong}>
							{uploading ? "Сохранение..." : "Сохранить"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* === Delete Confirmation === */}
			<Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
				<DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Подтверждение удаления</DialogTitle>
					</DialogHeader>
					{deleteConfirm && (
						<p className="text-zinc-300">
							Удалить {deleteConfirm.type === "album" ? "альбом" : "трек"}{" "}
							<strong>«{deleteConfirm.title}»</strong>?
							{deleteConfirm.type === "album" && (
								<span className="block text-sm text-red-400 mt-1">Все треки альбома тоже будут удалены.</span>
							)}
						</p>
					)}
					<DialogFooter className="gap-2 mt-2 flex-col-reverse sm:flex-row sm:justify-end">
						<Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
						<Button
							variant="destructive"
							className="w-full sm:w-auto"
							onClick={() => {
								if (deleteConfirm?.type === "album") handleDeleteAlbum();
								else handleDeleteSong();
							}}
						>
							Удалить
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		{/* Jamendo Import Modal */}
		<JamendoImportModal
			isOpen={isJamendoOpen}
			onClose={() => setIsJamendoOpen(false)}
			onImported={() => refreshAll()}
		/>
		</div>
	);
};

export default AdminPage;
