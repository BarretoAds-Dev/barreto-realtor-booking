import { getSupabaseAdmin } from '@/1-app-global-core/config';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/appointments/debug-slots?date=2025-12-06&time=10:00
 * Endpoint de diagnóstico para verificar qué slots existen en la base de datos
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get('date');
    const time = url.searchParams.get('time');
    const agentId =
      url.searchParams.get('agentId') || '00000000-0000-0000-0000-000000000001';

    const client = getSupabaseAdmin();

    // Obtener todos los slots para la fecha (sin filtrar por hora primero)
    let query = client
      .from('availability_slots')
      .select('*')
      .eq('date', date || '')
      .eq('enabled', true)
      .eq('agent_id', agentId)
      .order('start_time', { ascending: true });

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      return new Response(
        JSON.stringify({
          error: 'Error al consultar slots',
          details: slotsError.message,
          code: slotsError.code,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si se proporciona una hora, filtrar manualmente
    let matchingSlots = slots || [];
    if (time) {
      const normalizedTime = time.includes(':')
        ? time.split(':').length === 2
          ? `${time}:00`
          : time
        : time;
      const timeShort = normalizedTime.substring(0, 5);

      matchingSlots = (slots || []).filter((slot) => {
        const slotTime = slot.start_time;
        const slotTimeShort = slotTime.substring(0, 5);
        return slotTime === normalizedTime || slotTimeShort === timeShort;
      });
    }

    // Obtener citas activas para cada slot
    const slotsWithAppointments = await Promise.all(
      (slots || []).map(async (slot) => {
        const { data: appointments, error: aptError } = await client
          .from('appointments')
          .select('id, status, email, name, created_at')
          .eq('slot_id', slot.id)
          .in('status', ['pending', 'confirmed']);

        return {
          ...slot,
          activeAppointments: appointments || [],
          activeCount: appointments?.length || 0,
          appointmentsError: aptError?.message,
        };
      })
    );

    return new Response(
      JSON.stringify({
        query: {
          date: date || 'no especificada',
          time: time || 'no especificada',
          agentId,
        },
        summary: {
          totalSlots: slots?.length || 0,
          matchingSlots: matchingSlots.length,
          enabledSlots: (slots || []).filter((s) => s.enabled).length,
        },
        allSlots:
          slots?.map((s) => ({
            id: s.id,
            date: s.date,
            start_time: s.start_time,
            enabled: s.enabled,
            agent_id: s.agent_id,
            capacity: s.capacity,
            booked: s.booked,
            available: s.booked < s.capacity,
          })) || [],
        matchingSlots: matchingSlots.map((s) => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          enabled: s.enabled,
          agent_id: s.agent_id,
          capacity: s.capacity,
          booked: s.booked,
          available: s.booked < s.capacity,
        })),
        slotsWithAppointments: slotsWithAppointments.map((s) => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          capacity: s.capacity,
          booked: s.booked,
          activeCount: s.activeCount,
          activeAppointments: s.activeAppointments,
          available: s.activeCount < s.capacity,
        })),
        diagnostics: {
          agentIdMatch: (slots || []).every((s) => s.agent_id === agentId),
          dateFormat: date
            ? date.match(/^\d{4}-\d{2}-\d{2}$/)
              ? 'correcto'
              : 'incorrecto'
            : 'no especificada',
          timeFormat: time
            ? time.match(/^\d{2}:\d{2}/)
              ? 'correcto'
              : 'incorrecto'
            : 'no especificada',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error en debug-slots:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
