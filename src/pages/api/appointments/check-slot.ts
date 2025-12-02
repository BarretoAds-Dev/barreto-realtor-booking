import { getSupabaseAdmin } from '@/1-app-global-core/config';
import { AppointmentsService } from '@/1-app-global-core/services';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/appointments/check-slot?slotId=xxx
 * Verifica qué citas están ocupando un slot específico
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const slotId = url.searchParams.get('slotId');

    if (!slotId) {
      return new Response(JSON.stringify({ error: 'slotId es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = getSupabaseAdmin();

    // ✅ Usar servicio unificado para verificar disponibilidad
    const availability = await AppointmentsService.checkSlotAvailability(
      slotId
    );

    if (availability.error) {
      return new Response(
        JSON.stringify({
          error: 'Slot no encontrado',
          details: availability.error.message,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener información adicional del slot
    const { data: slot, error: slotError } = await client
      .from('availability_slots')
      .select('id, date, start_time, capacity, booked')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({
          error: 'Slot no encontrado',
          details: slotError?.message,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener todas las citas del slot para referencia
    const { data: allAppointments } = await client
      .from('appointments')
      .select(
        'id, status, client_email, client_name, client_phone, created_at, cancelled_at'
      )
      .eq('slot_id', slotId)
      .order('created_at', { ascending: false });

    const activeAppointments =
      allAppointments?.filter(
        (apt) => apt.status === 'pending' || apt.status === 'confirmed'
      ) || [];
    const cancelledAppointments =
      allAppointments?.filter((apt) => apt.status === 'cancelled') || [];

    return new Response(
      JSON.stringify({
        slot: {
          id: slot.id,
          date: slot.date,
          time: slot.start_time,
          capacity: slot.capacity,
          booked: slot.booked,
        },
        appointments: {
          active: activeAppointments,
          cancelled: cancelledAppointments,
          total: allAppointments?.length || 0,
          activeCount: activeAppointments.length,
        },
        availability: {
          available: availability.available,
          remaining: Math.max(
            0,
            availability.capacity - availability.bookedCount
          ),
          bookedCount: availability.bookedCount,
          capacity: availability.capacity,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error al verificar slot:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
