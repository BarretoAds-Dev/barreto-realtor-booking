import type { APIRoute } from 'astro';
import { supabase } from '../../../core/config/supabase';
import type { Appointment } from '../../../core/types/appointment';

export const prerender = false; // Server-rendered

export const GET: APIRoute = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Intentar hacer JOIN con properties, pero si falla, usar solo appointments
		let query = supabase
			.from('appointments')
			.select('*')
			.order('appointment_date', { ascending: false })
			.order('appointment_time', { ascending: false })
			.range(offset, offset + limit - 1);

		// Intentar hacer JOIN con properties si la relación existe
		try {
			query = supabase
				.from('appointments')
				.select(`
					*,
					properties (
						id,
						title,
						address,
						price,
						property_type,
						bedrooms,
						bathrooms,
						area
					)
				`)
				.order('appointment_date', { ascending: false })
				.order('appointment_time', { ascending: false })
				.range(offset, offset + limit - 1);
		} catch (e) {
			// Si falla, usar solo appointments
			query = supabase
				.from('appointments')
				.select('*')
				.order('appointment_date', { ascending: false })
				.order('appointment_time', { ascending: false })
				.range(offset, offset + limit - 1);
		}

		if (status && status !== 'all') {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) {
			// Si el error es por la relación con properties, intentar sin JOIN
			if (error.message?.includes('relationship') || error.message?.includes('properties')) {
				console.warn('⚠️ Relación con properties no encontrada, usando solo appointments:', error.message);
				const fallbackQuery = supabase
					.from('appointments')
					.select('*')
					.order('appointment_date', { ascending: false })
					.order('appointment_time', { ascending: false })
					.range(offset, offset + limit - 1);

				if (status && status !== 'all') {
					fallbackQuery.eq('status', status);
				}

				const { data: fallbackData, error: fallbackError } = await fallbackQuery;

				if (fallbackError) {
					return new Response(
						JSON.stringify({
							error: 'Error al obtener citas',
							details: fallbackError.message,
						}),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}

				// Si hay property_id, intentar obtener la propiedad manualmente
				const appointmentsWithProperties = await Promise.all(
					(fallbackData || []).map(async (apt: any) => {
						if (apt.property_id) {
							try {
								const { data: propertyData } = await supabase
									.from('properties')
									.select('id, title, address, price, property_type, bedrooms, bathrooms, area')
									.eq('id', apt.property_id)
									.single();

								if (propertyData) {
									apt.properties = propertyData;
								}
							} catch (e) {
								// Ignorar errores al obtener la propiedad
							}
						}
						return apt;
					})
				);

				const formattedAppointments = appointmentsWithProperties.map((apt: any) => ({
					id: apt.id,
					clientName: apt.client_name,
					clientEmail: apt.client_email,
					clientPhone: apt.client_phone,
					propertyId: apt.property_id || null,
					property: apt.properties
						? {
								id: apt.properties.id,
								title: apt.properties.title,
								address: apt.properties.address,
								price: apt.properties.price,
								propertyType: apt.properties.property_type,
								bedrooms: apt.properties.bedrooms,
								bathrooms: apt.properties.bathrooms,
								area: apt.properties.area,
							}
						: apt.resource_details?.property || null,
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
			}

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
		const formattedAppointments = appointments.map((apt: any) => ({
			id: apt.id,
			clientName: apt.client_name,
			clientEmail: apt.client_email,
			clientPhone: apt.client_phone,
			propertyId: apt.property_id || null,
			property: apt.properties
				? {
						id: apt.properties.id,
						title: apt.properties.title,
						address: apt.properties.address,
						price: apt.properties.price,
						propertyType: apt.properties.property_type,
						bedrooms: apt.properties.bedrooms,
						bathrooms: apt.properties.bathrooms,
						area: apt.properties.area,
					}
				: apt.resource_details?.property || null, // Fallback a resource_details si no hay propiedad relacionada
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

