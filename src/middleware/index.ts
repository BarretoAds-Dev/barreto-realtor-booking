import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';

/**
 * Middleware de autenticación
 * Verifica si el usuario está autenticado para rutas protegidas
 */
const authMiddleware: MiddlewareHandler = async (context, next) => {
	const { url, cookies } = context;
	const pathname = url.pathname;

	// Rutas públicas que no requieren autenticación
	const publicRoutes = ['/login', '/citas', '/api/appointments', '/api/appointments/available'];
	const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

	// Rutas protegidas (requieren autenticación)
	const protectedRoutes = ['/crm', '/api/crm'];
	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

	// Si es una ruta protegida, verificar autenticación
	if (isProtectedRoute && !isPublicRoute) {
		// Verificar token de sesión en cookies
		const sessionToken = cookies.get('sb-access-token')?.value;
		
		if (!sessionToken) {
			// Redirigir al login si no hay sesión
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/login',
				},
			});
		}
	}

	return next();
};

/**
 * Middleware de CORS
 * Configura headers CORS para API routes
 */
const corsMiddleware: MiddlewareHandler = async (context, next) => {
	const { url } = context;
	const isApiRoute = url.pathname.startsWith('/api');

	if (isApiRoute) {
		const response = await next();
		
		// Agregar headers CORS
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		
		return response;
	}

	return next();
};

/**
 * Middleware principal
 * Ejecuta middlewares en secuencia
 */
export const onRequest = defineMiddleware(async (context, next) => {
	// Ejecutar CORS primero
	const corsResponse = await corsMiddleware(context, async () => {
		// Luego ejecutar autenticación
		const authResponse = await authMiddleware(context, next);
		return authResponse;
	});

	return corsResponse;
});
