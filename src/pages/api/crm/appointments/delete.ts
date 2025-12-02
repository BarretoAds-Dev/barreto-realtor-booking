import { supabase } from '@/1-app-global-core/config';
import type { APIRoute } from 'astro';

export const prerender = false;

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
    const { appointmentId } = body;

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'appointmentId es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la cita actual para verificar el slot_id antes de eliminar
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('slot_id, status')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      console.error('Error al obtener la cita:', fetchError);
      return new Response(JSON.stringify({ error: 'Cita no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Eliminar la cita
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Error al eliminar la cita:', deleteError);
      const errorMessage = deleteError.message || 'Error desconocido';
      const errorCode = deleteError.code || 'UNKNOWN';
      const errorDetails = deleteError.details || '';
      const errorHint = deleteError.hint || '';

      return new Response(
        JSON.stringify({
          error: 'Error al eliminar la cita',
          message: errorMessage,
          code: errorCode,
          details: errorDetails,
          hint: errorHint,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // El trigger debería actualizar automáticamente el contador booked en availability_slots
    // Pero hacemos un fallback manual para asegurarnos
    if (currentAppointment.slot_id) {
      try {
        const { data: activeAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('slot_id', currentAppointment.slot_id)
          .in('status', ['pending', 'confirmed']);

        const { data: slot } = await supabase
          .from('availability_slots')
          .select('capacity')
          .eq('id', currentAppointment.slot_id)
          .single();

        if (slot) {
          const newBookedCount = Math.min(
            slot.capacity,
            activeAppointments?.length || 0
          );

          await supabase
            .from('availability_slots')
            .update({ booked: newBookedCount })
            .eq('id', currentAppointment.slot_id);
        }
      } catch (fallbackError) {
        console.warn(
          '⚠️ Error en fallback de actualización de contador:',
          fallbackError
        );
        // No fallar la operación si solo falla el fallback
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cita eliminada exitosamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en delete:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
