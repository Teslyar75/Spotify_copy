import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export interface Skin {
	id: string;
	owner_id?: string;
	name: string;
	description?: string;
	banner_url?: string;
	background_url?: string;
	thumbnail_url?: string;
	button_style: string;
	accent_color?: string;
	accent_secondary?: string;
	animation_type: string;
	is_public: boolean;
	is_preset: boolean;
	price_stars?: number;
}

interface SkinStore {
	activeSkin: Skin | null;
	availableSkins: Skin[];
	mySkins: Skin[];
	isLoading: boolean;
	
	fetchAvailableSkins: () => Promise<void>;
	fetchMySkins: () => Promise<void>;
	fetchActiveSkin: () => Promise<void>;
	applySkin: (skin: Skin | null) => Promise<void>;
	purchaseSkin: (skinId: string) => Promise<void>;
	uploadSkinImage: (file: File) => Promise<{
		banner_url: string;
		background_url: string;
		thumbnail_url: string;
		accent_color: string;
		accent_secondary: string;
	}>;
}

// Применить CSS переменные скина
function applySkinCSS(skin: Skin | null) {
	const root = document.documentElement;
	
	if (!skin) {
		// Сброс на default (классический Spotify)
		root.style.setProperty('--skin-accent', '#1DB954');
		root.style.setProperty('--skin-accent-secondary', '#1ed760');
		root.style.setProperty('--skin-banner', 'none');
		root.style.setProperty('--skin-background', 'none');
		root.style.setProperty('--button-style', 'round');
		return;
	}
	
	// Устанавливаем CSS переменные
	root.style.setProperty('--skin-accent', skin.accent_color || '#1DB954');
	root.style.setProperty('--skin-accent-secondary', skin.accent_secondary || '#1ed760');
	
	if (skin.banner_url) {
		root.style.setProperty('--skin-banner', `url(${skin.banner_url})`);
	} else {
		root.style.setProperty('--skin-banner', 'none');
	}
	
	if (skin.background_url) {
		root.style.setProperty('--skin-background', `url(${skin.background_url})`);
	} else {
		root.style.setProperty('--skin-background', 'none');
	}
	
	root.style.setProperty('--button-style', skin.button_style);
	
	// Сохраняем в localStorage для гостей
	if (skin) {
		localStorage.setItem('guest_active_skin', JSON.stringify(skin));
	} else {
		localStorage.removeItem('guest_active_skin');
	}
}

export const useSkinStore = create<SkinStore>((set, get) => ({
	activeSkin: null,
	availableSkins: [],
	mySkins: [],
	isLoading: false,
	
	fetchAvailableSkins: async () => {
		try {
			set({ isLoading: true });
			const response = await axiosInstance.get("/skins");
			set({ availableSkins: response.data, isLoading: false });
		} catch (error) {
			console.error("Failed to fetch skins:", error);
			set({ isLoading: false });
		}
	},
	
	fetchMySkins: async () => {
		try {
			const response = await axiosInstance.get("/skins/library");
			set({ mySkins: response.data });
		} catch (error) {
			// Не авторизован — используем только preset скины
			const response = await axiosInstance.get("/skins/presets");
			set({ mySkins: response.data });
		}
	},
	
	fetchActiveSkin: async () => {
		try {
			const response = await axiosInstance.get("/skins/active");
			const skin = response.data;
			set({ activeSkin: skin });
			applySkinCSS(skin);
		} catch (error) {
			// Гость — проверяем localStorage
			const savedSkin = localStorage.getItem('guest_active_skin');
			if (savedSkin) {
				const skin = JSON.parse(savedSkin);
				set({ activeSkin: skin });
				applySkinCSS(skin);
			} else {
				// Применяем default
				applySkinCSS(null);
			}
		}
	},
	
	applySkin: async (skin: Skin | null) => {
		try {
			// Для авторизованных пользователей — отправляем на сервер
			await axiosInstance.post("/skins/activate", {
				skin_id: skin?.id || null
			});
			
			set({ activeSkin: skin });
			applySkinCSS(skin);
		} catch (error) {
			// Гость — только localStorage
			set({ activeSkin: skin });
			applySkinCSS(skin);
		}
	},
	
	purchaseSkin: async (skinId: string) => {
		try {
			await axiosInstance.post("/skins/purchase", { skin_id: skinId });
			// Обновляем библиотеку
			await get().fetchMySkins();
		} catch (error: any) {
			throw new Error(error.response?.data?.detail || "Failed to purchase skin");
		}
	},
	
	uploadSkinImage: async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);
		
		const response = await axiosInstance.post("/skins/upload-image", formData, {
			headers: {
				"Content-Type": "multipart/form-data"
			}
		});
		
		return response.data;
	}
}));
