import { supabase } from '../../../core/config/supabase';
import type { AppointmentInsert, AvailabilitySlot } from '../../../core/types';
import type { AppointmentFormData } from '../schemas/appointment.schema';

/**
 * Servicio para gestionar citas
 */
export class AppointmentsService {
	/**
	 * Normaliza el formato de hora para buscar en la DB
	 * Convierte "10:00" a "10:00:00" para coincidir con formato TIME
	 */
	static normalizeTime(time: string): string {
		if (!time.includes(':')) return time;

		const parts = time.split(':');
		if (parts.length === 2) {
			return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
		} else if (parts.length >= 3) {
			return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
		}
		return time;
	}

	/**
	 * Busca un slot disponible para la fecha y hora especificadas
	 */
	static async findAvailableSlot(
		date: string,
		time: string,
		agentId?: string
	): Promise<{ slot: AvailabilitySlot | null; error: Error | null }> {
		const normalizedTime = this.normalizeTime(time);
		const defaultAgentId = '00000000-0000-0000-0000-000000000001';

		try {
			const { data: slots, error: slotError } = await supabase
				.from('availability_slots')
				.select('*')
				.eq('date', date)
				.eq('enabled', true)
				.eq('agent_id', agentId || defaultAgentId)
				.limit(10);

			if (slotError) {
				return { slot: null, error: slotError };
			}

			const typedSlots = (slots || []) as AvailabilitySlot[];

			// Filtrar por hora manualmente para manejar diferentes formatos
			const matchingSlots = typedSlots.filter((slot) => {
				if (!slot) return false;
				const slotTime = slot.start_time;
				const slotTimeShort = slotTime.substring(0, 5);
				const normalizedTimeShort = normalizedTime.substring(0, 5);
				return slotTime === normalizedTime || slotTimeShort === normalizedTimeShort;
			});

			if (matchingSlots.length === 0) {
				return { slot: null, error: new Error('Slot no encontrado o no disponible') };
			}

			return { slot: matchingSlots[0], error: null };
		} catch (error) {
			return {
				slot: null,
				error: error instanceof Error ? error : new Error('Error desconocido al buscar slot'),
			};
		}
	}

	/**
	 * Verifica la disponibilidad real de un slot contando citas activas
	 */
	static async checkSlotAvailability(slotId: string): Promise<{
		available: boolean;
		bookedCount: number;
		capacity: number;
		error: Error | null;
	}> {
		try {
			// Obtener el slot con su capacidad
			const { data: slot, error: slotError } = await supabase
				.from('availability_slots')
				.select('capacity, booked')
				.eq('id', slotId)
				.single();

			if (slotError || !slot) {
				return {
					available: false,
					bookedCount: 0,
					capacity: 0,
					error: slotError || new Error('Slot no encontrado'),
				};
			}

			// Contar citas activas reales
			const { data: activeAppointments, error: countError } = await supabase
				.from('appointments')
				.select('id')
				.eq('slot_id', slotId)
				.in('status', ['pending', 'confirmed']);

			if (countError) {
				return {
					available: false,
					bookedCount: slot.booked,
					capacity: slot.capacity,
					error: countError,
				};
			}

			const actualBookedCount = activeAppointments?.length || 0;
			const available = actualBookedCount < slot.capacity;

			return {
				available,
				bookedCount: actualBookedCount,
				capacity: slot.capacity,
				error: null,
			};
		} catch (error) {
			return {
				available: false,
				bookedCount: 0,
				capacity: 0,
				error: error instanceof Error ? error : new Error('Error desconocido'),
			};
		}
	}

	/**
	 * Crea una nueva cita
	 */
	static async createAppointment(
		formData: AppointmentFormData,
		slot: AvailabilitySlot
	): Promise<{ appointment: any | null; error: Error | null }> {
		const normalizedTime = this.normalizeTime(formData.time);

		const appointmentData: AppointmentInsert = {
			slot_id: slot.id,
			agent_id: slot.agent_id,
			property_id: formData.propertyId || null,
			client_name: formData.name,
			client_email: formData.email.toLowerCase(),
			client_phone: formData.phone || null,
			operation_type: formData.operationType,
			budget_range:
				formData.operationType === 'rentar'
					? ('budgetRentar' in formData ? formData.budgetRentar : '')
					: ('budgetComprar' in formData ? formData.budgetComprar : ''),
			company: formData.operationType === 'rentar' && 'company' in formData ? formData.company : null,
			resource_type:
				formData.operationType === 'comprar' && 'resourceType' in formData ? formData.resourceType : null,
			resource_details:
				formData.operationType === 'comprar'
					? {
							banco: (formData as any).banco || null,
							creditoPreaprobado: (formData as any).creditoPreaprobado || null,
							modalidadInfonavit: (formData as any).modalidadInfonavit || null,
							numeroTrabajadorInfonavit: (formData as any).numeroTrabajadorInfonavit || null,
							modalidadFovissste: (formData as any).modalidadFovissste || null,
							numeroTrabajadorFovissste: (formData as any).numeroTrabajadorFovissste || null,
						}
					: null,
			appointment_date: formData.date,
			appointment_time: normalizedTime,
			duration_minutes: 45,
			notes: formData.notes || null,
			status: 'pending',
			confirmed_at: null,
			cancelled_at: null,
		};

		try {
			const { data: appointment, error: insertError } = await supabase
				.from('appointments')
				.insert(appointmentData as any)
				.select()
				.single();

			if (insertError || !appointment) {
				return {
					appointment: null,
					error: insertError || new Error('No se pudo crear la cita'),
				};
			}

			// Actualizar contador manualmente como fallback
			await this.updateSlotBookedCount(slot.id);

			return { appointment, error: null };
		} catch (error) {
			return {
				appointment: null,
				error: error instanceof Error ? error : new Error('Error desconocido al crear cita'),
			};
		}
	}

	/**
	 * Actualiza el contador de slots reservados (fallback si el trigger no funciona)
	 */
	static async updateSlotBookedCount(slotId: string): Promise<void> {
		try {
			const { data: activeAppointments } = await supabase
				.from('appointments')
				.select('id')
				.eq('slot_id', slotId)
				.in('status', ['pending', 'confirmed']);

			const { data: slot } = await supabase
				.from('availability_slots')
				.select('capacity')
				.eq('id', slotId)
				.single();

			if (slot) {
				const newBookedCount = Math.min(slot.capacity, activeAppointments?.length || 0);
				await supabase
					.from('availability_slots')
					.update({ booked: newBookedCount })
					.eq('id', slotId);
			}
		} catch (error) {
			console.warn('⚠️ Error al actualizar contador de slot:', error);
		}
	}
}

