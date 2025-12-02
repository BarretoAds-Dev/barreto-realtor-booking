/**
 * Configuración de APIs Externas
 *
 * Centraliza la configuración de todas las APIs externas del sistema:
 * - EasyBroker API
 * - Futuras APIs (Google Maps, Stripe, etc.)
 *
 * Edge-compatible: Usa import.meta.env para variables de entorno
 */

// ============================================================================
// EasyBroker API Configuration
// ============================================================================

// Intentar ambas variantes: con y sin PUBLIC_ prefix
const EASYBROKER_API_KEY =
	import.meta.env.EASYBROKER_API_KEY ||
	import.meta.env.PUBLIC_EASYBROKER_API_KEY;

const EASYBROKER_API_BASE_URL = 'https://api.easybroker.com/v1';

// Slug de la agencia (puede venir de env o configurarse manualmente)
// Ejemplo: 'inmobiliaria-de-novac-coldwell-banker' o 'coldwellb_2'
const EASYBROKER_AGENCY_SLUG =
	import.meta.env.EASYBROKER_AGENCY_SLUG ||
	import.meta.env.PUBLIC_EASYBROKER_AGENCY_SLUG ||
	'coldwellb_2'; // Default basado en el ejemplo

if (!EASYBROKER_API_KEY) {
	console.warn(
		'⚠️ EASYBROKER_API_KEY no está configurada. Las funciones de Easy Broker no funcionarán.'
	);
}

/**
 * Configuración completa de EasyBroker
 */
export const easybrokerConfig = {
	apiKey: EASYBROKER_API_KEY || '',
	baseUrl: EASYBROKER_API_BASE_URL,
	agencySlug: EASYBROKER_AGENCY_SLUG,
	headers: {
		'X-Authorization': EASYBROKER_API_KEY || '',
		'Accept': 'application/json',
		'Content-Type': 'application/json',
	},
} as const;

/**
 * Valida que la configuración de Easy Broker esté completa
 *
 * @returns true si la configuración es válida, false en caso contrario
 */
export function validateEasyBrokerConfig(): boolean {
	if (!EASYBROKER_API_KEY) {
		return false;
	}
	return true;
}

/**
 * Obtiene la API key de Easy Broker
 *
 * @returns API key o null si no está configurada
 */
export function getEasyBrokerApiKey(): string | null {
	return EASYBROKER_API_KEY || null;
}

/**
 * Obtiene la URL base de Easy Broker
 *
 * @returns URL base de la API
 */
export function getEasyBrokerBaseUrl(): string {
	return EASYBROKER_API_BASE_URL;
}

// ============================================================================
// Future External APIs
// ============================================================================

/**
 * Placeholder para futuras configuraciones de APIs externas
 * Ejemplos: Google Maps, Stripe, SendGrid, etc.
 */

// export const googleMapsConfig = {
//   apiKey: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY || '',
//   // ...
// } as const;

// export const stripeConfig = {
//   publishableKey: import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
//   // ...
// } as const;

