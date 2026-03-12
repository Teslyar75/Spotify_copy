import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

interface AuthProviderProps {
	children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
	const { checkAuth, reset, setTokensFromRefresh } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		const handleLogout = () => {
			reset();
			window.location.href = "/login";
		};
		window.addEventListener("auth:logout", handleLogout);
		return () => window.removeEventListener("auth:logout", handleLogout);
	}, [reset]);

	useEffect(() => {
		const handleTokenRefreshed = (e: CustomEvent<{ access_token: string; refresh_token: string }>) => {
			setTokensFromRefresh(e.detail);
		};
		window.addEventListener("auth:token-refreshed", handleTokenRefreshed as EventListener);
		return () =>
			window.removeEventListener("auth:token-refreshed", handleTokenRefreshed as EventListener);
	}, [setTokensFromRefresh]);

	return <>{children}</>;
};

export default AuthProvider;
