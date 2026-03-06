import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoginPage = () => {
	const navigate = useNavigate();
	const { login, register, isLoading } = useAuthStore();

	const [loginForm, setLoginForm] = useState({ email: "", password: "" });
	const [registerForm, setRegisterForm] = useState({
		email: "",
		password: "",
		username: "",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		await login(loginForm);
		navigate("/");
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		await register(registerForm);
		navigate("/");
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

				<div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
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
