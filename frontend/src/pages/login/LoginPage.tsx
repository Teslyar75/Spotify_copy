import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

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
					avatar_url: avatar_url || null,
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
						<GoogleLoginButton />
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
