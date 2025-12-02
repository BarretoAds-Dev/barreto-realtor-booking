import { supabaseAdmin } from '@/1-app-global-core/config';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/appointments/cleanup-test
 * Limpia citas de prueba (citas con emails de prueba o muy recientes)
 * ⚠️ SOLO USAR EN DESARROLLO
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar que estemos en desarrollo
    if (import.meta.env.PROD) {
      return new Response(
        JSON.stringify({
          error: 'Esta función solo está disponible en desarrollo',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      slotId, // Opcional: limpiar solo un slot específico
      emailPattern = 'test', // Patrón para identificar emails de prueba
      daysOld = 1, // Eliminar citas más recientes que X días
    } = body;

    const client = supabaseAdmin;

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Service Role Key no configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construir query base
    let query = client
      .from('appointments')
      .select('id, email, status, slot_id, created_at');

    // Filtrar por slot si se especifica
    if (slotId) {
      query = query.eq('slot_id', slotId);
    }

    const { data: appointments, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: 'Error al obtener citas',
          details: fetchError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar citas de prueba
    const testAppointments =
      appointments?.filter((apt) => {
        // Citas con emails que contengan el patrón
        const isTestEmail = apt.email
          ?.toLowerCase()
          .includes(emailPattern.toLowerCase());

        // Citas muy recientes (últimas X horas)
        const createdAt = new Date(apt.created_at);
        const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const isRecent = hoursAgo < daysOld * 24;

        return isTestEmail || isRecent;
      }) || [];

    if (testAppointments.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No se encontraron citas de prueba para limpiar',
          checked: appointments?.length || 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar citas de prueba
    const idsToDelete = testAppointments.map((apt) => apt.id);
    const { data: deleted, error: deleteError } = await client
      .from('appointments')
      .delete()
      .in('id', idsToDelete)
      .select('id');

    if (deleteError) {
      return new Response(
        JSON.stringify({
          error: 'Error al eliminar citas',
          details: deleteError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar contadores de slots afectados
    const affectedSlotIds = [
      ...new Set(testAppointments.map((apt) => apt.slot_id)),
    ];
    for (const slotIdToUpdate of affectedSlotIds) {
      const { data: activeAppointments } = await client
        .from('appointments')
        .select('id')
        .eq('slot_id', slotIdToUpdate)
        .in('status', ['pending', 'confirmed']);

      const newBookedCount = activeAppointments?.length || 0;

      await client
        .from('availability_slots')
        .update({ booked: newBookedCount })
        .eq('id', slotIdToUpdate);
    }

    return new Response(
      JSON.stringify({
        message: `Se eliminaron ${deleted?.length || 0} citas de prueba`,
        deleted: deleted?.map((apt) => apt.id) || [],
        affectedSlots: affectedSlotIds,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error al limpiar citas de prueba:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
