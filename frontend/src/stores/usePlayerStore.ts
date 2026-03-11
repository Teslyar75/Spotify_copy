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

interface PlayerStore {
	currentSong: Song | null;
	isPlaying: boolean;
	queue: Song[];
	currentIndex: number;
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
		set({
			queue: songs,
			currentSong: song,
			currentIndex: startIndex,
			isPlaying: true,
		});
	},

	setCurrentSong: (song: Song | null) => {
		if (!song) return;

		recordPlay(song.id);
		const songIndex = get().queue.findIndex((s) => s.id === song.id);
		set({
			currentSong: song,
			isPlaying: true,
			currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
			progress: 0,
		});
	},

	togglePlay: () => {
		const willStartPlaying = !get().isPlaying;
		const currentSong = get().currentSong;
		if (willStartPlaying && currentSong) recordPlay(currentSong.id);
		set({
			isPlaying: willStartPlaying,
		});
	},

	playNext: () => {
		const { currentIndex, queue } = get();
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
		} else {
			set({ isPlaying: false });
		}
	},

	playPrevious: () => {
		const { currentIndex, queue } = get();
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
