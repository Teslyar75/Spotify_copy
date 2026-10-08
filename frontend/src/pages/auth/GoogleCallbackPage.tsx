import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

const GoogleCallbackPage = () => {
	const navigate = useNavigate();
	const { setTokens } = useAuthStore();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Парсим токены из URL hash
		const hash = window.location.hash.substring(1);
		const params = new URLSearchParams(hash);
		
		const accessToken = params.get("access_token");
		const refreshToken = params.get("refresh_token");
		const errorParam = params.get("error") || new URLSearchParams(window.location.search).get("error");

		if (errorParam) {
			// Показываем русское сообщение об ошибке
			const errorMessages: Record<string, string> = {
				"missing_params": "Отсутствуют обязательные параметры",
				"invalid_state": "Неверное состояние сессии. Попробуйте снова",
				"access_denied": "Вы отказались от авторизации",
				"invalid_token": "Ошибка верификации токена Google"
			};
			setError(errorMessages[errorParam] || `Ошибка авторизации: ${errorParam}`);
			// Редирект на login через 3 секунды
			setTimeout(() => navigate("/login"), 3000);
			return;
		}

		if (accessToken && refreshToken) {
			// Сохраняем токены в store (точно так же как при обычном логине)
			setTokens({ access_token: accessToken, refresh_token: refreshToken });
			// Редирект на главную
			navigate("/");
		} else {
			setError("Не удалось получить токены авторизации");
			setTimeout(() => navigate("/login"), 3000);
		}
	}, [navigate, setTokens]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-spotify-charcoal p-4">
				<div className="max-w-md w-full text-center">
					<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
						<h1 className="text-xl font-bold text-red-500 mb-2">
							Ошибка авторизации
						</h1>
						<p className="text-sm text-spotify-text-muted mb-4">{error}</p>
						<p className="text-xs text-spotify-text-muted">
							Перенаправление на страницу входа...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-spotify-charcoal">
			<div className="text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-spotify-green border-r-transparent mb-4"></div>
				<p className="text-sm text-spotify-text-muted">
					Завершение авторизации...
				</p>
			</div>
		</div>
	);
};

export default GoogleCallbackPage;
