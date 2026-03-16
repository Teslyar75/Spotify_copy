import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
	const { currentSong, isPlaying, playNext, volume, isMuted, repeatMode } = usePlayerStore();
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (audioRef.current && currentSong) {
			if (isPlaying) {
				audioRef.current.play()
					.catch((err) => console.error("Playback error:", err, "Song:", currentSong));
			} else {
				audioRef.current.pause();
			}
		}
	}, [isPlaying, currentSong]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = isMuted ? 0 : volume;
		}
	}, [volume, isMuted]);

	const handleEnded = () => {
		if (repeatMode === "one" && audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch((err) => console.error("Repeat playback error:", err));
		} else {
			playNext();
		}
	};

	const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
		console.error("Audio error:", e);
	};

	return (
		<audio
			ref={audioRef}
			src={currentSong?.file_url || ""}
			onEnded={handleEnded}
			onError={handleError}
			className='hidden'
		/>
	);
};

export default AudioPlayer;
