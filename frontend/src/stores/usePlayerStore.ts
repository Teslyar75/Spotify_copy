import { create } from "zustand";
import { Song } from "@/types";
import { axiosInstance } from "@/lib/axios";

async function recordPlay(trackId: string) {
	try {
		await axiosInstance.post("/player/play", { track_id: trackId });
	} catch {
		// ignore (user may be logged out)
	}
}

/** Fisher-Yates in-place shuffle */
function fisherYates<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

interface PlayerStore {
	currentSong: Song | null;
	isPlaying: boolean;
	queue: Song[];
	currentIndex: number;

	// Shuffle — pre-computed shuffled order, no repeats until all tracks played
	isShuffled: boolean;
	shuffledQueue: Song[];
	shuffledIndex: number;

	repeatMode: "off" | "all" | "one";

	volume: number;
	isMuted: boolean;
	progress: number;
	duration: number;

	initializeQueue: (songs: Song[]) => void;
	playAlbum: (songs: Song[], startIndex?: number) => void;
	setCurrentSong: (song: Song | null) => void;
	togglePlay: () => void;
	playNext: () => void;
	playPrevious: () => void;
	toggleShuffle: () => void;
	toggleRepeat: () => void;
	setVolume: (volume: number) => void;
	toggleMute: () => void;
	setProgress: (progress: number) => void;
	setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
	currentSong: null,
	isPlaying: false,
	queue: [],
	currentIndex: -1,
	isShuffled: false,
	shuffledQueue: [],
	shuffledIndex: -1,
	repeatMode: "off",
	volume: 1,
	isMuted: false,
	progress: 0,
	duration: 0,

	initializeQueue: (songs: Song[]) => {
		set({
			queue: songs,
			currentSong: get().currentSong || songs[0],
			currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
		});
	},

	playAlbum: (songs: Song[], startIndex = 0) => {
		if (songs.length === 0) return;

		const song = songs[startIndex];
		recordPlay(song.id);

		const { isShuffled } = get();
		let shuffledQueue: Song[] = [];
		let shuffledIndex = -1;

		if (isShuffled) {
			// Put the clicked song first, shuffle the rest
			const rest = songs.filter((_, i) => i !== startIndex);
			shuffledQueue = [song, ...fisherYates(rest)];
			shuffledIndex = 0;
		}

		set({
			queue: songs,
			currentSong: song,
			currentIndex: startIndex,
			isPlaying: true,
			progress: 0,
			shuffledQueue,
			shuffledIndex,
		});
	},

	setCurrentSong: (song: Song | null) => {
		if (!song) return;

		recordPlay(song.id);
		const { queue, isShuffled, shuffledQueue } = get();
		const songIndex = queue.findIndex((s) => s.id === song.id);

		let newShuffledIndex = -1;
		if (isShuffled) {
			newShuffledIndex = shuffledQueue.findIndex((s) => s.id === song.id);
		}

		set({
			currentSong: song,
			isPlaying: true,
			currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
			shuffledIndex: newShuffledIndex,
			progress: 0,
		});
	},

	togglePlay: () => {
		const willStartPlaying = !get().isPlaying;
		const currentSong = get().currentSong;
		if (willStartPlaying && currentSong) recordPlay(currentSong.id);
		set({ isPlaying: willStartPlaying });
	},

	playNext: () => {
		const { currentIndex, queue, isShuffled, shuffledQueue, shuffledIndex, repeatMode } = get();

		// repeat-one: AudioPlayer handles it directly (audio.currentTime = 0)
		if (repeatMode === "one") return;

		if (isShuffled && shuffledQueue.length > 0) {
			const nextShuffledIndex = shuffledIndex + 1;

			if (nextShuffledIndex < shuffledQueue.length) {
				const nextSong = shuffledQueue[nextShuffledIndex];
				const nextOriginalIndex = queue.findIndex((s) => s.id === nextSong.id);
				recordPlay(nextSong.id);
				set({
					currentSong: nextSong,
					shuffledIndex: nextShuffledIndex,
					currentIndex: nextOriginalIndex !== -1 ? nextOriginalIndex : currentIndex,
					isPlaying: true,
					progress: 0,
				});
			} else if (repeatMode === "all") {
				// All tracks played — reshuffle and start again
				const newShuffled = fisherYates(queue);
				const firstSong = newShuffled[0];
				const firstOriginalIndex = queue.findIndex((s) => s.id === firstSong.id);
				recordPlay(firstSong.id);
				set({
					shuffledQueue: newShuffled,
					shuffledIndex: 0,
					currentSong: firstSong,
					currentIndex: firstOriginalIndex !== -1 ? firstOriginalIndex : 0,
					isPlaying: true,
					progress: 0,
				});
			} else {
				set({ isPlaying: false });
			}
			return;
		}

		// Normal (non-shuffle) mode
		const nextIndex = currentIndex + 1;

		if (nextIndex < queue.length) {
			const nextSong = queue[nextIndex];
			recordPlay(nextSong.id);
			set({
				currentSong: nextSong,
				currentIndex: nextIndex,
				isPlaying: true,
				progress: 0,
			});
		} else if (repeatMode === "all") {
			const firstSong = queue[0];
			recordPlay(firstSong.id);
			set({
				currentSong: firstSong,
				currentIndex: 0,
				isPlaying: true,
				progress: 0,
			});
		} else {
			set({ isPlaying: false });
		}
	},

	playPrevious: () => {
		const { currentIndex, queue, isShuffled, shuffledQueue, shuffledIndex } = get();

		if (isShuffled && shuffledQueue.length > 0) {
			const prevShuffledIndex = shuffledIndex - 1;
			if (prevShuffledIndex >= 0) {
				const prevSong = shuffledQueue[prevShuffledIndex];
				const prevOriginalIndex = queue.findIndex((s) => s.id === prevSong.id);
				recordPlay(prevSong.id);
				set({
					currentSong: prevSong,
					shuffledIndex: prevShuffledIndex,
					currentIndex: prevOriginalIndex !== -1 ? prevOriginalIndex : currentIndex,
					isPlaying: true,
					progress: 0,
				});
			} else {
				set({ isPlaying: false, progress: 0 });
			}
			return;
		}

		const prevIndex = currentIndex - 1;
		if (prevIndex >= 0) {
			const prevSong = queue[prevIndex];
			recordPlay(prevSong.id);
			set({
				currentSong: prevSong,
				currentIndex: prevIndex,
				isPlaying: true,
				progress: 0,
			});
		} else {
			set({ isPlaying: false, progress: 0 });
		}
	},

	toggleShuffle: () => {
		const { isShuffled, queue, currentSong, currentIndex } = get();

		if (!isShuffled) {
			// Enable: put the current song first, shuffle the rest
			const rest = queue.filter((_, i) => i !== currentIndex);
			const shuffledQueue = currentSong
				? [currentSong, ...fisherYates(rest)]
				: fisherYates(queue);
			set({ isShuffled: true, shuffledQueue, shuffledIndex: 0 });
		} else {
			// Disable: go back to the original queue position
			set({ isShuffled: false, shuffledQueue: [], shuffledIndex: -1 });
		}
	},

	toggleRepeat: () => {
		set((state) => {
			if (state.repeatMode === "off") return { repeatMode: "all" };
			if (state.repeatMode === "all") return { repeatMode: "one" };
			return { repeatMode: "off" };
		});
	},

	setVolume: (volume: number) => {
		set({ volume, isMuted: volume === 0 });
	},

	toggleMute: () => {
		set((state) => ({ isMuted: !state.isMuted }));
	},

	setProgress: (progress: number) => {
		set({ progress });
	},

	setDuration: (duration: number) => {
		set({ duration });
	},
}));
