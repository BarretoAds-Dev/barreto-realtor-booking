import { getSupabaseAdmin } from '@/1-app-global-core/config';
import type { Database } from '@/1-app-global-core/types/database';
import type { APIRoute } from 'astro';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

export const prerender = false;

/**
 * POST /api/properties/sync-easybroker
 * Sincroniza una propiedad de Easy Broker con Supabase
 * Busca si existe por título y dirección, si no existe la crea
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

    if (!body.title || !body.address) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: title, address',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Usar cliente admin obligatoriamente para bypass RLS en operaciones del servidor
    const client = getSupabaseAdmin();

    // Buscar si ya existe una propiedad con el mismo título y dirección
    const { data: existingProperty, error: searchError } = await client
      .from('properties')
      .select('id')
      .eq('title', body.title)
      .eq('address', body.address)
      .eq('status', 'active')
      .single();

    if (existingProperty && !searchError) {
      // La propiedad ya existe, retornar su ID
      return new Response(
        JSON.stringify({
          success: true,
          property: existingProperty,
          created: false,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Si no existe, crear la propiedad
    const propertyData: PropertyInsert = {
      title: body.title,
      address: body.address,
      price: body.price || 0,
      property_type: body.property_type || 'casa',
      bedrooms: body.bedrooms || null,
      bathrooms: body.bathrooms || null,
      area: body.area || null,
      features: body.public_id
        ? { easybroker_public_id: body.public_id }
        : null,
      description: body.description || null,
      status: 'active',
    };

    const { data: newProperty, error: insertError } = await client
      .from('properties')
      .insert(propertyData as any)
      .select()
      .single();

    if (insertError) {
      // Si la tabla no existe, informar al usuario
      if (
        insertError.code === 'PGRST205' ||
        insertError.message?.includes('Could not find the table')
      ) {
        console.error('❌ Tabla properties no existe en Supabase');
        return new Response(
          JSON.stringify({
            error: 'La tabla de propiedades no existe en la base de datos',
            details:
              'Por favor, ejecuta el script SQL en Supabase para crear la tabla.',
            code: 'TABLE_NOT_FOUND',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error al crear propiedad:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Error al crear la propiedad',
          details: insertError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: newProperty,
        created: true,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error en API de sincronización de propiedades:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
