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
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return new Response(
        JSON.stringify({ error: 'appointmentId y status son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el status sea válido
    const validStatuses = [
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'no-show',
    ];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Status inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener la cita actual para verificar el slot_id
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

    // Preparar los datos de actualización
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Si se confirma, establecer confirmed_at y limpiar cancelled_at
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
      if (currentAppointment.status === 'cancelled') {
        updateData.cancelled_at = null;
      }
    }

    // Si se cancela, establecer cancelled_at y limpiar confirmed_at
    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (currentAppointment.status === 'confirmed') {
        updateData.confirmed_at = null;
      }
    }

    // Actualizar la cita
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar la cita:', updateError);
      const errorMessage = updateError.message || 'Error desconocido';
      const errorCode = updateError.code || 'UNKNOWN';
      const errorDetails = updateError.details || '';
      const errorHint = updateError.hint || '';

      return new Response(
        JSON.stringify({
          error: 'Error al actualizar la cita',
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
        appointment: updatedAppointment,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en update-status:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
