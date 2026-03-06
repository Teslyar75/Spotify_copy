import { create } from "zustand";
import { Song } from "@/types";
import { useChatStore } from "./useChatStore";

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
		const socket = useChatStore.getState().socket;
		if (socket && socket.connected) {
			socket.emit("update_activity", {
				userId: (socket as any).auth?.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}
		set({
			queue: songs,
			currentSong: song,
			currentIndex: startIndex,
			isPlaying: true,
		});
	},

	setCurrentSong: (song: Song | null) => {
		if (!song) return;

		const socket = useChatStore.getState().socket;
		if (socket && socket.connected) {
			socket.emit("update_activity", {
				userId: (socket as any).auth?.userId,
				activity: `Playing ${song.title} by ${song.artist}`,
			});
		}

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
		const socket = useChatStore.getState().socket;
		if (socket && socket.connected) {
			socket.emit("update_activity", {
				userId: (socket as any).auth?.userId,
				activity: willStartPlaying && currentSong ? `Playing ${currentSong.title} by ${currentSong.artist}` : "Idle",
			});
		}
		set({
			isPlaying: willStartPlaying,
		});
	},

	playNext: () => {
		const { currentIndex, queue } = get();
		const nextIndex = currentIndex + 1;

		if (nextIndex < queue.length) {
			const nextSong = queue[nextIndex];
			const socket = useChatStore.getState().socket;
			if (socket && socket.connected) {
				socket.emit("update_activity", {
					userId: (socket as any).auth?.userId,
					activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
				});
			}
			set({
				currentSong: nextSong,
				currentIndex: nextIndex,
				isPlaying: true,
				progress: 0,
			});
		} else {
			set({ isPlaying: false });
			const socket = useChatStore.getState().socket;
			if (socket && socket.connected) {
				socket.emit("update_activity", {
					userId: (socket as any).auth?.userId,
					activity: `Idle`,
				});
			}
		}
	},

	playPrevious: () => {
		const { currentIndex, queue } = get();
		const prevIndex = currentIndex - 1;

		if (prevIndex >= 0) {
			const prevSong = queue[prevIndex];
			const socket = useChatStore.getState().socket;
			if (socket && socket.connected) {
				socket.emit("update_activity", {
					userId: (socket as any).auth?.userId,
					activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
				});
			}
			set({
				currentSong: prevSong,
				currentIndex: prevIndex,
				isPlaying: true,
				progress: 0,
			});
		} else {
			set({ isPlaying: false, progress: 0 });
			const socket = useChatStore.getState().socket;
			if (socket && socket.connected) {
				socket.emit("update_activity", {
					userId: (socket as any).auth?.userId,
					activity: `Idle`,
				});
			}
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
