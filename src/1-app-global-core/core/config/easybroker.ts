/**
 * Configuración de Easy Broker API
 * Edge-compatible: Usa import.meta.env para variables de entorno
 */

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
 */
export function validateEasyBrokerConfig(): boolean {
	if (!EASYBROKER_API_KEY) {
		return false;
	}
	return true;
}

/**
 * Obtiene la API key de Easy Broker
 */
export function getEasyBrokerApiKey(): string | null {
	return EASYBROKER_API_KEY || null;
}

/**
 * Obtiene la URL base de Easy Broker
 */
export function getEasyBrokerBaseUrl(): string {
	return EASYBROKER_API_BASE_URL;
}

