import { useState, useEffect } from "react";
import { useSkinStore } from "@/stores/useSkinStore";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";

interface JamendoTrack {
	id: string;
	name: string;
	artist_name: string;
	image: string;
	audio: string;
	duration: number;
	album_name?: string;
}

interface JamendoResponse {
	new_for_you: any[];
	already_shown: any[];
	skin_name: string;
}

const JamendoRecommendations = () => {
	const { activeSkin } = useSkinStore();
	const { playAlbum } = usePlayerStore();
	
	const [data, setData] = useState<JamendoResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showNewOnly, setShowNewOnly] = useState(true);

	const fetchRecommendations = async (rotate: boolean = false) => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.get<JamendoResponse>("/jamendo/discover", {
				params: {
					...(activeSkin ? { skin_name: activeSkin.name } : {}),
					rotate: rotate,
				},
			});
			// backend returns {jamendo_id,title,artist,image_url,audio_url}; normalize to JamendoTrack
			const norm = (t: any): JamendoTrack => ({
				id: String(t.id ?? t.jamendo_id),
				name: t.name ?? t.title,
				artist_name: t.artist_name ?? t.artist,
				image: t.image ?? t.image_url,
				audio: t.audio ?? t.audio_url,
				duration: t.duration,
				album_name: t.album_name,
			});
			setData({
				...response.data,
				new_for_you: (response.data.new_for_you || []).map(norm),
				already_shown: (response.data.already_shown || []).map(norm),
			});
		} catch (error) {
			console.error("Failed to fetch Jamendo recommendations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchRecommendations(false);
	}, [activeSkin]);

	if (!data || isLoading) {
		return (
			<div className="bg-white/5 rounded-lg p-6">
				<h2 className="text-lg font-semibold mb-4">
					Рекомендации под ваш скин
				</h2>
				<p className="text-sm text-spotify-text-muted">Загрузка...</p>
			</div>
		);
	}

	const displayTracks = showNewOnly ? data.new_for_you : data.already_shown;

	const jamendoToSong = (track: JamendoTrack): Song => ({
		id: track.id,
		title: track.name,
		artist: track.artist_name,
		image_url: track.image,
		file_url: track.audio,
		duration: track.duration,
		album_id: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	});

	const handlePlayAll = () => {
		const songs = displayTracks.map(jamendoToSong);
		playAlbum(songs, 0);
	};

	return (
		<div className="bg-white/5 rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">
					Рекомендации под скин {data.skin_name ? `«${data.skin_name}»` : ''}
				</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowNewOnly(!showNewOnly)}
						className="text-xs"
					>
						{showNewOnly ? "Новое для вас" : "Уже слушали"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchRecommendations(true)}
						disabled={isLoading}
						className="text-xs gap-1"
					>
						<RefreshCw className="h-3 w-3" />
						Показать другие
					</Button>
				</div>
			</div>

			<div className="track-card-grid">
				{displayTracks.slice(0, 10).map((track) => (
					<div
						key={track.id}
						className="group min-w-0 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors cursor-pointer"
						onClick={() => {
							const songs = displayTracks.map(jamendoToSong);
							const index = displayTracks.findIndex((t) => t.id === track.id);
							playAlbum(songs, index);
						}}
					>
						<div className="relative mb-3">
							<img
								src={track.image}
								alt={track.name}
								className="w-full aspect-square object-cover rounded"
							/>
							<Button
								variant="ghost"
								size="icon"
								className="absolute bottom-2 right-2 h-10 w-10 rounded-full skin-accent-bg text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
								onClick={(e) => {
									e.stopPropagation();
									const songs = displayTracks.map(jamendoToSong);
									const index = displayTracks.findIndex((t) => t.id === track.id);
									playAlbum(songs, index);
								}}
							>
								<Play className="h-5 w-5 ml-0.5" fill="currentColor" />
							</Button>
						</div>
						<p className="text-sm font-medium truncate text-white mb-1">
							{track.name}
						</p>
						<p className="text-xs text-spotify-text-muted truncate">
							{track.artist_name}
						</p>
					</div>
				))}
			</div>

			{displayTracks.length > 0 && (
				<div className="mt-4 flex justify-center">
					<Button
						variant="outline"
						onClick={handlePlayAll}
						className="gap-2"
					>
						<Play className="h-4 w-4" fill="currentColor" />
						Воспроизвести все
					</Button>
				</div>
			)}

			<p className="text-xs text-spotify-text-muted mt-4 text-center">
				Музыка подобрана под тему вашего скина через Jamendo
			</p>
		</div>
	);
};

export default JamendoRecommendations;
