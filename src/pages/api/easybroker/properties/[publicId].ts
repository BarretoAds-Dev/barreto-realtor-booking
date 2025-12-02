import { validateEasyBrokerConfig } from '@/1-app-global-core/config';
import { EasyBrokerServiceAPI } from '@/1-app-global-core/services/easybroker.service';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/easybroker/properties/[publicId]
 * Obtiene una propiedad específica de Easy Broker por su public_id
 */
export const GET: APIRoute = async ({ params }) => {
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

    const publicId = params.publicId;

    if (!publicId) {
      return new Response(
        JSON.stringify({
          error: 'publicId es requerido',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtener propiedad
    const result = await EasyBrokerServiceAPI.getProperty(publicId);

    if (result.error || !result.data) {
      return new Response(
        JSON.stringify({
          error: result.error?.message || 'Propiedad no encontrada',
          code: result.error?.code,
        }),
        {
          status: result.error?.status || 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ property: result.data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('❌ Error en API de propiedad:', error);
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
