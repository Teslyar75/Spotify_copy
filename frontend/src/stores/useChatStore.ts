import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: Socket | null;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	isChatOpen: boolean;

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string, token: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, content: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	toggleChat: () => void;
}

const WS_URL = import.meta.env.MODE === "development" 
	? "ws://localhost:8000" 
	: window.location.origin;

let socket: Socket | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: null,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	isChatOpen: false,

	setSelectedUser: (user) => set({ selectedUser: user }),

	toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response?.data?.detail || "Ошибка загрузки пользователей" });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId: string, token: string) => {
		if (get().isConnected) return;

		socket = io(WS_URL, {
			transports: ["websocket"],
			auth: {
				token: `Bearer ${token}`,
				userId,
			},
		});

		socket.on("connect", () => {
			console.log("WebSocket connected");
			set({ isConnected: true, socket });
		});

		socket.on("users_online", (users: string[]) => {
			set({ onlineUsers: new Set(users) });
		});

		socket.on("activities", (activities: [string, string][]) => {
			set({ userActivities: new Map<string, string>(activities) });
		});

		socket.on("user_connected", (userId: string) => {
			set((state) => ({
				onlineUsers: new Set<string>([...state.onlineUsers, userId]),
			}));
		});

		socket.on("user_disconnected", (userId: string) => {
			set((state) => {
				const newOnlineUsers = new Set<string>(state.onlineUsers);
				newOnlineUsers.delete(userId);
				return { onlineUsers: newOnlineUsers };
			});
		});

		socket.on("receive_message", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

		socket.on("message_sent", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

		socket.on("activity_updated", ({ userId, activity }) => {
			set((state) => {
				const newActivities = new Map<string, string>(state.userActivities);
				newActivities.set(userId, activity);
				return { userActivities: newActivities };
			});
		});

		set({ socket });
	},

	disconnectSocket: () => {
		if (socket) {
			socket.disconnect();
			socket = null;
			set({ isConnected: false, socket: null });
		}
	},

	sendMessage: (receiverId: string, content: string) => {
		const socket = get().socket;
		if (!socket || !socket.connected) return;

		socket.emit("send_message", { receiverId, content });
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response?.data?.detail || "Ошибка загрузки сообщений" });
		} finally {
			set({ isLoading: false });
		}
	},
}));
