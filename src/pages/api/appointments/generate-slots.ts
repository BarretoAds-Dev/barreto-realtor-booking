import { supabaseAdmin } from '@/1-app-global-core/config';
import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/appointments/generate-slots
 * Genera slots automáticamente para los próximos N días
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
      days = 7, // Días a generar desde hoy
      agentId = '00000000-0000-0000-0000-000000000001',
      capacity = 1, // Capacidad por slot (solo 1 cita por horario)
      startHour = 9, // Hora de inicio (9 AM)
      endHour = 16, // Hora de fin (4 PM)
      slotDuration = 45, // Duración en minutos
      skipLunch = true, // Saltar hora de comida (12:00-14:00)
    } = body;

    const client = supabaseAdmin;

    if (!client) {
      return new Response(
        JSON.stringify({ error: 'Service Role Key no configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const slots: Array<{
      agent_id: string;
      date: string;
      start_time: string;
      end_time: string;
      capacity: number;
      booked: number;
      enabled: boolean;
    }> = [];

    // Generar slots para cada día
    for (let dayOffset = 1; dayOffset <= days; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Generar slots para cada hora
      for (let hour = startHour; hour <= endHour; hour++) {
        // Saltar hora de comida si está configurado
        if (skipLunch && hour === 12) {
          continue;
        }

        const startTime = `${String(hour).padStart(2, '0')}:00:00`;
        const endMinutes = hour * 60 + slotDuration;
        const endHourCalc = Math.floor(endMinutes / 60);
        const endMinCalc = endMinutes % 60;
        const endTime = `${String(endHourCalc).padStart(2, '0')}:${String(
          endMinCalc
        ).padStart(2, '0')}:00`;

        slots.push({
          agent_id: agentId,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          capacity,
          booked: 0,
          enabled: true,
        });
      }
    }

    // Verificar si ya existen slots para estas fechas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data: existingSlots, error: checkError } = await client
      .from('availability_slots')
      .select('id, date, start_time')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .eq('agent_id', agentId);

    if (checkError) {
      return new Response(
        JSON.stringify({
          error: 'Error al verificar slots existentes',
          details: checkError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar slots que ya existen
    const typedExistingSlots = (existingSlots || []) as Array<{
      id: string;
      date: string;
      start_time: string;
    }>;

    const existingKeys = new Set(
      typedExistingSlots.map((s) => `${s.date}_${s.start_time}`)
    );
    const newSlots = slots.filter(
      (s) => !existingKeys.has(`${s.date}_${s.start_time}`)
    );

    if (newSlots.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'Todos los slots para estas fechas ya existen',
          existing: typedExistingSlots.length,
          requested: slots.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insertar nuevos slots
    const { data: inserted, error: insertError } = await client
      .from('availability_slots')
      // @ts-ignore - Supabase types inference issue, pero el insert funciona correctamente
      .insert(newSlots)
      .select('id, date, start_time');

    if (insertError) {
      return new Response(
        JSON.stringify({
          error: 'Error al insertar slots',
          details: insertError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedInserted = (inserted || []) as Array<{
      id: string;
      date: string;
      start_time: string;
    }>;

    return new Response(
      JSON.stringify({
        message: `Se generaron ${typedInserted.length} slots nuevos`,
        generated: typedInserted.length,
        skipped: slots.length - newSlots.length,
        existing: typedExistingSlots.length,
        slots: typedInserted.map((s) => ({
          date: s.date,
          time: s.start_time,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error al generar slots:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
