/**
 * Utilidades de Formateo (Formatters)
 *
 * Unifica funciones de formateo de fechas, monedas, URLs y otros datos
 * en un solo módulo cohesivo.
 *
 * @example
 * ```ts
 * import { formatDateLocal, formatCurrency, getEasyBrokerPropertyUrl } from '@/1-app-global-core/utils';
 * ```
 */

import type { EasyBrokerProperty } from '../types/easybroker';

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formatea una fecha a formato YYYY-MM-DD (hora local)
 */
export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Obtiene el día de la semana en inglés
 */
export function getDayOfWeek(date: Date): string {
	const days = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
	];
	return days[date.getDay()];
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDateSpanish(date: Date): string {
	return date.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

/**
 * Normaliza el formato de hora para buscar en la DB
 * Convierte "10:00" a "10:00:00" para coincidir con formato TIME
 */
export function normalizeTime(time: string): string {
	if (!time.includes(':')) return time;

	const parts = time.split(':');
	if (parts.length === 2) {
		return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
	} else if (parts.length >= 3) {
		return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
	}
	return time;
}

// ============================================================================
// Currency & Data Formatting
// ============================================================================

/**
 * Formatea un número como moneda mexicana
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN',
	}).format(amount);
}

/**
 * Formatea un rango de presupuesto para mostrar
 */
export function formatBudgetRange(range: string): string {
	if (range.startsWith('mas-')) {
		const amount = range.replace('mas-', '').replace(/\D/g, '');
		return `Más de ${formatCurrency(Number(amount))}`;
	}

	const [min, max] = range.split('-').map(Number);
	return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un nombre de banco para mostrar
 */
export function formatBankName(bankKey: string): string {
	const bankNames: Record<string, string> = {
		'bbva': 'BBVA',
		'banamex': 'Banamex',
		'santander': 'Santander',
		'hsbc': 'HSBC',
		'banorte': 'Banorte',
		'scotiabank': 'Scotiabank',
		'banco-azteca': 'Banco Azteca',
		'bancoppel': 'Bancoppel',
		'inbursa': 'Inbursa',
		'banregio': 'Banregio',
		'banco-del-bajio': 'Banco del Bajío',
		'banco-multiva': 'Banco Multiva',
		'otro-banco': 'Otro banco',
	};
	return bankNames[bankKey] || capitalize(bankKey.replace(/-/g, ' '));
}

// ============================================================================
// URL Formatting (EasyBroker)
// ============================================================================

/**
 * Construye la URL pública de la ficha de Easy Broker para una propiedad
 * Formato: https://www.easybroker.com/{country}/listing/{agency_slug}/{property_slug}
 *
 * Ejemplo: https://www.easybroker.com/mx/listing/coldwellb_2/revolucion-san-angel-inn-alvaro-obregon
 *
 * @param property - Propiedad de Easy Broker
 * @param agencySlug - Slug de la agencia (requerido si no viene en la propiedad)
 * @param country - Código de país (default: 'mx')
 * @returns URL completa de la ficha en Easy Broker
 */
export function getEasyBrokerPropertyUrl(
	property: EasyBrokerProperty,
	agencySlug?: string,
	country: string = 'mx'
): string {
	// 1. Si la propiedad ya tiene public_url, usarla directamente (más confiable)
	if (property.public_url) {
		console.log('✅ Usando public_url de la propiedad:', property.public_url);
		return property.public_url;
	}

	// 2. Intentar obtener slug de la propiedad desde la API
	const propertySlug = property.slug;

	// 3. Obtener slug de la agencia (de la propiedad o del parámetro)
	const agency = property.agency_slug || agencySlug;

	console.log('🔍 Construyendo URL para propiedad:', {
		public_id: property.public_id,
		hasPublicUrl: !!property.public_url,
		hasSlug: !!propertySlug,
		hasAgency: !!agency,
		agencySlug: agency,
	});

	// 4. Si tenemos slug de propiedad y agencia, construir la URL
	if (propertySlug && agency) {
		const url = `https://www.easybroker.com/${country}/listing/${agency}/${propertySlug}`;
		console.log('✅ URL construida con slug:', url);
		return url;
	}

	// 5. Si no tenemos slug, usar public_id directamente
	// EasyBroker permite acceder a propiedades por public_id en algunos casos
	if (agency) {
		// Intentar con public_id como slug (algunas agencias lo permiten)
		const url = `https://www.easybroker.com/${country}/listing/${agency}/${property.public_id}`;
		console.log('⚠️ Usando public_id como slug:', url);
		return url;
	}

	// 6. Último fallback: URL genérica (probablemente no funcionará, pero es mejor que nada)
	console.warn(
		`⚠️ No se pudo construir URL completa para propiedad ${property.public_id}. Usando fallback genérico.`
	);
	return `https://www.easybroker.com/${country}/listing/${
		agencySlug || 'agency'
	}/${property.public_id}`;
}

