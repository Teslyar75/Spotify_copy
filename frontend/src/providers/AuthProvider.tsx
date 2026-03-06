import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

interface AuthProviderProps {
	children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
	const { checkAuth, isAuthenticated, user, tokens } = useAuthStore();
	const { initSocket, disconnectSocket } = useChatStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (isAuthenticated && user && tokens) {
			// Initialize WebSocket connection
			initSocket(user.id, tokens.access_token);
		} else {
			disconnectSocket();
		}

		return () => {
			disconnectSocket();
		};
	}, [isAuthenticated, user, tokens, initSocket, disconnectSocket]);

	return <>{children}</>;
};

export default AuthProvider;
