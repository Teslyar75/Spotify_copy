import { Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import MainLayout from "./layout/MainLayout";
import AlbumPage from "./pages/album/AlbumPage";
import SearchPage from "./pages/search/SearchPage";
import LibraryPage from "./pages/library/LibraryPage";
import AdminPage from "./pages/admin/AdminPage";
import LoginPage from "./pages/login/LoginPage";
import NotFoundPage from "./pages/404/NotFoundPage";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/useAuthStore";
import NewPlaylistPage from "./pages/AddPlaylist/AddPlaylistPage";
import PlaylistEditPage from "./pages/playlistEditPage/PlaylistEditPage";
import ProjectPresentation from "./pages/presentation/PresentationPage";
import SkinsPage from "./pages/skins/SkinsPage";
import GoogleCallbackPage from "./pages/auth/GoogleCallbackPage";
import { useEffect } from "react";
import { useSkinStore } from "./stores/useSkinStore";

function App() {
	const { isAuthenticated } = useAuthStore();
	const { fetchActiveSkin } = useSkinStore();
	
	// Загружаем активный скин при старте приложения
	useEffect(() => {
		fetchActiveSkin();
	}, []);

	return (
		<>
			<Routes>
				<Route
					path='/login'
					element={isAuthenticated ? <Navigate to='/' /> : <LoginPage />}
				/>
				<Route
					path='/auth/google/done'
					element={<GoogleCallbackPage />}
				/>
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
						path='/skins'
						element={<SkinsPage />}
					/>
					<Route
  						path='/playlists/new'
  						element={isAuthenticated ? <NewPlaylistPage /> : <Navigate to='/login' />}
					/>
					
					<Route 
						path="/playlists/:id" element={<PlaylistEditPage />} 
					/>

					<Route
						path='/albums/:albumId'
						element={isAuthenticated ? <AlbumPage /> : <Navigate to='/login' />}
					/>
					<Route path='*' element={<NotFoundPage />} />
				</Route>
				<Route
					path='/admin'
					element={isAuthenticated ? <AdminPage /> : <Navigate to='/login' />}
				/>

				 <Route 
				 path="/presentation" element={<ProjectPresentation />} 
				 />
				 
			</Routes>
			<Toaster />
		</>
	);
}

export default App;
