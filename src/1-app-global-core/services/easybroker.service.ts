import { easybrokerConfig, validateEasyBrokerConfig } from '../config';
import type {
  EasyBrokerPropertiesResponse,
  EasyBrokerProperty,
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
    const validation = EasyBrokerPropertiesResponseSchema.safeParse(
      result.data
    );

    if (!validation.success) {
      console.error(
        '❌ Validación Easy Broker falló:',
        validation.error.errors
      );
      console.error('📦 Estructura recibida:', {
        hasContent: !!(result.data as any)?.content,
        contentLength: Array.isArray((result.data as any)?.content)
          ? (result.data as any).content.length
          : 'not array',
        hasPagination: !!(result.data as any)?.pagination,
        keys: Object.keys((result.data as any) || {}),
        firstPropertyKeys:
          Array.isArray((result.data as any)?.content) &&
          (result.data as any).content.length > 0
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
          console.log(
            '📋 Campos disponibles en propiedad:',
            Object.keys(firstProp)
          );
          console.log(
            '📍 Location RAW de la primera propiedad:',
            JSON.stringify(firstProp.location, null, 2)
          );
          console.log(
            '🏠 Features RAW de la primera propiedad:',
            JSON.stringify(firstProp.features, null, 2)
          );
          console.log('🔍 Buscando location en otros campos:', {
            has_location: !!firstProp.location,
            location_keys: firstProp.location
              ? Object.keys(firstProp.location)
              : [],
            has_address: !!firstProp.address,
            has_city: !!firstProp.city,
            has_state: !!firstProp.state,
            has_neighborhood: !!firstProp.neighborhood,
          });
          console.log('🔍 Buscando features en otros campos:', {
            has_features: !!firstProp.features,
            features_keys: firstProp.features
              ? Object.keys(firstProp.features)
              : [],
            has_bedrooms: firstProp.bedrooms !== undefined,
            has_bathrooms: firstProp.bathrooms !== undefined,
            has_parking: firstProp.parking_spaces !== undefined,
          });
        }

        const normalizedContent = data.content.map((prop: any) => {
          // Normalizar location - Easy Broker devuelve location como STRING
          // Si es string, mantenerlo; si es objeto, convertirlo a string
          let normalizedLocation: string | object;
          if (typeof prop.location === 'string') {
            normalizedLocation = prop.location;
          } else if (prop.location && typeof prop.location === 'object') {
            // Si es objeto, construir string desde los campos
            const parts: string[] = [];
            if (prop.location.address) parts.push(prop.location.address);
            if (prop.location.neighborhood)
              parts.push(prop.location.neighborhood);
            if (prop.location.city) parts.push(prop.location.city);
            if (
              prop.location.state &&
              prop.location.state !== prop.location.city
            ) {
              parts.push(prop.location.state);
            }
            normalizedLocation =
              parts.length > 0
                ? parts.join(', ')
                : prop.location.country || 'México';
          } else {
            // Fallback: buscar en otros campos o usar string vacío
            const parts: string[] = [];
            if (prop.address) parts.push(prop.address);
            if (prop.neighborhood) parts.push(prop.neighborhood);
            if (prop.city) parts.push(prop.city);
            if (prop.state) parts.push(prop.state);
            normalizedLocation =
              parts.length > 0 ? parts.join(', ') : prop.country || 'México';
          }

          // Normalizar features - buscar en múltiples lugares posibles
          const features = prop.features || {};
          // La API puede tener los campos directamente en prop o anidados en features
          const normalizedFeatures = {
            bathrooms:
              features.bathrooms ??
              prop.bathrooms ??
              features.bathrooms_count ??
              prop.bathrooms_count ??
              null,
            bedrooms:
              features.bedrooms ??
              prop.bedrooms ??
              features.bedrooms_count ??
              prop.bedrooms_count ??
              null,
            parking_spaces:
              features.parking_spaces ??
              prop.parking_spaces ??
              features.parking_count ??
              prop.parking_count ??
              null,
            half_bathrooms:
              features.half_bathrooms ??
              prop.half_bathrooms ??
              features.half_bathrooms_count ??
              prop.half_bathrooms_count ??
              null,
            lot_size:
              features.lot_size ??
              prop.lot_size ??
              features.lot_size_m2 ??
              prop.lot_size_m2 ??
              null,
            construction_size:
              features.construction_size ??
              prop.construction_size ??
              features.construction_size_m2 ??
              prop.construction_size_m2 ??
              features.area ??
              prop.area ??
              prop.surface ??
              null,
            floors:
              features.floors ??
              prop.floors ??
              features.floors_count ??
              prop.floors_count ??
              null,
          };

          return {
            public_id: prop.public_id || prop.id || String(Math.random()),
            title: prop.title || '',
            title_image_full:
              prop.title_image_full || prop.title_image_thumb || null,
            title_image_thumb: prop.title_image_thumb || null,
            location: normalizedLocation, // String o objeto según lo que devuelva la API
            operations: prop.operations || [],
            property_type: prop.property_type || 'casa',
            status: prop.status || 'active',
            features: normalizedFeatures,
            images: prop.images || [],
            description: prop.description || null,
            tags: prop.tags || [],
            show_prices:
              prop.show_prices !== undefined ? prop.show_prices : true,
            share_commission:
              prop.share_commission !== undefined
                ? prop.share_commission
                : false,
            // Intentar obtener public_url de múltiples campos posibles
            public_url:
              prop.public_url ||
              prop.url ||
              prop.public_url_full ||
              prop.listing_url ||
              null,
            // Intentar obtener slug de múltiples campos posibles
            slug:
              prop.slug ||
              prop.title_slug ||
              prop.property_slug ||
              prop.url_slug ||
              null,
            // Intentar obtener agency_slug de múltiples campos posibles
            agency_slug:
              prop.agency_slug ||
              prop.agency?.slug ||
              prop.agency_slug_name ||
              null,
          };
        });

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
          message:
            'Estructura de respuesta inválida: no se encontró array content',
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

    // Normalizar datos incluso si la validación pasa, para asegurar consistencia
    const normalizedContent = validation.data.content.map((prop) => {
      // Normalizar location - Easy Broker devuelve location como STRING
      let normalizedLocation: string | object;
      if (typeof prop.location === 'string') {
        normalizedLocation = prop.location;
      } else if (prop.location && typeof prop.location === 'object') {
        // Si es objeto, mantenerlo o convertirlo a string
        const parts: string[] = [];
        if (prop.location.address) parts.push(prop.location.address);
        if (prop.location.neighborhood) parts.push(prop.location.neighborhood);
        if (prop.location.city) parts.push(prop.location.city);
        if (prop.location.state && prop.location.state !== prop.location.city) {
          parts.push(prop.location.state);
        }
        normalizedLocation =
          parts.length > 0
            ? parts.join(', ')
            : prop.location.country || 'México';
      } else {
        normalizedLocation = 'Ubicación no disponible';
      }

      // Asegurar que features siempre tenga todos los campos
      const features = prop.features || {};
      const normalizedFeatures = {
        bathrooms: features.bathrooms ?? null,
        bedrooms: features.bedrooms ?? null,
        parking_spaces: features.parking_spaces ?? null,
        half_bathrooms: features.half_bathrooms ?? null,
        lot_size: features.lot_size ?? null,
        construction_size: features.construction_size ?? null,
        floors: features.floors ?? null,
      };

      return {
        ...prop,
        location: normalizedLocation,
        features: normalizedFeatures,
      };
    });

    return {
      data: {
        ...validation.data,
        content: normalizedContent,
      },
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
      // Si la validación falla, intentar normalizar manualmente
      const rawData = result.data as any;
      const property = rawData.property || rawData;

      if (property && property.public_id) {
        // Normalizar la propiedad manualmente
        const normalizedProperty: any = {
          public_id: property.public_id || property.id,
          title: property.title || '',
          title_image_full:
            property.title_image_full || property.title_image_thumb || null,
          title_image_thumb: property.title_image_thumb || null,
          location:
            typeof property.location === 'string'
              ? property.location
              : property.location || '',
          operations: property.operations || [],
          property_type: property.property_type || 'casa',
          status: property.status || 'active',
          features: property.features || {},
          images: property.images || [],
          description: property.description || null,
          tags: property.tags || [],
          show_prices:
            property.show_prices !== undefined ? property.show_prices : true,
          share_commission:
            property.share_commission !== undefined
              ? property.share_commission
              : false,
          // Intentar obtener public_url de múltiples campos
          public_url:
            property.public_url ||
            property.url ||
            property.public_url_full ||
            property.listing_url ||
            property.web_url ||
            null,
          slug:
            property.slug ||
            property.title_slug ||
            property.property_slug ||
            property.url_slug ||
            null,
          agency_slug:
            property.agency_slug ||
            property.agency?.slug ||
            property.agency_slug_name ||
            null,
        };

        console.log('✅ Propiedad normalizada manualmente:', {
          public_id: normalizedProperty.public_id,
          hasPublicUrl: !!normalizedProperty.public_url,
          hasSlug: !!normalizedProperty.slug,
          public_url: normalizedProperty.public_url,
        });

        return {
          data: normalizedProperty as EasyBrokerProperty,
          error: null,
        };
      }

      return {
        data: null,
        error: {
          message: 'Respuesta de Easy Broker no válida',
          code: 'EB_VALIDATION_ERROR',
        },
      };
    }

    // Normalizar la propiedad validada para asegurar que tenga public_url
    const validatedProperty = validation.data.property;
    const normalizedProperty = {
      ...validatedProperty,
      // Intentar obtener public_url de múltiples campos si no está disponible
      public_url:
        validatedProperty.public_url ||
        (result.data as any).property?.public_url ||
        (result.data as any).property?.url ||
        (result.data as any).property?.public_url_full ||
        (result.data as any).property?.listing_url ||
        (result.data as any).property?.web_url ||
        null,
    };

    console.log('✅ Propiedad obtenida:', {
      public_id: normalizedProperty.public_id,
      hasPublicUrl: !!normalizedProperty.public_url,
      hasSlug: !!normalizedProperty.slug,
      public_url: normalizedProperty.public_url,
    });

    return {
      data: normalizedProperty,
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
  getProperty: (publicId: string) =>
    getEasyBrokerService().getProperty(publicId),
  searchProperties: (query: string, filters?: EasyBrokerSearchFilters) =>
    getEasyBrokerService().searchProperties(query, filters),
};
