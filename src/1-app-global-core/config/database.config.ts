/**
 * Configuración de Base de Datos (Supabase)
 *
 * Proporciona clientes de Supabase para diferentes casos de uso:
 * - Cliente público (sujeto a RLS)
 * - Cliente admin (bypass RLS para operaciones del servidor)
 * - Cliente con autenticación (persistencia de sesión)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// ============================================================================
// Variables de Entorno
// ============================================================================

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// Validación de Variables de Entorno
// ============================================================================

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('PUBLIC_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error(
    'PUBLIC_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? 'SET' : 'NOT SET'
  );
  throw new Error(
    'Missing Supabase environment variables. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
  );
}

if (!supabaseServiceRoleKey) {
  console.warn(
    '⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Algunas operaciones del servidor pueden fallar con RLS.'
  );
}

// ============================================================================
// Cliente Público (RLS habilitado)
// ============================================================================

/**
 * Cliente público de Supabase
 * Sujeto a Row Level Security (RLS)
 * Usar para operaciones del cliente que respetan las políticas de seguridad
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No necesario para formulario público
  },
});

// ============================================================================
// Cliente Admin (Bypass RLS)
// ============================================================================

/**
 * Cliente del servidor con permisos de service_role
 * Bypass RLS - Solo usar en API routes del servidor
 *
 * @throws {Error} Si SUPABASE_SERVICE_ROLE_KEY no está configurada
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

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

// ============================================================================
// Cliente con Autenticación (Persistencia de Sesión)
// ============================================================================

/**
 * Cliente de Supabase con autenticación habilitada
 * Persistencia de sesión activada para aplicaciones con login
 * Usar en componentes del cliente que requieren autenticación
 */
export const supabaseAuth = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
