import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isStandardSkin, Skin, useSkinStore } from "@/stores/useSkinStore";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import { Check, Lock, Pencil, Upload, X } from "lucide-react";
import SkinBannerEditor from "./components/SkinBannerEditor";

const SkinsPage = () => {
	const { user } = useAuthStore();
	const {
		availableSkins,
		mySkins,
		activeSkin,
		isLoading,
		fetchAvailableSkins,
		fetchMySkins,
		fetchPresetSkins,
		fetchActiveSkin,
		applySkin,
		purchaseSkin,
		uploadSkinImage
	} = useSkinStore();
	
	const [selectedTab, setSelectedTab] = useState<"library" | "market">("library");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newSkinName, setNewSkinName] = useState("");
	const [photoSlots, setPhotoSlots] = useState<{
		home: File | null;
		search: File | null;
		library: File | null;
		player: File | null;
	}>({ home: null, search: null, library: null, player: null });
	const [creatingCustomSkin, setCreatingCustomSkin] = useState(false);
	// скин, баннеры которого сейчас редактируются (id → свежая версия из стора)
	const [editingSkinId, setEditingSkinId] = useState<string | null>(null);
	const editingSkin: Skin | undefined = editingSkinId
		? mySkins.find((s) => s.id === editingSkinId) || availableSkins.find((s) => s.id === editingSkinId)
		: undefined;
	
	useEffect(() => {
		fetchActiveSkin();
		fetchAvailableSkins();
		if (user) {
			fetchMySkins();
		} else {
			// гостю показываем встроенные скины во вкладке «Моя библиотека»
			fetchPresetSkins();
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
	
	const handleSlotPhotoChange = (slot: "home" | "search" | "library" | "player", file: File | null) => {
		setPhotoSlots(prev => ({ ...prev, [slot]: file }));
	};
	
	const handleCreateCustomSkin = async () => {
		if (!newSkinName.trim()) {
			toast.error("Введите название скина");
			return;
		}
		
		const providedPhotos = Object.values(photoSlots).filter(Boolean);
		if (providedPhotos.length === 0) {
			toast.error("Загрузите хотя бы одно фото");
			return;
		}
		
		setCreatingCustomSkin(true);
		try {
			const formData = new FormData();
			formData.append("name", newSkinName);
			if (photoSlots.home) formData.append("home", photoSlots.home);
			if (photoSlots.search) formData.append("search", photoSlots.search);
			if (photoSlots.library) formData.append("library", photoSlots.library);
			if (photoSlots.player) formData.append("player", photoSlots.player);
			
			const response = await axiosInstance.post("/skins/create-custom", formData, {
				headers: { "Content-Type": "multipart/form-data" }
			});
			
			toast.success(`Скин "${response.data.name}" создан!`);
			setShowCreateModal(false);
			setNewSkinName("");
			setPhotoSlots({ home: null, search: null, library: null, player: null });
			await fetchMySkins();
		} catch (error: any) {
			toast.error(error.response?.data?.detail || "Ошибка создания скина");
		} finally {
			setCreatingCustomSkin(false);
		}
	};
	
	const skinIsOwned = (skinId: string) => {
		return mySkins.some(s => s.id === skinId);
	};
	
	const renderSkinCard = (skin: any, isLibrary: boolean = false) => {
		const isActive = activeSkin?.id === skin.id;
		const isOwned = skinIsOwned(skin.id);
		const preview: string | undefined = skin.banners?.home || skin.thumbnail_url;
		const customCount: number = skin.custom_slots?.length ?? 0;
		const editable = !isStandardSkin(skin);
		
		return (
			<div
				key={skin.id}
				className="relative bg-spotify-charcoal rounded-lg overflow-hidden hover:bg-white/10 transition group"
			>
				{/* Thumbnail/Preview */}
				<div className="aspect-[3/2] relative bg-gradient-to-br from-spotify-sidebar to-spotify-black">
					{preview && (
						<img
							src={preview}
							alt={skin.name}
							className="w-full h-full object-cover"
						/>
					)}
					{!preview && (
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
					{customCount > 0 && (
						<div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
							Своё фото: {customCount}/4
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
					
					{/* Редактирование баннеров 4 окон своими фото (кроме «Стандартный») */}
					{editable && (user ? (
						<Button
							onClick={() => setEditingSkinId(skin.id)}
							variant="outline"
							size="sm"
							className="w-full mt-2 gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10"
							data-testid="skin-edit-button"
						>
							<Pencil className="w-4 h-4" />
							Редактировать
						</Button>
					) : (
						<Link
							to="/login"
							className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-spotify-text-muted hover:text-white"
						>
							<Lock className="w-3.5 h-3.5" />
							Войдите, чтобы редактировать
						</Link>
					))}
					
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
		<div className="h-full min-w-0 overflow-y-auto p-4 md:p-6 pb-32">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
					Скины / Оформление
				</h1>
				<p className="text-spotify-text-muted">
					Измените внешний вид плеера — выберите встроенный скин или загрузите своё фото
				</p>
			</div>
			
			{/* Create custom skin button */}
			{user && (
				<div className="mb-6">
					<Button onClick={() => setShowCreateModal(true)} className="gap-2">
						<Upload className="w-4 h-4" />
						Создать свой скин
					</Button>
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
			
			{editingSkin && (
				<SkinBannerEditor skin={editingSkin} onClose={() => setEditingSkinId(null)} />
			)}
			
			{/* Create Custom Skin Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="bg-spotify-charcoal rounded-lg p-6 max-w-2xl w-full my-8">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold text-white">Создать свой скин</h2>
							<button onClick={() => setShowCreateModal(false)}>
								<X className="w-5 h-5 text-spotify-text-muted hover:text-white" />
							</button>
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
						
						<p className="text-xs text-spotify-text-muted mb-4">
							Загрузите до 4 фото (или меньше — доступные фото переиспользуются). Каждое фото будет обрезано до 1200×400.
						</p>
						
						{/* 4 photo slots */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
							{(["home", "search", "library", "player"] as const).map((slot, idx) => {
								const labels = { home: "Главная", search: "Поиск", library: "Библиотека", player: "Плеер" };
								const file = photoSlots[slot];
								return (
									<div key={slot} className="border border-white/10 rounded-lg p-3">
										<label className="block text-sm text-white mb-2">{labels[slot]}</label>
										<label className="cursor-pointer block">
											<input
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(e) => {
													const f = e.target.files?.[0];
													handleSlotPhotoChange(slot, f || null);
												}}
											/>
											<div className="bg-spotify-sidebar rounded border border-dashed border-white/20 hover:border-spotify-green transition h-24 flex items-center justify-center text-xs text-spotify-text-muted">
												{file ? (
													<div className="text-center">
														<div className="text-white truncate max-w-[150px]">{file.name}</div>
														<div className="text-[10px]">{(file.size / 1024).toFixed(0)} KB</div>
													</div>
												) : (
													<div className="flex flex-col items-center gap-1">
														<Upload className="w-4 h-4" />
														<span>Загрузить</span>
													</div>
												)}
											</div>
										</label>
										{file && (
											<button
												onClick={() => handleSlotPhotoChange(slot, null)}
												className="text-xs text-spotify-text-muted hover:text-white mt-1"
											>
												Удалить
											</button>
										)}
									</div>
								);
							})}
						</div>
						
						<Button
							onClick={handleCreateCustomSkin}
							disabled={creatingCustomSkin || !newSkinName.trim() || Object.values(photoSlots).every(f => !f)}
							className="w-full"
						>
							{creatingCustomSkin ? "Создание..." : "Создать скин"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SkinsPage;
