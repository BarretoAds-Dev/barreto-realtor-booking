import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/easybroker/image-proxy
 * Proxy para imágenes de Easy Broker que evita problemas de CORS
 *
 * Query params:
 * - url: URL de la imagen a obtener (debe estar codificada)
 */
export const GET: APIRoute = async ({ url }) => {
	try {
		const imageUrl = url.searchParams.get('url');

		if (!imageUrl) {
			return new Response('URL de imagen requerida', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		// Decodificar la URL
		const decodedUrl = decodeURIComponent(imageUrl);

		// Validar que sea una URL de Easy Broker
		if (!decodedUrl.includes('easybroker.com') && !decodedUrl.includes('ebimg')) {
			return new Response('URL no válida', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		// Obtener la imagen desde Easy Broker
		const response = await fetch(decodedUrl, {
			headers: {
				'Referer': 'https://www.easybroker.com/',
				'User-Agent': 'Mozilla/5.0 (compatible; EasyBroker-Proxy/1.0)',
			},
		});

		if (!response.ok) {
			return new Response('Error al obtener la imagen', {
				status: response.status,
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		// Obtener el tipo de contenido de la imagen
		const contentType = response.headers.get('Content-Type') || 'image/jpeg';
		const imageBuffer = await response.arrayBuffer();

		// Retornar la imagen con headers apropiados
		return new Response(imageBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		console.error('❌ Error en proxy de imagen:', error);
		return new Response(
			JSON.stringify({
				error: 'Error al obtener la imagen',
				message: error instanceof Error ? error.message : 'Error desconocido',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};

