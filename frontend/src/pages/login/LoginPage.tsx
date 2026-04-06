import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoginPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { login, register, setAuthData, isLoading, error, reset } = useAuthStore();

	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [registerForm, setRegisterForm] = useState({
		email: "",
		password: "",
		username: "",
	});

	// Обработка OAuth callback из URL
	useEffect(() => {
		const access_token = searchParams.get("access_token");
		const refresh_token = searchParams.get("refresh_token");
		const user_id = searchParams.get("user_id");
		const username = searchParams.get("username");
		const email = searchParams.get("email");
		const avatar_url = searchParams.get("avatar_url");

		if (access_token && refresh_token && user_id && username && email) {
			setAuthData({
				access_token,
				refresh_token,
				user: {
					id: user_id,
					username,
					email,
					avatar_url: avatar_url || undefined,
				},
			});
			navigate("/");
		}
	}, [searchParams, setAuthData, navigate]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		reset();
		await login(loginForm);
		if (useAuthStore.getState().isAuthenticated) navigate("/");
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		reset();
		await register(registerForm);
		if (useAuthStore.getState().isAuthenticated) navigate("/");
	};

	const handleOAuth = (provider: "google" | "github") => {
		const apiUrl = import.meta.env.VITE_API_URL;
		window.location.href = `${apiUrl}/auth/${provider}`;
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-spotify-black p-4">
			{/* Gradient background - как в Spotify */}
			<div className="absolute inset-0 bg-gradient-to-b from-spotify-green/20 via-spotify-black to-spotify-black pointer-events-none" />

			<div className="relative w-full max-w-[450px]">
				<div className="text-center mb-8">
					<img src="/spotify.png" alt="Spotify" className="h-14 w-14 mx-auto mb-6" />
					<h1 className="text-3xl font-bold text-white mb-2">Log in to Spotify Clone</h1>
					<p className="text-spotify-text-muted text-sm">Continue to listen to music</p>
				</div>

				<div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10 space-y-6">
					{/* OAuth Buttons */}
					<div className="space-y-3">
						<Button
							onClick={() => handleOAuth("google")}
							variant="outline"
							className="w-full h-12 rounded-full border-white/20 hover:border-white text-white font-semibold flex items-center justify-center gap-3 bg-transparent"
						>
							<img src="/google.png" alt="Google" className="w-5 h-5" />
							Continue with Google
						</Button>
						<Button
							onClick={() => handleOAuth("github")}
							variant="outline"
							className="w-full h-12 rounded-full border-white/20 hover:border-white text-white font-semibold flex items-center justify-center gap-3 bg-transparent"
						>
							<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
								<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
							</svg>
							Continue with GitHub
						</Button>
					</div>

					<div className="flex items-center gap-4 text-white/10">
						<div className="h-px flex-1 bg-current" />
						<span className="text-spotify-text-muted text-xs font-bold uppercase">or</span>
						<div className="h-px flex-1 bg-current" />
					</div>

					<Tabs defaultValue="login" className="w-full">
						<TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto gap-4 mb-6">
							<TabsTrigger
								value="login"
								className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold rounded-full py-2"
							>
								Log in
							</TabsTrigger>
							<TabsTrigger
								value="register"
								className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold rounded-full py-2 text-spotify-text-muted"
							>
								Sign up
							</TabsTrigger>
						</TabsList>

						<TabsContent value="login">
							<form onSubmit={handleLogin} className="space-y-4">
								{error && (
									<div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
										{error}
									</div>
								)}
								<Input
									type="email"
									placeholder="Email address"
									value={loginForm.email}
									onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
									className="bg-white/10 border-white/20 text-white placeholder:text-spotify-text-muted h-12 rounded-md"
									required
								/>
								<Input
									type="password"
									placeholder="Password"
									value={loginForm.password}
									onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
									className="bg-white/10 border-white/20 text-white placeholder:text-spotify-text-muted h-12 rounded-md"
									required
								/>
								<Button
									type="submit"
									className="w-full h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-base"
									disabled={isLoading}
								>
									{isLoading ? "Logging in..." : "Log In"}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value="register">
							<form onSubmit={handleRegister} className="space-y-4">
								{error && (
									<div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
										{error}
									</div>
								)}
								<Input
									type="text"
									placeholder="Username"
									value={registerForm.username}
									onChange={(e) =>
										setRegisterForm({ ...registerForm, username: e.target.value })
									}
									className="bg-white/10 border-white/20 text-white placeholder:text-spotify-text-muted h-12 rounded-md"
									required
								/>
								<Input
									type="email"
									placeholder="Email address"
									value={registerForm.email}
									onChange={(e) =>
										setRegisterForm({ ...registerForm, email: e.target.value })
									}
									className="bg-white/10 border-white/20 text-white placeholder:text-spotify-text-muted h-12 rounded-md"
									required
								/>
								<Input
									type="password"
									placeholder="Password"
									value={registerForm.password}
									onChange={(e) =>
										setRegisterForm({ ...registerForm, password: e.target.value })
									}
									className="bg-white/10 border-white/20 text-white placeholder:text-spotify-text-muted h-12 rounded-md"
									required
								/>
								<Button
									type="submit"
									className="w-full h-12 rounded-full bg-spotify-green hover:bg-spotify-green-hover text-black font-bold text-base"
									disabled={isLoading}
								>
									{isLoading ? "Signing up..." : "Sign Up"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
