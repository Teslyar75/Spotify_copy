import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BANNER_SLOTS, BannerSlot, Skin, useSkinStore } from "@/stores/useSkinStore";

// Подписи окон, как их видит пользователь
export const SLOT_LABELS: Record<BannerSlot, string> = {
	home: "Главная",
	search: "Поиск",
	library: "Your Library",
	player: "Окно мелодии",
};

// Оригинальные заголовки — если у темы нет баннера для окна
const SLOT_FALLBACK: Record<BannerSlot, string> = {
	home: "/home-header-bg.png",
	search: "/search-header-bg.png",
	library: "/library-header-bg.png",
	player: "/album-header-bg.png",
};

const MAX_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Понятное сообщение об ошибке по-русски
export const bannerErrorMessage = (error: any): string => {
	const status = error?.response?.status;
	const detail = error?.response?.data?.detail;
	if (!error?.response) return "Нет связи с сервером. Проверьте, что приложение запущено, и попробуйте ещё раз.";
	if (status === 413) return `Файл слишком большой (максимум ${MAX_MB} МБ)`;
	if (typeof detail === "string" && /[а-яё]/i.test(detail)) return detail;
	if (status === 401 || status === 403) return "Сессия истекла — войдите снова, чтобы редактировать скин";
	if (status === 404) return "Скин не найден — обновите страницу";
	if (status === 400 || status === 422) return `Не удалось загрузить фото. Подойдут JPG, PNG или WebP до ${MAX_MB} МБ.`;
	return "Не удалось сохранить изменения. Попробуйте ещё раз.";
};

const checkFile = (file: File): string | null => {
	if (!ALLOWED_TYPES.includes(file.type)) return "Подойдут только JPG, PNG или WebP";
	if (file.size > MAX_MB * 1024 * 1024) return `Файл слишком большой (максимум ${MAX_MB} МБ)`;
	return null;
};

type SlotMap<T> = Record<BannerSlot, T>;
const emptySlots = <T,>(value: T): SlotMap<T> => ({ home: value, search: value, library: value, player: value });

interface Props {
	skin: Skin;
	onClose: () => void;
}

const SkinBannerEditor = ({ skin, onClose }: Props) => {
	const { uploadSkinBanner, resetSkinBanner, activeSkin } = useSkinStore();
	const [current, setCurrent] = useState<Skin>(skin);
	const [progress, setProgress] = useState<SlotMap<number | null>>(emptySlots(null));
	const [resetting, setResetting] = useState<SlotMap<boolean>>(emptySlots(false));
	const [errors, setErrors] = useState<SlotMap<string | null>>(emptySlots(null));
	const inputs = useRef<Partial<Record<BannerSlot, HTMLInputElement | null>>>({});
	const isActive = activeSkin?.id === skin.id;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const setProgressFor = (slot: BannerSlot, value: number | null) => setProgress((prev) => ({ ...prev, [slot]: value }));
	const setResettingFor = (slot: BannerSlot, value: boolean) => setResetting((prev) => ({ ...prev, [slot]: value }));
	const setErrorFor = (slot: BannerSlot, value: string | null) => setErrors((prev) => ({ ...prev, [slot]: value }));

	const handleFile = async (slot: BannerSlot, file: File | undefined) => {
		if (!file) return;
		// окно занято (идёт загрузка/возврат) — не запускаем второй запрос поверх
		if (progress[slot] !== null || resetting[slot]) return;
		const problem = checkFile(file);
		if (problem) {
			setErrorFor(slot, problem);
			toast.error(problem);
			return;
		}
		setErrorFor(slot, null);
		setProgressFor(slot, 0);
		try {
			const updated = await uploadSkinBanner(skin.id, slot, file, (p) => setProgressFor(slot, p));
			setCurrent(updated);
			toast.success(`Фото для окна «${SLOT_LABELS[slot]}» сохранено`);
		} catch (error) {
			const message = bannerErrorMessage(error);
			setErrorFor(slot, message);
			toast.error(message);
		} finally {
			setProgressFor(slot, null);
			const input = inputs.current[slot];
			if (input) input.value = "";
		}
	};

	const handleReset = async (slot: BannerSlot) => {
		if (progress[slot] !== null || resetting[slot]) return;
		setErrorFor(slot, null);
		setResettingFor(slot, true);
		try {
			const updated = await resetSkinBanner(skin.id, slot);
			setCurrent(updated);
			toast.success(`Окно «${SLOT_LABELS[slot]}»: вернули картинку темы`);
		} catch (error) {
			const message = bannerErrorMessage(error);
			setErrorFor(slot, message);
			toast.error(message);
		} finally {
			setResettingFor(slot, false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
			onClick={onClose}
			data-testid="skin-banner-editor"
		>
			<div
				className="my-6 w-full max-w-4xl rounded-lg bg-spotify-charcoal p-4 sm:p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-1 flex items-start justify-between gap-4">
					<div className="min-w-0">
						<h2 className="truncate text-xl font-bold text-white">Редактировать «{skin.name}»</h2>
						<p className="mt-1 text-sm text-spotify-text-muted">
							Поставьте своё фото в любое из 4 окон. Фото обрежется по центру до 1200×400.
							JPG, PNG или WebP до {MAX_MB} МБ.
							{isActive ? " Скин активен — изменения видны сразу." : " Примените скин, чтобы увидеть фото в приложении."}
						</p>
					</div>
					<button onClick={onClose} aria-label="Закрыть" className="shrink-0">
						<X className="h-5 w-5 text-spotify-text-muted hover:text-white" />
					</button>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
					{BANNER_SLOTS.map((slot) => {
						const isCustom = current.custom_slots?.includes(slot) ?? false;
						const src = current.banners?.[slot] || current.banner_url || SLOT_FALLBACK[slot];
						const uploading = progress[slot] !== null;
						const busy = uploading || resetting[slot];
						return (
							<div key={slot} data-slot={slot} className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
								<div className="mb-2 flex items-center justify-between gap-2">
									<span className="text-sm font-semibold text-white">{SLOT_LABELS[slot]}</span>
									<span
										className={`rounded px-2 py-0.5 text-[11px] ${
											isCustom ? "bg-spotify-green/20 text-spotify-green" : "bg-white/10 text-spotify-text-muted"
										}`}
									>
										{isCustom ? "Своё фото" : "Картинка темы"}
									</span>
								</div>

								<div className="relative aspect-[3/1] overflow-hidden rounded bg-spotify-sidebar">
									<img src={src} alt={SLOT_LABELS[slot]} className="h-full w-full object-cover" />
									{busy && (
										<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-xs text-white">
											<Loader2 className="h-5 w-5 animate-spin" />
											{uploading ? `Загрузка… ${progress[slot]}%` : "Возвращаем…"}
										</div>
									)}
								</div>

								{uploading && (
									<div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-white/10" role="progressbar" aria-valuenow={progress[slot] ?? 0}>
										<div className="h-full skin-accent-bg bg-spotify-green transition-all" style={{ width: `${progress[slot]}%` }} />
									</div>
								)}

								<input
									ref={(el) => {
										inputs.current[slot] = el;
									}}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									data-testid={`banner-input-${slot}`}
									onChange={(e) => handleFile(slot, e.target.files?.[0])}
								/>

								<div className="mt-3 flex flex-wrap gap-2">
									<Button
										size="sm"
										className="gap-1.5"
										disabled={busy}
										onClick={() => inputs.current[slot]?.click()}
									>
										<ImagePlus className="h-4 w-4" />
										Загрузить своё фото
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10"
										disabled={busy || !isCustom}
										onClick={() => handleReset(slot)}
										data-testid={`banner-reset-${slot}`}
									>
										<RotateCcw className="h-4 w-4" />
										Вернуть как было
									</Button>
								</div>

								{errors[slot] && <p className="mt-2 text-xs text-red-400">{errors[slot]}</p>}
							</div>
						);
					})}
				</div>

				<div className="mt-5 flex justify-end">
					<Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={onClose}>
						Готово
					</Button>
				</div>
			</div>
		</div>
	);
};

export default SkinBannerEditor;
