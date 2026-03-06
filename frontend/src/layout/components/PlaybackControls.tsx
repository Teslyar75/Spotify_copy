import { usePlayerStore } from "@/stores/usePlayerStore";
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
} from "lucide-react";
import { useEffect, useState } from "react";

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

	const [isShuffled, setIsShuffled] = useState(false);
	const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

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
		<div className="h-[90px] min-h-[90px] bg-[#181818] border-t border-white/10 px-4 flex items-center justify-between gap-4">
			{/* Song Info */}
			<div className="flex items-center gap-4 w-[30%] min-w-[180px]">
				<img
					src={currentSong.image_url || "/album-placeholder.png"}
					alt={currentSong.title}
					className="h-14 w-14 rounded object-cover shadow-lg"
				/>
				<div className="overflow-hidden min-w-0">
					<p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
					<p className="text-xs text-spotify-text-muted truncate">{currentSong.artist}</p>
				</div>
			</div>

			{/* Player Controls - центр как в Spotify */}
			<div className="flex flex-col items-center justify-center gap-2 flex-1 max-w-[722px]">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsShuffled(!isShuffled)}
						className={`h-8 w-8 ${isShuffled ? "text-spotify-green" : "text-spotify-text-muted hover:text-white"}`}
					>
						<Shuffle className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={playPrevious}
						className="h-8 w-8 text-spotify-text-muted hover:text-white"
					>
						<SkipBack className="h-5 w-5" />
					</Button>
					<Button
						size="icon"
						onClick={togglePlay}
						className="h-10 w-10 rounded-full bg-white hover:bg-white hover:scale-105 text-black border-0"
					>
						{isPlaying ? (
							<Pause className="h-5 w-5" fill="currentColor" />
						) : (
							<Play className="h-5 w-5 ml-0.5" fill="currentColor" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={playNext}
						className="h-8 w-8 text-spotify-text-muted hover:text-white"
					>
						<SkipForward className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleRepeat}
						className={`h-8 w-8 ${repeatMode !== "off" ? "text-spotify-green" : "text-spotify-text-muted hover:text-white"}`}
					>
						{repeatMode === "one" ? (
							<Repeat1 className="h-4 w-4" />
						) : (
							<Repeat className="h-4 w-4" />
						)}
					</Button>
				</div>

				<div className="flex items-center gap-2 w-full">
					<span className="text-xs text-spotify-text-muted w-10 text-right">
						{formatTime(progress)}
					</span>
					<Slider
						value={[progress]}
						max={duration || 100}
						step={0.1}
						onValueChange={handleSeek}
						className="flex-1 [&_[data-orientation=horizontal]]:h-1"
					/>
					<span className="text-xs text-spotify-text-muted w-10">
						{formatTime(duration)}
					</span>
				</div>
			</div>

			{/* Volume */}
			<div className="flex items-center justify-end gap-2 w-[30%] min-w-[180px]">
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleMute}
					className="h-8 w-8 text-spotify-text-muted hover:text-white"
				>
					{isMuted || volume === 0 ? (
						<VolumeX className="h-4 w-4" />
					) : (
						<Volume2 className="h-4 w-4" />
					)}
				</Button>
				<Slider
					value={[isMuted ? 0 : volume]}
					max={1}
					step={0.01}
					onValueChange={(v) => setVolume(v[0])}
					className="w-24 [&_[data-orientation=horizontal]]:h-1"
				/>
			</div>
		</div>
	);
};
