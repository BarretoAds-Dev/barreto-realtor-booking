import type { APIRoute } from 'astro';
import { supabase, type AvailabilitySlot } from '../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
	const startDate =
		url.searchParams.get('start') || new Date().toISOString().split('T')[0];
	const endDate = url.searchParams.get('end');
	const agentId =
		url.searchParams.get('agent_id') ||
		'00000000-0000-0000-0000-000000000001'; // Agente por defecto

	try {
		let query = supabase
			.from('availability_slots')
			.select('*')
			.eq('enabled', true)
			.eq('agent_id', agentId)
			.gte('date', startDate)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true });

		if (endDate) {
			query = query.lte('date', endDate);
		}

		const { data, error } = await query;

		if (error) {
			return new Response(
				JSON.stringify({ error: error.message }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Type assertion para los slots
		const typedSlots = (data || []) as AvailabilitySlot[];

		// Log temporal para debugging (solo slots del 1 de diciembre)
		if (typedSlots.some(s => s.date === '2025-12-01')) {
			const dec1Slots = typedSlots.filter(s => s.date === '2025-12-01');
			console.log('📅 Slots del 1 de diciembre:', dec1Slots.map(s => ({
				time: s.start_time,
				booked: s.booked,
				capacity: s.capacity,
				available: s.booked < s.capacity
			})));
		}

		// Agrupar por fecha y formatear para el componente
		const grouped = typedSlots.reduce(
			(acc, slot) => {
				if (!slot) return acc;
				const dateKey = slot.date;
				if (!acc[dateKey]) {
					acc[dateKey] = {
						date: dateKey,
						dayOfWeek: getDayOfWeek(new Date(dateKey)),
						slots: [],
						metadata: {
							notes: 'Horario generado automáticamente',
							specialHours: false,
						},
					};
				}
				// Agregar TODOS los slots con su estado (disponibles, ocupados y deshabilitados)
				const isAvailable = slot.booked < slot.capacity;
				const isEnabled = slot.enabled ?? true; // Por defecto enabled si no está definido
				
				acc[dateKey].slots.push({
					time: slot.start_time,
					available: isAvailable && isEnabled,
					capacity: slot.capacity,
					booked: slot.booked,
					enabled: isEnabled,
				});
				return acc;
			},
			{} as Record<
				string,
				{
					date: string;
					dayOfWeek: string;
					slots: Array<{
						time: string;
						available: boolean;
						capacity: number;
						booked: number;
						enabled?: boolean;
					}>;
					metadata: {
						notes: string;
						specialHours: boolean;
					};
				}
			>
		);

		// Incluir todos los días (aunque no tengan slots disponibles, para mostrar los ocupados)
		const result = Object.values(grouped);

		return new Response(JSON.stringify(result), {
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

// Helper para obtener día de la semana
function getDayOfWeek(date: Date): string {
	const days = [
		'sunday',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
	];
	return days[date.getDay()];
}

