import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';
import { supabaseAuth } from '../core/config/auth';

/**
 * Middleware de autenticación
 * Verifica si el usuario está autenticado para rutas protegidas
 */
const authMiddleware: MiddlewareHandler = async (context, next) => {
	const { url, request } = context;
	const pathname = url.pathname;

	// Rutas públicas que no requieren autenticación
	const publicRoutes = ['/login', '/citas', '/api/appointments', '/api/appointments/available', '/api/auth'];
	const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

	// Rutas protegidas (requieren autenticación)
	const protectedRoutes = ['/crm', '/api/crm'];
	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

	// Si es una ruta protegida, verificar autenticación
	if (isProtectedRoute && !isPublicRoute) {
		try {
			// Obtener el token del header Authorization o cookies
			const authHeader = request.headers.get('Authorization');
			const cookies = request.headers.get('Cookie') || '';
			
			// Intentar obtener sesión de Supabase
			const { data: { session }, error } = await supabaseAuth.auth.getSession();
			
			if (error || !session) {
				// Redirigir al login si no hay sesión válida
				if (pathname.startsWith('/crm')) {
					return new Response(null, {
						status: 302,
						headers: {
							Location: '/login',
						},
					});
				}
				
				// Para API routes, retornar error 401
				return new Response(
					JSON.stringify({ error: 'No autenticado' }),
					{
						status: 401,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
		} catch (error) {
			console.error('Error en middleware de autenticación:', error);
			// En caso de error, redirigir al login
			if (pathname.startsWith('/crm')) {
				return new Response(null, {
					status: 302,
					headers: {
						Location: '/login',
					},
				});
			}
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
	const { url } = context;
	
	// Para rutas de login, permitir acceso sin verificación
	if (url.pathname === '/login') {
		return next();
	}
	
	// Ejecutar autenticación primero para rutas protegidas
	const authResponse = await authMiddleware(context, async () => {
		// Luego ejecutar CORS para API routes
		return await corsMiddleware(context, next);
	});

	return authResponse;
});
