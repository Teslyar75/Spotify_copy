import { create } from "zustand";
import { Song, Album, Playlist } from "@/types";
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

  fetchMyPlaylists: () => Promise<Playlist[]>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
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
      const res = await axiosInstance.get("/songs/featured");
      set({ featuredSongs: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка загрузки", isLoading: false });
    }
  },

  fetchMadeForYouSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/songs/made-for-you");
      set({ madeForYouSongs: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка загрузки", isLoading: false });
    }
  },

  fetchTrendingSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/songs/trending");
      set({ trendingSongs: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка загрузки", isLoading: false });
    }
  },

  fetchAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/albums");
      set({ albums: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка загрузки", isLoading: false });
    }
  },

fetchAlbumById: async (id: string) => {
  set({ isLoading: true, error: null });
  try {
    const response = await axiosInstance.get(`/api/albums/${id}`);
    set({ isLoading: false });
    return response.data;
  } catch (error: any) {
    set({ error: error.response?.data?.detail || "Ошибка загрузки", isLoading: false });
    return null;
  }
},

  search: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get("/search", { params: { q: query } });
      set({ isLoading: false });
      return res.data;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Ошибка поиска", isLoading: false });
      return { tracks: [], albums: [], artists: [] };
    }
  },

  // ---------------------
  // Методы для плейлистов
  // ---------------------
fetchMyPlaylists: async () => {
  set({ isLoading: true, error: null });
  try {
    const response = await axiosInstance.get("/api/playlists/me");
    set({ isLoading: false });
    return response.data;
  } catch (error: any) {
    set({ error: error.response?.data?.detail || "Ошибка загрузки плейлистов", isLoading: false });
    return [];
  }
},

addTrackToPlaylist: async (playlistId: string, trackId: string) => {
  set({ isLoading: true, error: null });
  try {
    await axiosInstance.post(`/api/playlists/${playlistId}/tracks`, { track_id: trackId });
    set({ isLoading: false });
  } catch (error: any) {
    set({ error: error.response?.data?.detail || "Ошибка добавления в плейлист", isLoading: false });
  }
},
}));