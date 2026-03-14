import { usePlayerStore } from "@/stores/usePlayerStore";
import { useArtistStore } from "@/stores/useArtistStore";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
	Repeat,
	Repeat1,
	Shuffle,
	Plus,
	Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import AddToPlaylistModal from "@/components/ui/AddToPlayListModal";

const formatTime = (seconds: number) => {
	if (!isFinite(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
	const {
		currentSong,
		isPlaying,
		togglePlay,
		playNext,
		playPrevious,
		volume,
		setVolume,
		isMuted,
		toggleMute,
		progress,
		duration,
		setProgress,
		setDuration,
	} = usePlayerStore();

	const { openArtist } = useArtistStore();
	const { likedSongs, likeSong, unlikeSong } = useLibraryStore();

	const [isShuffled, setIsShuffled] = useState(false);
	const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Проверяем, лайкнут ли текущий трек
	const isLiked = currentSong ? likedSongs.some((s) => s.id === currentSong.id) : false;

	useEffect(() => {
		const audio = document.querySelector("audio");
		if (!audio) return;

		const handleTimeUpdate = () => setProgress(audio.currentTime);
		const handleLoadedMetadata = () => setDuration(audio.duration);

		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("loadedmetadata", handleLoadedMetadata);

		return () => {
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
		};
	}, [setProgress, setDuration]);

	const handleSeek = (value: number[]) => {
		const audio = document.querySelector("audio");
		if (audio) {
			audio.currentTime = value[0];
			setProgress(value[0]);
		}
	};

	const toggleRepeat = () => {
		setRepeatMode((prev) => {
			if (prev === "off") return "all";
			if (prev === "all") return "one";
			return "off";
		});
	};

	if (!currentSong) return null;

	return (
		<div className="border-t border-white/10 bg-[#181818] px-3 py-2 md:px-4 md:py-3">
			<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
				{/* Song Info */}
				<div className="flex items-center gap-3 min-w-0 md:w-[28%] md:min-w-[180px]">
					<img
						src={currentSong.image_url || "/album-placeholder.png"}
						alt={currentSong.title}
						className="h-12 w-12 md:h-14 md:w-14 rounded object-cover shadow-lg shrink-0"
					/>
					<div className="min-w-0 overflow-hidden">
						<p className="text-sm md:text-sm font-medium text-white truncate">
							{currentSong.title}
						</p>

						<button
							onClick={() =>
								openArtist({
									name: currentSong.artist,
									imageUrl: currentSong.image_url,
								})
							}
							className="text-xs text-spotify-text-muted truncate hover:text-spotify-green hover:underline text-left block w-full"
						>
							{currentSong.artist}
						</button>
					</div>

					{/* Add to Playlist */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsModalOpen(true)}
						className="h-6 w-6 text-spotify-text-muted hover:text-white ml-2"
					>
						<Plus className="h-4 w-4" />
					</Button>

					{/* Like / Unlike */}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							if (!currentSong) return;
							if (isLiked) unlikeSong(currentSong.id);
							else likeSong(currentSong);
						}}
						className={`h-6 w-6 ${
							isLiked ? "text-spotify-green" : "text-spotify-text-muted hover:text-white"
						}`}
					>
						<Heart className="h-4 w-4" fill="currentColor" />
					</Button>

					{/* Modal */}
					{currentSong && (
						<AddToPlaylistModal
							trackId={currentSong.id}
							isOpen={isModalOpen}
							onClose={() => setIsModalOpen(false)}
						/>
					)}
				</div>

				{/* Player Controls */}
				<div className="flex flex-col gap-2 md:flex-1 md:max-w-[640px]">
					<div className="flex items-center justify-center gap-1 sm:gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsShuffled(!isShuffled)}
							className={`hidden md:flex h-8 w-8 ${
								isShuffled ? "text-spotify-green" : "text-spotify-text-muted hover:text-white"
							}`}
						>
							<Shuffle className="h-4 w-4" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={playPrevious}
							className="h-8 w-8 text-spotify-text-muted hover:text-white"
						>
							<SkipBack className="h-4 w-4 md:h-5 md:w-5" />
						</Button>

						<Button
							size="icon"
							onClick={togglePlay}
							className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-white hover:bg-white hover:scale-105 text-black border-0"
						>
							{isPlaying ? (
								<Pause className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
							) : (
								<Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" fill="currentColor" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={playNext}
							className="h-8 w-8 text-spotify-text-muted hover:text-white"
						>
							<SkipForward className="h-4 w-4 md:h-5 md:w-5" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onClick={toggleRepeat}
							className={`hidden md:flex h-8 w-8 ${
								repeatMode !== "off"
									? "text-spotify-green"
									: "text-spotify-text-muted hover:text-white"
							}`}
						>
							{repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
						</Button>
					</div>

					<div className="flex items-center gap-2 w-full">
						<span className="text-[11px] md:text-xs text-spotify-text-muted w-8 md:w-10 text-right">
							{formatTime(progress)}
						</span>

						<Slider
							value={[progress]}
							max={duration || 100}
							step={0.1}
							onValueChange={handleSeek}
							className="flex-1 [&_[data-orientation=horizontal]]:h-1"
						/>

						<span className="text-[11px] md:text-xs text-spotify-text-muted w-8 md:w-10">
							{formatTime(duration)}
						</span>
					</div>
				</div>

				{/* Volume */}
				<div className="hidden md:flex items-center justify-end gap-2 md:w-[24%] lg:w-[30%] md:min-w-[140px]">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleMute}
						className="h-8 w-8 text-spotify-text-muted hover:text-white"
					>
						{isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
					</Button>

					<Slider
						value={[isMuted ? 0 : volume]}
						max={1}
						step={0.01}
						onValueChange={(v) => setVolume(v[0])}
						className="w-20 lg:w-24 [&_[data-orientation=horizontal]]:h-1"
					/>
				</div>
			</div>
		</div>
	);
};