import axios, { InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "spotify_tokens";

export const axiosInstance = axios.create({
	baseURL: "/api",
	withCredentials: true,
});

// Добавляем Bearer token к запросам
axiosInstance.interceptors.request.use((config) => {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (stored) {
		try {
			const { access_token } = JSON.parse(stored);
			if (access_token) {
				config.headers.Authorization = `Bearer ${access_token}`;
			}
		} catch {
			// ignore
		}
	}
	return config;
});

// Обработка 401: refresh токена и повтор запроса
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) prom.reject(error);
		else prom.resolve(token);
	});
	failedQueue = [];
};

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

		const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
		if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
			if (isRefreshing) {
				// Ждём завершения текущего refresh
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				}).then(() => axiosInstance(originalRequest));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const stored = localStorage.getItem(TOKEN_KEY);
			let refreshToken: string | null = null;
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					refreshToken = parsed.refresh_token;
				} catch {
					// ignore
				}
			}

			if (!refreshToken) {
				isRefreshing = false;
				processQueue(new Error("No refresh token"));
				// Сброс авторизации
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem("spotify_user");
				window.dispatchEvent(new Event("auth:logout"));
				return Promise.reject(error);
			}

			try {
				const response = await axiosInstance.post("/auth/refresh", {
					refresh_token: refreshToken,
				});
				const { access_token, refresh_token } = response.data;
				const newTokens = { access_token, refresh_token };
				localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens));
				originalRequest.headers.Authorization = `Bearer ${access_token}`;
				window.dispatchEvent(
					new CustomEvent("auth:token-refreshed", { detail: newTokens })
				);
				processQueue(null, access_token);
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError as Error);
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem("spotify_user");
				window.dispatchEvent(new Event("auth:logout"));
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);
