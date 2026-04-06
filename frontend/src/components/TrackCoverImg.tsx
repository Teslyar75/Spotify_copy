import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/album-placeholder.png";

/** Нормализует URL обложки и подставляет заглушку при ошибке загрузки (Jamendo CDN, удалённый /media/ и т.д.). */
export function resolveCoverSrc(url: string | null | undefined): string {
	if (!url || !url.trim()) return PLACEHOLDER;
	const u = url.trim();
	if (u.startsWith("/") || u.startsWith("http://") || u.startsWith("https://")) return u;
	return u.startsWith("data:") ? u : PLACEHOLDER;
}

interface TrackCoverImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
	src: string | null | undefined;
	alt: string;
}

/**
 * Обложка трека/альбома: no-referrer для внешних CDN, fallback при 404/блокировке.
 */
export function TrackCoverImg({ src, alt, className, onError, ...rest }: TrackCoverImgProps) {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [src]);

	const resolved = failed ? PLACEHOLDER : resolveCoverSrc(src);

	return (
		<img
			src={resolved}
			alt={alt}
			referrerPolicy="no-referrer"
			loading="lazy"
			decoding="async"
			className={cn(className)}
			onError={(e) => {
				setFailed(true);
				(e.target as HTMLImageElement).src = PLACEHOLDER;
				onError?.(e);
			}}
			{...rest}
		/>
	);
}
