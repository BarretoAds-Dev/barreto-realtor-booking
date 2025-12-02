import { useState, useEffect } from 'preact/hooks';

/**
 * Hook para detectar media queries
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * 
 * if (isMobile) {
 *   return <MobileView />;
 * }
 * return <DesktopView />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const mediaQuery = window.matchMedia(query);
		
		// Función para actualizar el estado
		const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
			setMatches(event.matches);
		};

		// Verificar estado inicial
		setMatches(mediaQuery.matches);

		// Agregar listener
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handleChange);
		} else {
			// Fallback para navegadores antiguos
			mediaQuery.addListener(handleChange);
		}

		// Cleanup
		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', handleChange);
			} else {
				mediaQuery.removeListener(handleChange);
			}
		};
	}, [query]);

	return matches;
}

/**
 * Hooks predefinidos para breakpoints comunes
 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
export const usePrefersDark = () => useMediaQuery('(prefers-color-scheme: dark)');

