import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/1-app-global-core/core/config/supabase';

export const prerender = false;

/**
 * GET /api/appointments/check-slot?slotId=xxx
 * Verifica qué citas están ocupando un slot específico
 */
export const GET: APIRoute = async ({ url }) => {
	try {
		const slotId = url.searchParams.get('slotId');

		if (!slotId) {
			return new Response(
				JSON.stringify({ error: 'slotId es requerido' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const client = getSupabaseAdmin();

		// Obtener el slot
		const { data: slot, error: slotError } = await client
			.from('availability_slots')
			.select('id, date, start_time, capacity, booked')
			.eq('id', slotId)
			.single();

		if (slotError || !slot) {
			return new Response(
				JSON.stringify({ error: 'Slot no encontrado', details: slotError?.message }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Obtener todas las citas del slot (incluyendo canceladas para referencia)
		const { data: allAppointments, error: appointmentsError } = await client
			.from('appointments')
			.select('id, status, email, name, phone, created_at, cancelled_at')
			.eq('slot_id', slotId)
			.order('created_at', { ascending: false });

		if (appointmentsError) {
			return new Response(
				JSON.stringify({ error: 'Error al obtener citas', details: appointmentsError.message }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Separar citas activas y canceladas
		const activeAppointments = allAppointments?.filter(apt =>
			apt.status === 'pending' || apt.status === 'confirmed'
		) || [];
		const cancelledAppointments = allAppointments?.filter(apt =>
			apt.status === 'cancelled'
		) || [];

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
					available: activeAppointments.length < slot.capacity,
					remaining: Math.max(0, slot.capacity - activeAppointments.length),
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

