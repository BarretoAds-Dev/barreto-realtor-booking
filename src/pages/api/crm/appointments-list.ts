import type { APIRoute } from 'astro';
import { supabase } from '../../../core/config/supabase';
import type { Appointment } from '../../../core/types/database';

export const prerender = false; // Server-rendered

export const GET: APIRoute = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let query = supabase
			.from('appointments')
			.select('*')
			.order('appointment_date', { ascending: false })
			.order('appointment_time', { ascending: false })
			.range(offset, offset + limit - 1);

		if (status && status !== 'all') {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) {
			return new Response(
				JSON.stringify({
					error: 'Error al obtener citas',
					details: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const appointments = (data || []) as Appointment[];

		// Formatear datos para el frontend
		const formattedAppointments = appointments.map((apt) => ({
			id: apt.id,
			clientName: apt.client_name,
			clientEmail: apt.client_email,
			clientPhone: apt.client_phone,
			property: apt.resource_details?.property || null, // Si hay propiedad asociada
			date: apt.appointment_date,
			time: apt.appointment_time,
			status: apt.status,
			notes: apt.notes,
			operationType: apt.operation_type,
			budgetRange: apt.budget_range,
			createdAt: apt.created_at,
		}));

		return new Response(JSON.stringify(formattedAppointments), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
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

