import { create } from "zustand";
import { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";
import { axiosInstance } from "@/lib/axios";

interface AuthStore {
	user: User | null;
	tokens: AuthTokens | null;
	isLoading: boolean;
	error: string | null;
	isAuthenticated: boolean;

	login: (data: LoginRequest) => Promise<void>;
	register: (data: RegisterRequest) => Promise<void>;
	logout: () => Promise<void>;
	refreshToken: () => Promise<void>;
	checkAuth: () => Promise<void>;
	reset: () => void;
}

const TOKEN_KEY = "spotify_tokens";
const USER_KEY = "spotify_user";

export const useAuthStore = create<AuthStore>((set, get) => ({
	user: null,
	tokens: null,
	isLoading: false,
	error: null,
	isAuthenticated: false,

	login: async (data: LoginRequest) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.post("/auth/login", data);
			const { access_token, refresh_token, user } = response.data;
			
			set({
				tokens: { access_token, refresh_token },
				user,
				isAuthenticated: true,
				isLoading: false,
			});
			
			localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, refresh_token }));
			localStorage.setItem(USER_KEY, JSON.stringify(user));
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка входа", 
				isLoading: false 
			});
		}
	},

	register: async (data: RegisterRequest) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.post("/auth/register", data);
			const { access_token, refresh_token, user } = response.data;
			
			set({
				tokens: { access_token, refresh_token },
				user,
				isAuthenticated: true,
				isLoading: false,
			});
			
			localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, refresh_token }));
			localStorage.setItem(USER_KEY, JSON.stringify(user));
		} catch (error: any) {
			set({ 
				error: error.response?.data?.detail || "Ошибка регистрации", 
				isLoading: false 
			});
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			get().reset();
		}
	},

	refreshToken: async () => {
		const tokens = get().tokens;
		if (!tokens?.refresh_token) return;

		try {
			const response = await axiosInstance.post("/auth/refresh", {
				refresh_token: tokens.refresh_token,
			});
			const { access_token, refresh_token } = response.data;
			
			const newTokens = { access_token, refresh_token };
			set({ tokens: newTokens });
			localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));
		} catch (error) {
			get().reset();
		}
	},

	checkAuth: async () => {
		try {
			const storedTokens = localStorage.getItem(TOKEN_KEY);
			const storedUser = localStorage.getItem(USER_KEY);
			
			if (storedTokens && storedUser) {
				const tokens = JSON.parse(storedTokens);
				const user = JSON.parse(storedUser);
				
				set({
					tokens,
					user,
					isAuthenticated: true,
				});
			}
		} catch (error) {
			console.error("Check auth error:", error);
		}
	},

	reset: () => {
		set({ 
			user: null, 
			tokens: null, 
			isAuthenticated: false, 
			isLoading: false, 
			error: null 
		});
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	},
}));
