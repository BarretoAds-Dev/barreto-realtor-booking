import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	// Solo proteger rutas del CRM
	if (context.url.pathname.startsWith('/crm/')) {
		// Verificar si hay cookies de sesión de Supabase
		// Supabase almacena la sesión en cookies con diferentes nombres según la configuración
		// Intentamos verificar si existe alguna cookie relacionada con autenticación
		const cookieHeader = context.request.headers.get('cookie') || '';
		
		// Verificar si hay cookies de Supabase (buscar patrones comunes)
		const hasAuthCookie = cookieHeader.includes('sb-') || 
			cookieHeader.includes('auth-token') || 
			cookieHeader.includes('access-token');

		// Si no hay cookie de autenticación, redirigir a login
		// Nota: La verificación real de la sesión se hace en el cliente con Supabase
		if (!hasAuthCookie) {
			return context.redirect('/login', 302);
		}
	}

	// Continuar con la solicitud
	return next();
});

