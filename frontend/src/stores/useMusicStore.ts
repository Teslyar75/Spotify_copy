import { create } from "zustand";
import { Song, Album } from "@/types";
import { axiosInstance } from "@/lib/axios";

interface MusicStore {
	featuredSongs: Song[];
	madeForYouSongs: Song[];
	trendingSongs: Song[];
	albums: Album[];
	isLoading: boolean;
	error: string | null;

	fetchFeaturedSongs: () => Promise<void>;
	fetchMadeForYouSongs: () => Promise<void>;
	fetchTrendingSongs: () => Promise<void>;
	fetchAlbums: () => Promise<void>;
	fetchAlbumById: (id: string) => Promise<Album | null>;
	search: (query: string) => Promise<{ tracks: Song[]; albums: Album[]; artists: { name: string }[] }>;
}

export const useMusicStore = create<MusicStore>((set, get) => ({
	featuredSongs: [],
	madeForYouSongs: [],
	trendingSongs: [],
	albums: [],
	isLoading: false,
	error: null,

	fetchFeaturedSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/featured");
			set({ featuredSongs: response.data, isLoading: false });
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка загрузки", 
				isLoading: false 
			});
		}
	},

	fetchMadeForYouSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/made-for-you");
			set({ madeForYouSongs: response.data, isLoading: false });
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка загрузки", 
				isLoading: false 
			});
		}
	},

	fetchTrendingSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/songs/trending");
			set({ trendingSongs: response.data, isLoading: false });
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка загрузки", 
				isLoading: false 
			});
		}
	},

	fetchAlbums: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/albums");
			set({ albums: response.data, isLoading: false });
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка загрузки", 
				isLoading: false 
			});
		}
	},

	fetchAlbumById: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/albums/${id}`);
			set({ isLoading: false });
			return response.data;
		} catch (error: any) {
			set({
				error: error.response?.data?.detail || "Ошибка загрузки",
				isLoading: false,
			});
			return null;
		}
	},

	search: async (query: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/search", {
				params: { q: query },
			});
			set({ isLoading: false });
			return response.data;
		} catch (error: any) {
			set({
				error: error.response?.data?.detail || "Ошибка поиска",
				isLoading: false,
			});
			return { tracks: [], albums: [], artists: [] };
		}
	},
}));
