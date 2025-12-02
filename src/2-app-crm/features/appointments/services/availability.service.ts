import { supabase } from '@/1-app-global-core/core/config/supabase';
import type { AvailabilitySlot } from '@/1-app-global-core/core/types';

/**
 * Servicio para gestionar disponibilidad de slots
 */
export class AvailabilityService {
	/**
	 * Obtiene el día de la semana en español
	 */
	static getDayOfWeek(date: Date): string {
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

	/**
	 * Obtiene slots de disponibilidad agrupados por fecha
	 */
	static async getAvailabilitySlots(
		startDate: string,
		endDate: string | null,
		agentId: string = '00000000-0000-0000-0000-000000000001'
	): Promise<{
		slots: Array<{
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
		}>;
		error: Error | null;
	}> {
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

			const { data, error: queryError } = await query;

			if (queryError) {
				return { slots: [], error: queryError };
			}

			const typedSlots = (data || []) as AvailabilitySlot[];

			// Agrupar por fecha
			const grouped = typedSlots.reduce(
				(acc, slot) => {
					if (!slot) return acc;
					const dateKey = slot.date;
					if (!acc[dateKey]) {
						acc[dateKey] = {
							date: dateKey,
							dayOfWeek: this.getDayOfWeek(new Date(dateKey)),
							slots: [],
							metadata: {
								notes: 'Horario generado automáticamente',
								specialHours: false,
							},
						};
					}
					
					const isAvailable = slot.booked < slot.capacity;
					const isEnabled = slot.enabled ?? true;
					
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

			const result = Object.values(grouped);

			return { slots: result, error: null };
		} catch (error) {
			return {
				slots: [],
				error: error instanceof Error ? error : new Error('Error desconocido'),
			};
		}
	}
}

