import { getSupabaseAdmin, supabase } from '@/1-app-global-core/config';
import type { Database } from '@/1-app-global-core/types/database';
import type { APIRoute } from 'astro';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

export const prerender = false;

/**
 * POST /api/properties
 * Crea una nueva propiedad en Supabase
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Validar campos requeridos
    if (!body.title || !body.address || !body.price) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: title, address, price',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Usar cliente admin obligatoriamente para bypass RLS en operaciones del servidor
    const client = getSupabaseAdmin();

    // Insertar propiedad en Supabase
    const propertyData = {
      title: body.title,
      address: body.address,
      price: body.price,
      property_type: body.property_type || 'casa',
      bedrooms: body.bedrooms || null,
      bathrooms: body.bathrooms || null,
      area: body.area || null,
      features: body.features || null,
      description: body.description || null,
      status: 'active',
    } as PropertyInsert;

    const { data, error } = await client
      .from('properties')
      .insert(propertyData as any)
      .select()
      .single();

    if (error) {
      // Si la tabla no existe, informar al usuario
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table')
      ) {
        console.error('❌ Tabla properties no existe en Supabase');
        return new Response(
          JSON.stringify({
            error: 'La tabla de propiedades no existe en la base de datos',
            details:
              'Por favor, ejecuta el script SQL en Supabase para crear la tabla. Ver archivo PROPERTIES_TABLE_SETUP.sql',
            code: 'TABLE_NOT_FOUND',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error al crear propiedad:', error);
      return new Response(
        JSON.stringify({
          error: 'Error al crear la propiedad',
          details: error.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, property: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en API de propiedades:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/properties
 * Obtiene todas las propiedades de Supabase
 */
export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla no existe, retornar array vacío en lugar de error
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table')
      ) {
        console.warn(
          '⚠️ Tabla properties no existe en Supabase. Retornando array vacío.'
        );
        return new Response(JSON.stringify({ properties: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Error al obtener propiedades:', error);
      return new Response(
        JSON.stringify({
          error: 'Error al obtener propiedades',
          details: error.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ properties: data || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en API de propiedades:', error);
    // Si hay un error, retornar array vacío en lugar de fallar
    return new Response(JSON.stringify({ properties: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
