/**
 * Утилиты для использования динамических CSS-переменных скинов
 */

export const getSkinAccent = () => 'var(--skin-accent, #1DB954)';
export const getSkinAccentSecondary = () => 'var(--skin-accent-secondary, #1ed760)';

export const skinButtonClass = (baseClass: string = '') => {
	// Используем CSS-переменную --button-style для применения разных стилей кнопок
	return `${baseClass} skin-button`;
};

// Динамический класс для акцентных элементов (кнопки, иконки, прогресс-бары)
export const skinAccentClass = (baseClass: string = '') => {
	return `${baseClass} [&]:text-[var(--skin-accent)] hover:[&]:text-[var(--skin-accent-secondary)]`;
};

// Для фона с баннером скина
export const skinBannerStyle = (): React.CSSProperties => ({
	backgroundImage: 'var(--skin-banner, none)',
	backgroundSize: 'cover',
	backgroundPosition: 'center',
});

// Для фона с картинкой скина
export const skinBackgroundStyle = (): React.CSSProperties => ({
	backgroundImage: 'var(--skin-background, none)',
	backgroundSize: 'cover',
	backgroundPosition: 'center',
});
