import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import SearchPage from "./pages/search/SearchPage";
import LibraryPage from "./pages/library/LibraryPage";
import AdminPage from "./pages/admin/AdminPage";
import LoginPage from "./pages/login/LoginPage";
import NotFoundPage from "./pages/404/NotFoundPage";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/useAuthStore";

function App() {
	const { isAuthenticated } = useAuthStore();

	return (
		<>
			<Routes>
				<Route
					path='/login'
					element={isAuthenticated ? <Navigate to='/' /> : <LoginPage />}
				/>
				<Route path='/auth-callback' element={<AuthCallbackPage />} />

				<Route element={<MainLayout />}>
					<Route
						path='/'
						element={isAuthenticated ? <HomePage /> : <Navigate to='/login' />}
					/>
					<Route
						path='/search'
						element={isAuthenticated ? <SearchPage /> : <Navigate to='/login' />}
					/>
					<Route
						path='/library'
						element={isAuthenticated ? <LibraryPage /> : <Navigate to='/login' />}
					/>
					<Route
						path='/chat'
						element={isAuthenticated ? <ChatPage /> : <Navigate to='/login' />}
					/>
					<Route
						path='/albums/:albumId'
						element={isAuthenticated ? <AlbumPage /> : <Navigate to='/login' />}
					/>
					<Route
						path='/admin'
						element={isAuthenticated ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='*' element={<NotFoundPage />} />
				</Route>
			</Routes>
			<Toaster />
		</>
	);
}

export default App;
