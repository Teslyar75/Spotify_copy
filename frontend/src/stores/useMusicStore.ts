import { create } from "zustand";
import { Song, Album, Playlist } from "@/types";
import { axiosInstance } from "@/lib/axios";

function extractError(err: unknown): string {
	if (!err || typeof err !== "object") return "Неизвестная ошибка";
	const r = err as { response?: { status?: number; data?: { detail?: unknown } } };
	const detail = r.response?.data?.detail;
	if (typeof detail === "string") return detail;
	if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object" && "msg" in detail[0]) {
		return String((detail[0] as { msg?: string }).msg) || "Ошибка валидации";
	}
	if (r.response?.status === 403) return "Требуются права администратора";
	if (r.response?.status === 401) return "Сессия истекла";
	return "Ошибка запроса";
}

interface CreateAlbumData {
	title: string;
	artist: string;
	image_url: string;
	release_year: number;
}

interface CreateSongData {
	title: string;
	artist: string;
	album_id?: string;
	image_url?: string;
	file_url: string;
	duration: number;
}

interface UpdateAlbumData {
	title?: string;
	artist?: string;
	image_url?: string;
	release_year?: number;
}

interface UpdateSongData {
	title?: string;
	artist?: string;
	album_id?: string | null;
	image_url?: string | null;
	file_url?: string;
	duration?: number;
}

interface MusicStore {
	featuredSongs: Song[];
	madeForYouSongs: Song[];
	trendingSongs: Song[];
	albums: Album[];
	allSongs: Song[];
	isLoading: boolean;
	error: string | null;

	clearError: () => void;
	setError: (msg: string) => void;

	fetchFeaturedSongs: () => Promise<void>;
	fetchMadeForYouSongs: () => Promise<void>;
	fetchTrendingSongs: () => Promise<void>;
	fetchAlbums: () => Promise<void>;
	fetchAllSongs: () => Promise<void>;
	fetchTracksByGenre: () => Promise<Record<string, Song[]>>;
	fetchAlbumById: (id: string) => Promise<Album | null>;
	search: (query: string) => Promise<{ tracks: Song[]; albums: Album[]; artists: { name: string }[] }>;

	createAlbum: (data: CreateAlbumData) => Promise<Album | null>;
	createSong: (data: CreateSongData) => Promise<Song | null>;
	updateAlbum: (id: string, data: UpdateAlbumData) => Promise<Album | null>;
	deleteAlbum: (id: string) => Promise<boolean>;
	updateSong: (id: string, data: UpdateSongData) => Promise<Song | null>;
	deleteSong: (id: string) => Promise<boolean>;
	uploadImage: (file: File) => Promise<string | null>;
	uploadAudio: (file: File) => Promise<string | null>;

	fetchMyPlaylists: () => Promise<Playlist[]>;
	fetchPlaylistById: (id: string) => Promise<Playlist | null>;
	addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
	searchPlaylists: (query: string) => Promise<Playlist[]>;
	getPlaylistsForModal: (searchQuery?: string) => Promise<Playlist[]>; 
}

export const useMusicStore = create<MusicStore>((set, get) => ({
	featuredSongs: [],
	madeForYouSongs: [],
	trendingSongs: [],
	albums: [],
	allSongs: [],
	isLoading: false,
	error: null,

	clearError: () => set({ error: null }),
	setError: (msg: string) => set({ error: msg }),

	fetchFeaturedSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/songs/featured");
			set({ featuredSongs: res.data, isLoading: false });
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
		}
	},

	fetchMadeForYouSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/songs/made-for-you");
			set({ madeForYouSongs: res.data, isLoading: false });
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
		}
	},

	fetchTrendingSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/songs/trending");
			set({ trendingSongs: res.data, isLoading: false });
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
		}
	},

	fetchAlbums: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/albums");
			set({ albums: res.data, isLoading: false });
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
		}
	},

	fetchAllSongs: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/songs/?limit=500");
			set({ allSongs: res.data, isLoading: false });
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
		}
	},

	fetchTracksByGenre: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/songs/browse-by-genre", {
				params: { limit_per_genre: 20 },
			});
			set({ isLoading: false });
			return res.data as Record<string, Song[]>;
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
			return {};
		}
	},

	fetchAlbumById: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get(`/albums/${id}`);
			set({ isLoading: false });
			return res.data;
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
			return null;
		}
	},

	search: async (query: string) => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/search/", { params: { q: query } });
			set({ isLoading: false });
			return res.data;
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
			return { tracks: [], albums: [], artists: [] };
		}
	},

	createAlbum: async (data) => {
		try {
			const res = await axiosInstance.post("/albums", data);
			set((s) => ({ albums: [res.data, ...s.albums] }));
			return res.data;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	createSong: async (data) => {
		try {
			const res = await axiosInstance.post("/songs/", data);
			return res.data;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	updateAlbum: async (id, data) => {
		try {
			const res = await axiosInstance.put(`/albums/${id}`, data);
			set((s) => ({ albums: s.albums.map(a => a.id === id ? res.data : a) }));
			return res.data;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	deleteAlbum: async (id) => {
		try {
			await axiosInstance.delete(`/albums/${id}`);
			set((s) => ({ albums: s.albums.filter(a => a.id !== id) }));
			return true;
		} catch (e) {
			set({ error: extractError(e) });
			return false;
		}
	},

	updateSong: async (id, data) => {
		try {
			const res = await axiosInstance.put(`/songs/${id}`, data);
			return res.data;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	deleteSong: async (id) => {
		try {
			await axiosInstance.delete(`/songs/${id}`);
			return true;
		} catch (e) {
			set({ error: extractError(e) });
			return false;
		}
	},

	uploadImage: async (file) => {
		const fd = new FormData();
		fd.append("file", file);
		try {
			const res = await axiosInstance.post("/upload/image", fd);
			return res.data?.url ?? null;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	uploadAudio: async (file) => {
		const fd = new FormData();
		fd.append("file", file);
		try {
			const res = await axiosInstance.post("/upload/audio", fd);
			return res.data?.url ?? null;
		} catch (e) {
			set({ error: extractError(e) });
			return null;
		}
	},

	fetchMyPlaylists: async () => {
		set({ isLoading: true, error: null });
		try {
			const res = await axiosInstance.get("/api/playlists/me");
			set({ isLoading: false });
			return res.data;
		} catch (e) {
			set({ error: extractError(e), isLoading: false });
			return [];
		}
	},

	fetchPlaylistById: async (id: string): Promise<Playlist | null> => {
  		set({ isLoading: true, error: null });
  		try {
  		  const res = await axiosInstance.get(`/api/playlists/${id}`);
  		  set({ isLoading: false });
  		  return res.data;
  		} catch (e) {
  		  set({ error: extractError(e), isLoading: false });
  		  return null;
  		}
	},

	addTrackToPlaylist: async (playlistId, trackId) => {
		try {
			await axiosInstance.post(`/playlists/${playlistId}/tracks`, { track_id: trackId });
		} catch (e) {
			set({ error: extractError(e) });
		}
	},

	searchPlaylists: async (query: string): Promise<Playlist[]> => {
	  set({ isLoading: true, error: null });
	  	try {
	  	  const res = await axiosInstance.get("/playlists/me", {
	  	    params: { search: query }
	  	  });
	  	  set({ isLoading: false });
	    return res.data;
	  } catch (e) {
	    set({ error: extractError(e), isLoading: false });
	    return [];
	  }
	},

	getPlaylistsForModal: async (searchQuery?: string): Promise<Playlist[]> => {
	  set({ isLoading: true, error: null });
	  try {
	    const res = await axiosInstance.get("/playlists/me", {
	      params: searchQuery ? { search: searchQuery } : {},
	    });
	    set({ isLoading: false });
	    return res.data; // просто массив
	  } catch (e) {
	    set({ error: extractError(e), isLoading: false });
	    return [];
	  }
	},		
}));