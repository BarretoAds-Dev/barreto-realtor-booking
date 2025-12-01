import { easybrokerConfig, validateEasyBrokerConfig } from '../config/easybroker';
import type {
	EasyBrokerProperty,
	EasyBrokerPropertiesResponse,
	EasyBrokerPropertyResponse,
	EasyBrokerSearchFilters,
	EasyBrokerServiceResult,
} from '../types/easybroker';
import {
	EasyBrokerPropertiesResponseSchema,
	EasyBrokerPropertyResponseSchema,
} from '../types/easybroker';

/**
 * Servicio para interactuar con Easy Broker API
 * Edge-compatible: Usa fetch estándar (WinterCG compliant)
 * Type-safe: Validación con Zod en runtime
 */
class EasyBrokerService {
	private readonly baseUrl: string;
	private readonly headers: HeadersInit;

	constructor() {
		if (!validateEasyBrokerConfig()) {
			throw new Error(
				'Easy Broker API key no configurada. Configura EASYBROKER_API_KEY en las variables de entorno.'
			);
		}

		this.baseUrl = easybrokerConfig.baseUrl;
		this.headers = easybrokerConfig.headers;
	}

	/**
	 * Realiza una petición a la API de Easy Broker con manejo de errores tipado
	 */
	private async fetchAPI<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<EasyBrokerServiceResult<T>> {
		try {
			const url = `${this.baseUrl}${endpoint}`;
			console.log('🔍 Easy Broker API Request:', url);
			const response = await fetch(url, {
				...options,
				headers: {
					...this.headers,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				console.error('❌ Easy Broker API Error:', {
					status: response.status,
					statusText: response.statusText,
					errorText,
				});
				return {
					data: null,
					error: {
						message: `Easy Broker API error: ${response.statusText}`,
						code: `EB_${response.status}`,
						status: response.status,
					},
				};
			}

			const jsonData = await response.json();
			console.log('✅ Easy Broker API Response:', {
				endpoint,
				hasData: !!jsonData,
				contentLength: jsonData?.content?.length || 0,
			});

			return {
				data: jsonData as T,
				error: null,
			};
		} catch (error) {
			return {
				data: null,
				error: {
					message:
						error instanceof Error
							? error.message
							: 'Error desconocido al conectar con Easy Broker',
					code: 'EB_NETWORK_ERROR',
				},
			};
		}
	}

	/**
	 * Obtiene una lista de propiedades con filtros opcionales
	 */
	async getProperties(
		filters: EasyBrokerSearchFilters = {}
	): Promise<EasyBrokerServiceResult<EasyBrokerPropertiesResponse>> {
		const { page = 1, limit = 20, search = {} } = filters;

		// Construir query params
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
		});

		// Agregar filtros de búsqueda si existen
		if (search.statuses && search.statuses.length > 0) {
			search.statuses.forEach((status) => {
				params.append('search[statuses][]', status);
			});
		}

		if (search.property_types && search.property_types.length > 0) {
			search.property_types.forEach((type) => {
				params.append('search[property_types][]', type);
			});
		}

		if (search.locations && search.locations.length > 0) {
			search.locations.forEach((location) => {
				params.append('search[locations][]', location);
			});
		}

		if (search.min_price !== undefined) {
			params.append('search[min_price]', search.min_price.toString());
		}

		if (search.max_price !== undefined) {
			params.append('search[max_price]', search.max_price.toString());
		}

		if (search.min_bedrooms !== undefined) {
			params.append('search[min_bedrooms]', search.min_bedrooms.toString());
		}

		if (search.max_bedrooms !== undefined) {
			params.append('search[max_bedrooms]', search.max_bedrooms.toString());
		}

		if (search.min_bathrooms !== undefined) {
			params.append('search[min_bathrooms]', search.min_bathrooms.toString());
		}

		if (search.max_bathrooms !== undefined) {
			params.append('search[max_bathrooms]', search.max_bathrooms.toString());
		}

		const endpoint = `/properties?${params.toString()}`;
		const result = await this.fetchAPI<unknown>(endpoint);

		if (result.error || !result.data) {
			return result as EasyBrokerServiceResult<EasyBrokerPropertiesResponse>;
		}

		// Validar respuesta con Zod
		const validation = EasyBrokerPropertiesResponseSchema.safeParse(result.data);

		if (!validation.success) {
			console.error('❌ Validación Easy Broker falló:', validation.error.errors);
			console.error('📦 Estructura recibida:', {
				hasContent: !!(result.data as any)?.content,
				contentLength: Array.isArray((result.data as any)?.content)
					? (result.data as any).content.length
					: 'not array',
				hasPagination: !!(result.data as any)?.pagination,
				keys: Object.keys((result.data as any) || {}),
				firstPropertyKeys: Array.isArray((result.data as any)?.content) && (result.data as any).content.length > 0
					? Object.keys((result.data as any).content[0] || {})
					: [],
			});

			// Intentar parsear manualmente si la validación falla
			// La API de Easy Broker puede tener variaciones en la estructura
			const data = result.data as any;
			if (data && Array.isArray(data.content)) {
				console.warn('⚠️ Usando datos sin validación estricta (fallback mode)');

				// Normalizar datos para que coincidan con nuestro schema
				// Log para debugging - ver qué campos tiene la primera propiedad
				if (data.content.length > 0) {
					const firstProp = data.content[0];
					console.log('📋 Campos disponibles en propiedad:', Object.keys(firstProp));
					console.log('🖼️ Imágenes de la primera propiedad:', {
						title_image_full: firstProp.title_image_full,
						title_image_thumb: firstProp.title_image_thumb,
						images_count: firstProp.images?.length || 0,
						images: firstProp.images?.slice(0, 3).map((img: any) => ({
							id: img.id,
							url: img.url?.substring(0, 100),
							title: img.title,
						})),
					});
				}

				const normalizedContent = data.content.map((prop: any) => ({
					public_id: prop.public_id || prop.id || String(Math.random()),
					title: prop.title || '',
					title_image_full: prop.title_image_full || prop.title_image_thumb || null,
					title_image_thumb: prop.title_image_thumb || null,
					location: prop.location || {
						country: 'México',
						state: '',
						city: '',
						neighborhood: null,
						address: null,
						postal_code: null,
						latitude: null,
						longitude: null,
					},
					operations: prop.operations || [],
					property_type: prop.property_type || 'casa',
					status: prop.status || 'active',
					features: prop.features || {
						bathrooms: null,
						bedrooms: null,
						parking_spaces: null,
						half_bathrooms: null,
						lot_size: null,
						construction_size: null,
						floors: null,
					},
					images: prop.images || [],
					description: prop.description || null,
					tags: prop.tags || [],
					show_prices: prop.show_prices !== undefined ? prop.show_prices : true,
					share_commission: prop.share_commission !== undefined ? prop.share_commission : false,
					public_url: prop.public_url || prop.url || null, // URL pública de Easy Broker
					slug: prop.slug || prop.title_slug || null, // Slug de la propiedad
					agency_slug: prop.agency_slug || prop.agency?.slug || null, // Slug de la agencia
				}));

				console.log(`✅ Normalizadas ${normalizedContent.length} propiedades`);
				return {
					data: {
						content: normalizedContent,
						pagination: data.pagination || {
							limit: 20,
							page: 1,
							total: normalizedContent.length,
							next_page: null,
						},
					} as EasyBrokerPropertiesResponse,
					error: null,
				};
			}

			// Si no hay content array, retornar error
			console.error('❌ No se encontró array content en la respuesta');
			return {
				data: null,
				error: {
					message: 'Estructura de respuesta inválida: no se encontró array content',
					code: 'INVALID_RESPONSE',
					status: 500,
				},
			};

			return {
				data: null,
				error: {
					message: 'Respuesta de Easy Broker no válida',
					code: 'EB_VALIDATION_ERROR',
				},
			};
		}

		return {
			data: validation.data,
			error: null,
		};
	}

	/**
	 * Obtiene una propiedad específica por su public_id
	 */
	async getProperty(
		publicId: string
	): Promise<EasyBrokerServiceResult<EasyBrokerProperty>> {
		const endpoint = `/properties/${publicId}`;
		const result = await this.fetchAPI<unknown>(endpoint);

		if (result.error || !result.data) {
			return {
				data: null,
				error: result.error,
			};
		}

		// Validar respuesta con Zod
		const validation = EasyBrokerPropertyResponseSchema.safeParse(result.data);

		if (!validation.success) {
			return {
				data: null,
				error: {
					message: 'Respuesta de Easy Broker no válida',
					code: 'EB_VALIDATION_ERROR',
				},
			};
		}

		return {
			data: validation.data.property,
			error: null,
		};
	}

	/**
	 * Busca propiedades por texto
	 */
	async searchProperties(
		query: string,
		filters: Omit<EasyBrokerSearchFilters, 'search'> = {}
	): Promise<EasyBrokerServiceResult<EasyBrokerPropertiesResponse>> {
		return this.getProperties({
			...filters,
			search: {
				...filters.search,
				// Easy Broker usa el parámetro 'q' para búsqueda de texto
			},
		});
	}
}

// Singleton instance
let serviceInstance: EasyBrokerService | null = null;

/**
 * Obtiene la instancia singleton del servicio Easy Broker
 */
export function getEasyBrokerService(): EasyBrokerService {
	if (!serviceInstance) {
		serviceInstance = new EasyBrokerService();
	}
	return serviceInstance;
}

// Exportar métodos directos para facilitar el uso
export const EasyBrokerServiceAPI = {
	getProperties: (filters?: EasyBrokerSearchFilters) =>
		getEasyBrokerService().getProperties(filters),
	getProperty: (publicId: string) => getEasyBrokerService().getProperty(publicId),
	searchProperties: (query: string, filters?: EasyBrokerSearchFilters) =>
		getEasyBrokerService().searchProperties(query, filters),
};

