import { useEffect, useState } from "react";
import { useSkinStore } from "@/stores/useSkinStore";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";
import { Check, Upload, X } from "lucide-react";

const SkinsPage = () => {
	const { user } = useAuthStore();
	const {
		availableSkins,
		mySkins,
		activeSkin,
		isLoading,
		fetchAvailableSkins,
		fetchMySkins,
		fetchActiveSkin,
		applySkin,
		purchaseSkin,
		uploadSkinImage
	} = useSkinStore();
	
	const [selectedTab, setSelectedTab] = useState<"library" | "market">("library");
	const [uploadingImage, setUploadingImage] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [newSkinName, setNewSkinName] = useState("");
	const [uploadedImageData, setUploadedImageData] = useState<any>(null);
	
	useEffect(() => {
		fetchActiveSkin();
		fetchAvailableSkins();
		if (user) {
			fetchMySkins();
		}
	}, [user]);
	
	const handleApplySkin = async (skin: any) => {
		try {
			await applySkin(skin);
			toast.success(`Скин "${skin.name}" применён`);
		} catch (error: any) {
			toast.error(error.message || "Ошибка применения скина");
		}
	};
	
	const handlePurchaseSkin = async (skin: any) => {
		if (!user) {
			toast.error("Войдите, чтобы покупать скины");
			return;
		}
		
		try {
			await purchaseSkin(skin.id);
			toast.success(`Скин "${skin.name}" куплен!`);
			await fetchMySkins();
		} catch (error: any) {
			toast.error(error.message || "Ошибка покупки");
		}
	};
	
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		if (!user) {
			toast.error("Войдите, чтобы загружать фото");
			return;
		}
		
		setUploadingImage(true);
		try {
			const data = await uploadSkinImage(file);
			setUploadedImageData(data);
			setShowUploadModal(true);
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Ошибка загрузки изображения");
		} finally {
			setUploadingImage(false);
		}
	};
	
	const handleCreateSkin = async () => {
		if (!uploadedImageData || !newSkinName) {
			toast.error("Введите название скина");
			return;
		}
		
		try {
			// Создаём скин через API
			const response = await fetch(`${import.meta.env.VITE_API_URL}/skins`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({
					name: newSkinName,
					button_style: "round",
					animation_type: "none",
					is_public: false
				})
			});
			
			if (!response.ok) throw new Error("Failed to create skin");
			
			const skin = await response.json();
			
			// Обновляем скин с изображениями
			await fetch(`${import.meta.env.VITE_API_URL}/skins/${skin.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${localStorage.getItem("access_token")}`
				},
				body: JSON.stringify({
					name: newSkinName
				})
			});
			
			// TODO: link uploaded images to skin
			
			toast.success("Скин создан!");
			setShowUploadModal(false);
			setNewSkinName("");
			setUploadedImageData(null);
			await fetchMySkins();
		} catch (error) {
			toast.error("Ошибка создания скина");
		}
	};
	
	const skinIsOwned = (skinId: string) => {
		return mySkins.some(s => s.id === skinId);
	};
	
	const renderSkinCard = (skin: any, isLibrary: boolean = false) => {
		const isActive = activeSkin?.id === skin.id;
		const isOwned = skinIsOwned(skin.id);
		
		return (
			<div
				key={skin.id}
				className="relative bg-spotify-charcoal rounded-lg overflow-hidden hover:bg-white/10 transition group"
			>
				{/* Thumbnail/Preview */}
				<div className="aspect-[3/2] relative bg-gradient-to-br from-spotify-sidebar to-spotify-black">
					{skin.thumbnail_url && (
						<img
							src={skin.thumbnail_url}
							alt={skin.name}
							className="w-full h-full object-cover"
						/>
					)}
					{!skin.thumbnail_url && (
						<div
							className="w-full h-full flex items-center justify-center text-6xl font-bold"
							style={{
								background: `linear-gradient(135deg, ${skin.accent_color || '#1DB954'}, ${skin.accent_secondary || '#1ed760'})`
							}}
						>
							{skin.name[0]}
						</div>
					)}
					
					{isActive && (
						<div className="absolute top-2 right-2 bg-spotify-green text-white px-2 py-1 rounded text-xs flex items-center gap-1">
							<Check className="w-3 h-3" />
							Активен
						</div>
					)}
				</div>
				
				{/* Info */}
				<div className="p-4">
					<h3 className="font-semibold text-white truncate">{skin.name}</h3>
					<p className="text-xs text-spotify-text-muted truncate mt-1">
						{skin.description || "Встроенный скин"}
					</p>
					
					<div className="flex items-center gap-2 mt-3">
						{isLibrary || isOwned || skin.is_preset ? (
							<Button
								onClick={() => handleApplySkin(skin)}
								disabled={isActive}
								className="flex-1"
								size="sm"
							>
								{isActive ? "Применён" : "Применить"}
							</Button>
						) : (
							<Button
								onClick={() => handlePurchaseSkin(skin)}
								className="flex-1"
								size="sm"
							>
								Купить {skin.price_stars || 0} ⭐
							</Button>
						)}
					</div>
					
					{/* Color preview */}
					<div className="flex gap-2 mt-2">
						<div
							className="w-4 h-4 rounded-full border border-white/20"
							style={{ backgroundColor: skin.accent_color }}
						/>
						<div
							className="w-4 h-4 rounded-full border border-white/20"
							style={{ backgroundColor: skin.accent_secondary }}
						/>
						<span className="text-[10px] text-spotify-text-dim ml-auto">
							{skin.button_style} · {skin.animation_type}
						</span>
					</div>
				</div>
			</div>
		);
	};
	
	if (isLoading && availableSkins.length === 0) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-spotify-text-muted">Загрузка скинов...</div>
			</div>
		);
	}
	
	return (
		<div className="p-4 md:p-6 pb-32">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
					Скины / Оформление
				</h1>
				<p className="text-spotify-text-muted">
					Измените внешний вид плеера — выберите встроенный скин или загрузите своё фото
				</p>
			</div>
			
			{/* Upload button */}
			{user && (
				<div className="mb-6">
					<label className="cursor-pointer">
						<input
							type="file"
							accept="image/*"
							capture="environment"
							className="hidden"
							onChange={handleImageUpload}
							disabled={uploadingImage}
						/>
						<Button disabled={uploadingImage} className="gap-2">
							<Upload className="w-4 h-4" />
							{uploadingImage ? "Загрузка..." : "Загрузить своё фото"}
						</Button>
					</label>
				</div>
			)}
			
			{/* Tabs */}
			<div className="flex gap-4 mb-6 border-b border-white/10">
				<button
					onClick={() => setSelectedTab("library")}
					className={`pb-2 px-1 text-sm font-medium transition ${
						selectedTab === "library"
							? "text-white border-b-2 border-spotify-green"
							: "text-spotify-text-muted hover:text-white"
					}`}
				>
					Моя библиотека
				</button>
				<button
					onClick={() => setSelectedTab("market")}
					className={`pb-2 px-1 text-sm font-medium transition ${
						selectedTab === "market"
							? "text-white border-b-2 border-spotify-green"
							: "text-spotify-text-muted hover:text-white"
					}`}
				>
					Маркетплейс
				</button>
			</div>
			
			{/* Content */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{selectedTab === "library" && mySkins.map(skin => renderSkinCard(skin, true))}
				{selectedTab === "market" && availableSkins.map(skin => renderSkinCard(skin, false))}
			</div>
			
			{/* Upload Modal */}
			{showUploadModal && uploadedImageData && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
					<div className="bg-spotify-charcoal rounded-lg p-6 max-w-md w-full">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-white">Создать скин</h2>
							<button onClick={() => setShowUploadModal(false)}>
								<X className="w-5 h-5 text-spotify-text-muted hover:text-white" />
							</button>
						</div>
						
						<div className="mb-4">
							<img
								src={uploadedImageData.thumbnail_url}
								alt="Preview"
								className="w-full rounded-lg"
							/>
						</div>
						
						<div className="mb-4">
							<label className="block text-sm text-spotify-text-muted mb-2">
								Название скина
							</label>
							<input
								type="text"
								value={newSkinName}
								onChange={(e) => setNewSkinName(e.target.value)}
								placeholder="Мой крутой скин"
								className="w-full bg-spotify-sidebar text-white px-3 py-2 rounded border border-white/10 focus:border-spotify-green focus:outline-none"
							/>
						</div>
						
						<div className="flex gap-2 mb-4">
							<div className="flex-1">
								<span className="text-xs text-spotify-text-muted">Цвет 1</span>
								<div
									className="w-full h-8 rounded mt-1 border border-white/20"
									style={{ backgroundColor: uploadedImageData.accent_color }}
								/>
							</div>
							<div className="flex-1">
								<span className="text-xs text-spotify-text-muted">Цвет 2</span>
								<div
									className="w-full h-8 rounded mt-1 border border-white/20"
									style={{ backgroundColor: uploadedImageData.accent_secondary }}
								/>
							</div>
						</div>
						
						<Button
							onClick={handleCreateSkin}
							disabled={!newSkinName}
							className="w-full"
						>
							Создать скин
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SkinsPage;
