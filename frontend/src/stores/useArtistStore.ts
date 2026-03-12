import { create } from "zustand";

export interface ArtistInfo {
	name: string;
	imageUrl?: string;
	bio?: string;
	concerts?: { date: string; venue: string; city: string }[];
}

interface ArtistStore {
	selectedArtist: ArtistInfo | null;
	isSidebarOpen: boolean;
	openArtist: (artist: ArtistInfo) => void;
	closeSidebar: () => void;
	toggleSidebar: () => void;
}

export const useArtistStore = create<ArtistStore>((set) => ({
	selectedArtist: null,
	isSidebarOpen: false,

	openArtist: (artist) => set({ selectedArtist: artist, isSidebarOpen: true }),
	closeSidebar: () => set({ isSidebarOpen: false }),
	toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
