import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';

/**
 * Middleware de autenticación
 * Permite que todas las rutas se carguen
 * La verificación de autenticación se hace en el cliente (componentes)
 * Esto permite que la redirección después del login funcione correctamente
 */
const authMiddleware: MiddlewareHandler = async (context, next) => {
	// Permitir que todas las rutas se carguen
	// La verificación de autenticación se hace en el cliente
	// Esto permite que la redirección después del login funcione correctamente
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
