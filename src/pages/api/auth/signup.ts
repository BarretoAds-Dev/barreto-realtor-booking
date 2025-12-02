import { validatePassword } from '@/1-app-global-core/services';
import type { APIRoute } from 'astro';

export const prerender = false;

interface SignupPayload {
  email: string;
  password: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Crea un usuario en Supabase usando Admin API
 * Requiere SUPABASE_SERVICE_ROLE_KEY para bypass RLS
 */
async function createSupabaseUser(
  email: string,
  password: string,
  user_metadata?: Record<string, unknown>
): Promise<unknown> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const url = `${supabaseUrl}/auth/v1/admin/users`;

  // Construir payload según Supabase Admin API
  const body: Record<string, unknown> = {
    email,
    password,
  };

  if (user_metadata) {
    body.user_metadata = user_metadata;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    throw new Error(`Supabase create user failed: ${res.status} ${text}`);
  }

  return json;
}

/**
 * POST /api/auth/signup
 * Crea un nuevo usuario con validación HIBP de contraseña
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validar método HTTP
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Invalid content type, expected application/json',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parsear payload
    let payload: SignupPayload;
    try {
      payload = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON payload',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar campos requeridos
    if (!payload?.email || !payload?.password) {
      return new Response(
        JSON.stringify({ error: 'Missing email or password' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar contraseña con HIBP
    console.log('🔒 Validando contraseña con HIBP...');
    const passwordValidation = await validatePassword(payload.password);

    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({
          error: passwordValidation.error || 'Invalid password',
          pwned: passwordValidation.pwned || false,
        }),
        {
          status: passwordValidation.pwned ? 400 : 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Crear usuario en Supabase
    console.log('✅ Contraseña validada, creando usuario en Supabase...');
    let created: unknown;

    try {
      created = await createSupabaseUser(
        payload.email,
        payload.password,
        payload.user_metadata
      );
    } catch (error) {
      console.error('❌ Error al crear usuario en Supabase:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Manejar errores específicos de Supabase
      if (errorMessage.includes('already registered')) {
        return new Response(
          JSON.stringify({
            error: 'Este correo electrónico ya está registrado',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to create user',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Usuario creado exitosamente');

    return new Response(
      JSON.stringify({
        ok: true,
        user: created,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Unhandled error in signup:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
