import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

const AuthCallbackPage = () => {
	const navigate = useNavigate();
	const { checkAuth, isAuthenticated, user } = useAuthStore();
	const { initSocket, disconnectSocket } = useChatStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (isAuthenticated && user) {
			// Initialize WebSocket connection
			if (user.id) {
				initSocket(user.id, ""); // Token will be added in the store
			}
			navigate("/");
		}
	}, [isAuthenticated, user, navigate, initSocket]);

	return (
		<div className='h-screen w-screen flex items-center justify-center bg-black'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4' />
				<p className='text-white text-lg'>Authenticating...</p>
			</div>
		</div>
	);
};

export default AuthCallbackPage;
