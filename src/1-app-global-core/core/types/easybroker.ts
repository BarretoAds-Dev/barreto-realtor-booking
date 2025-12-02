import { z } from 'zod';

/**
 * Esquemas de validación Zod para Easy Broker API
 * Garantiza type safety en runtime para datos externos
 */

// Schema para ubicación de propiedad
// Easy Broker devuelve location como STRING, no como objeto
export const EasyBrokerLocationSchema = z.union([
	z.string(), // Formato: "Polanco, Miguel Hidalgo, CDMX"
	z.object({
		country: z.string(),
		state: z.string(),
		city: z.string(),
		neighborhood: z.string().nullable(),
		address: z.string().nullable(),
		postal_code: z.string().nullable(),
		latitude: z.number().nullable(),
		longitude: z.number().nullable(),
	}),
]);

export type EasyBrokerLocation = z.infer<typeof EasyBrokerLocationSchema>;

// Schema para características de propiedad
export const EasyBrokerFeaturesSchema = z.object({
	bathrooms: z.number().nullable(),
	bedrooms: z.number().nullable(),
	parking_spaces: z.number().nullable(),
	half_bathrooms: z.number().nullable(),
	lot_size: z.number().nullable(),
	construction_size: z.number().nullable(),
	floors: z.number().nullable(),
});

export type EasyBrokerFeatures = z.infer<typeof EasyBrokerFeaturesSchema>;

// Schema para precios
export const EasyBrokerPriceSchema = z.object({
	amount: z.number(),
	currency: z.string(),
	formatted_amount: z.string(),
});

export type EasyBrokerPrice = z.infer<typeof EasyBrokerPriceSchema>;

// Schema para imágenes
export const EasyBrokerImageSchema = z.object({
	id: z.number(),
	url: z.string(),
	title: z.string().nullable(),
	order: z.number().nullable(),
});

export type EasyBrokerImage = z.infer<typeof EasyBrokerImageSchema>;

// Schema principal de propiedad
export const EasyBrokerPropertySchema = z.object({
	public_id: z.string(),
	title: z.string(),
	title_image_full: z.string().nullable(),
	title_image_thumb: z.string().nullable(),
	location: EasyBrokerLocationSchema, // Puede ser string o objeto
	operations: z.array(
		z.object({
			type: z.string(),
			amount: z.number(),
			currency: z.string(),
			formatted_amount: z.string(),
			commission: z.object({
				type: z.string(),
				value: z.number(),
			}),
			unit: z.string().nullable(),
		})
	),
	property_type: z.string(),
	status: z.string(),
	features: EasyBrokerFeaturesSchema,
	images: z.array(EasyBrokerImageSchema),
	description: z.string().nullable(),
	tags: z.array(z.string()),
	show_prices: z.boolean(),
	share_commission: z.boolean(),
	public_url: z.string().nullable().optional(), // URL pública de la ficha en Easy Broker
	slug: z.string().nullable().optional(), // Slug de la propiedad para construir URL
	agency_slug: z.string().nullable().optional(), // Slug de la agencia
});

export type EasyBrokerProperty = z.infer<typeof EasyBrokerPropertySchema>;

// Schema para respuesta de lista de propiedades
export const EasyBrokerPropertiesResponseSchema = z.object({
	content: z.array(EasyBrokerPropertySchema),
	pagination: z.object({
		limit: z.number(),
		page: z.number(),
		total: z.number(),
		next_page: z.number().nullable(),
	}),
});

export type EasyBrokerPropertiesResponse = z.infer<
	typeof EasyBrokerPropertiesResponseSchema
>;

// Schema para respuesta de propiedad individual
export const EasyBrokerPropertyResponseSchema = z.object({
	property: EasyBrokerPropertySchema,
});

export type EasyBrokerPropertyResponse = z.infer<
	typeof EasyBrokerPropertyResponseSchema
>;

// Tipos para filtros de búsqueda
export interface EasyBrokerSearchFilters {
	page?: number;
	limit?: number;
	search?: {
		statuses?: string[];
		property_types?: string[];
		locations?: string[];
		min_price?: number;
		max_price?: number;
		min_bedrooms?: number;
		max_bedrooms?: number;
		min_bathrooms?: number;
		max_bathrooms?: number;
	};
}

// Tipo para resultado de servicio
export interface EasyBrokerServiceResult<T> {
	data: T | null;
	error: {
		message: string;
		code?: string;
		status?: number;
	} | null;
}

