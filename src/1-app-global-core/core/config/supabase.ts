import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
// Service role key para operaciones del servidor (bypass RLS)
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('❌ Missing Supabase environment variables');
	console.error('PUBLIC_SUPABASE_URL:', supabaseUrl || 'NOT SET');
	console.error('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
	throw new Error(
		'Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
	);
}

// Cliente público (sujeto a RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false, // No necesario para formulario público
	},
});

// Cliente del servidor (bypass RLS) - Solo usar en API routes del servidor
export const supabaseAdmin = supabaseServiceRoleKey
	? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		})
	: null;

if (!supabaseServiceRoleKey) {
	console.warn(
		'⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Algunas operaciones del servidor pueden fallar con RLS.'
	);
}

/**
 * Obtiene el cliente admin de Supabase para operaciones del servidor.
 * Lanza un error si no está disponible (requerido para bypass RLS).
 *
 * @throws {Error} Si SUPABASE_SERVICE_ROLE_KEY no está configurada
 * @returns Cliente de Supabase con permisos de service_role
 */
export function getSupabaseAdmin(): ReturnType<typeof createClient<Database>> {
	if (!supabaseAdmin) {
		throw new Error(
			'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
			'Esta operación requiere permisos de servidor para bypass RLS. ' +
			'Por favor, configura SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
		);
	}
	return supabaseAdmin;
}

