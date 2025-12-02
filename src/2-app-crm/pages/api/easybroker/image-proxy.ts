import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Proxy para imágenes de EasyBroker
 * Evita errores CORS al cargar imágenes desde dominios externos
 */
export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const imageUrl = url.searchParams.get('url');

		if (!imageUrl) {
			return new Response('URL parameter is required', { status: 400 });
		}

		// Decodificar la URL
		const decodedUrl = decodeURIComponent(imageUrl);

		// Validar que sea una URL de EasyBroker
		const allowedDomains = [
			'easybroker.com',
			'ebimg.com',
			'cloudfront.net', // CDN de EasyBroker
		];

		const isAllowed = allowedDomains.some((domain) =>
			decodedUrl.includes(domain)
		);

		if (!isAllowed) {
			return new Response('Invalid image URL domain', { status: 403 });
		}

		console.log('🖼️  Proxying image:', decodedUrl);

		// Hacer fetch de la imagen
		const response = await fetch(decodedUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; InmoCRM/1.0)',
				Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
				Referer: 'https://www.easybroker.com/',
			},
		});

		if (!response.ok) {
			console.error('❌ Error fetching image:', response.status);
			return new Response('Failed to fetch image', {
				status: response.status,
			});
		}

		// Obtener el contenido de la imagen
		const imageBuffer = await response.arrayBuffer();
		const contentType =
			response.headers.get('content-type') || 'image/jpeg';

		// Retornar la imagen con headers apropiados
		return new Response(imageBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable', // Cache 1 año
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		console.error('❌ Error in image proxy:', error);
		return new Response('Internal server error', { status: 500 });
	}
};

