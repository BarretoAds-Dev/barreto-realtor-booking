import { validateEasyBrokerConfig } from '@/1-app-global-core/config';
import { EasyBrokerServiceAPI } from '@/1-app-global-core/services/easybroker.service';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/easybroker/properties
 * Obtiene una lista de propiedades de Easy Broker
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: resultados por página (default: 20, max: 50)
 * - statuses: filtro por estados (array)
 * - property_types: filtro por tipos de propiedad (array)
 * - locations: filtro por ubicaciones (array)
 * - min_price: precio mínimo
 * - max_price: precio máximo
 * - min_bedrooms: recámaras mínimas
 * - max_bedrooms: recámaras máximas
 * - min_bathrooms: baños mínimos
 * - max_bathrooms: baños máximos
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Validar configuración
    if (!validateEasyBrokerConfig()) {
      return new Response(
        JSON.stringify({
          error: 'Easy Broker API no configurada',
          message:
            'EASYBROKER_API_KEY no está configurada en las variables de entorno',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parsear query params
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Construir filtros
    const filters: Parameters<typeof EasyBrokerServiceAPI.getProperties>[0] = {
      page,
      limit,
      search: {},
    };

    // Filtros opcionales
    const statuses = searchParams.getAll('statuses');
    if (statuses.length > 0) {
      filters.search!.statuses = statuses;
    }

    const propertyTypes = searchParams.getAll('property_types');
    if (propertyTypes.length > 0) {
      filters.search!.property_types = propertyTypes;
    }

    const locations = searchParams.getAll('locations');
    if (locations.length > 0) {
      filters.search!.locations = locations;
    }

    const minPrice = searchParams.get('min_price');
    if (minPrice) {
      filters.search!.min_price = parseFloat(minPrice);
    }

    const maxPrice = searchParams.get('max_price');
    if (maxPrice) {
      filters.search!.max_price = parseFloat(maxPrice);
    }

    const minBedrooms = searchParams.get('min_bedrooms');
    if (minBedrooms) {
      filters.search!.min_bedrooms = parseInt(minBedrooms, 10);
    }

    const maxBedrooms = searchParams.get('max_bedrooms');
    if (maxBedrooms) {
      filters.search!.max_bedrooms = parseInt(maxBedrooms, 10);
    }

    const minBathrooms = searchParams.get('min_bathrooms');
    if (minBathrooms) {
      filters.search!.min_bathrooms = parseInt(minBathrooms, 10);
    }

    const maxBathrooms = searchParams.get('max_bathrooms');
    if (maxBathrooms) {
      filters.search!.max_bathrooms = parseInt(maxBathrooms, 10);
    }

    // Obtener propiedades
    console.log(
      '📡 API: Obteniendo propiedades de Easy Broker con filtros:',
      filters
    );
    const result = await EasyBrokerServiceAPI.getProperties(filters);

    if (result.error || !result.data) {
      console.error('❌ API Error:', result.error);
      return new Response(
        JSON.stringify({
          error: result.error?.message || 'Error al obtener propiedades',
          code: result.error?.code,
          details: result.error,
        }),
        {
          status: result.error?.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `✅ API: ${
        result.data.content?.length || 0
      } propiedades obtenidas de Easy Broker`
    );

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('❌ Error en API de propiedades:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
