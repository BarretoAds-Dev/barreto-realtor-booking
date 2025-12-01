import type { EasyBrokerProperty } from '../types/easybroker';

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
	// Si la propiedad ya tiene public_url, usarla directamente
	if ((property as any).public_url) {
		return (property as any).public_url;
	}

	// Obtener slug de la propiedad desde la API
	const propertySlug = (property as any).slug;

	// Obtener slug de la agencia (de la propiedad o del parámetro)
	const agency = (property as any).agency_slug || agencySlug;

	// Si tenemos slug de propiedad y agencia, construir la URL
	if (propertySlug && agency) {
		return `https://www.easybroker.com/${country}/listing/${agency}/${propertySlug}`;
	}

	// Si solo tenemos agencia pero no slug, intentar construir desde el título y ubicación
	if (agency) {
		// Basado en el ejemplo: "revolucion-san-angel-inn-alvaro-obregon"
		// Parece que combina partes del título con la ubicación
		const location = property.location;

		// Extraer partes relevantes del título (primera palabra o dirección)
		const titleWords = property.title
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.split(/[,\s]+/)
			.filter(word => word.length > 2)
			.slice(0, 3); // Tomar primeras 3 palabras relevantes

		// Construir slug de ubicación
		const locationParts: string[] = [];
		if (location?.neighborhood) {
			locationParts.push(location.neighborhood);
		}
		if (location?.city && location.city !== location.neighborhood) {
			locationParts.push(location.city);
		}

		const locationSlug = locationParts
			.map(part => part.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9\s-]+/g, '')
				.trim()
				.replace(/\s+/g, '-')
			)
			.filter(Boolean)
			.join('-');

		// Combinar título y ubicación
		const titleSlug = titleWords.join('-');
		const finalSlug = [titleSlug, locationSlug]
			.filter(Boolean)
			.join('-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');

		if (finalSlug) {
			return `https://www.easybroker.com/${country}/listing/${agency}/${finalSlug}`;
		}
	}

	// Último fallback: usar public_id (puede no funcionar, pero es mejor que nada)
	console.warn(
		`⚠️ No se pudo construir URL completa para propiedad ${property.public_id}. Usando fallback.`
	);
	return `https://www.easybroker.com/${country}/listing/${agency || 'agency'}/${property.public_id}`;
}

