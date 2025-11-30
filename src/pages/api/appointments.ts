import type { APIRoute } from 'astro';
import { supabase, type AvailabilitySlot, type AppointmentInsert } from '../../lib/supabase';
import { validateAppointment } from '../../schemas/appointmentSchema';

// Marcar como server-rendered para permitir POST requests
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		// Verificar que el request tenga contenido
		const contentType = request.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return new Response(
				JSON.stringify({ error: 'Content-Type debe ser application/json' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		let body;
		try {
			body = await request.json();
		} catch (jsonError) {
			console.error('❌ Error al parsear JSON:', jsonError);
			return new Response(
				JSON.stringify({ 
					error: 'Body inválido o vacío', 
					details: jsonError instanceof Error ? jsonError.message : 'Unknown error'
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		console.log('📥 Request recibido:', { 
			date: body.date, 
			time: body.time, 
			operationType: body.operationType,
			hasName: !!body.name,
			hasEmail: !!body.email
		});

		// Validar con Zod
		const validation = validateAppointment(body);
		if (!validation.success || !validation.data) {
			console.error('❌ Validación fallida:', validation.errors);
			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					issues: validation.errors,
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const data = validation.data;
		console.log('✅ Datos validados:', { date: data.date, time: data.time });

		// Normalizar formato de hora para buscar en la DB
		// Los slots en Supabase están en formato TIME (HH:MM:SS)
		// Aceptamos formatos: "10:00" o "10:00:00"
		let normalizedTime = data.time;
		if (normalizedTime.includes(':')) {
			const parts = normalizedTime.split(':');
			if (parts.length === 2) {
				// Si viene como "10:00", convertir a "10:00:00" para coincidir con TIME
				normalizedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
			} else if (parts.length >= 3) {
				// Si viene como "10:00:00", mantenerlo
				normalizedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
			}
		}
		console.log('🕐 Hora recibida:', data.time, '→ Hora normalizada para DB:', normalizedTime);

		// Buscar slot disponible para la fecha y hora
		// Usar ilike para comparación flexible de TIME
		const { data: slots, error: slotError } = await supabase
			.from('availability_slots')
			.select('*')
			.eq('date', data.date)
			.eq('enabled', true)
			.limit(10); // Obtener más slots para comparar

		// Type assertion para los slots
		const typedSlots = (slots || []) as AvailabilitySlot[];

		// Filtrar por hora manualmente para manejar diferentes formatos
		const matchingSlots = typedSlots.filter((slot) => {
			if (!slot) return false;
			const slotTime = slot.start_time;
			// Comparar sin segundos si es necesario
			const slotTimeShort = slotTime.substring(0, 5); // "10:00:00" -> "10:00"
			const normalizedTimeShort = normalizedTime.substring(0, 5); // "10:00:00" -> "10:00"
			return slotTime === normalizedTime || slotTimeShort === normalizedTimeShort;
		});

		console.log('🔍 Búsqueda de slot:', { 
			totalSlotsFound: typedSlots.length,
			matchingSlots: matchingSlots.length,
			error: slotError?.message,
			query: { date: data.date, time: normalizedTime },
			sampleSlots: typedSlots.slice(0, 3).map(s => ({ time: s.start_time, enabled: s.enabled }))
		});

		if (slotError) {
			console.error('❌ Error al buscar slot:', slotError);
			return new Response(
				JSON.stringify({
					error: 'Error al buscar disponibilidad',
					details: slotError.message,
				}),
				{ status: 500 }
			);
		}

		if (matchingSlots.length === 0) {
			console.warn('⚠️ Slot no encontrado para:', { 
				date: data.date, 
				time: normalizedTime,
				availableSlots: typedSlots.map(s => s.start_time)
			});
			return new Response(
				JSON.stringify({
					error: 'Slot no encontrado o no disponible',
					details: `No se encontró un slot disponible para ${data.date} a las ${normalizedTime}`,
					availableTimes: typedSlots.map(s => s.start_time),
				}),
				{ status: 404 }
			);
		}

		const slot = matchingSlots[0];

		// Verificar disponibilidad - doble verificación para prevenir condiciones de carrera
		// Primero verificar el contador cached
		if (slot.booked >= slot.capacity) {
			console.warn('⚠️ Slot marcado como completo según contador:', {
				slotId: slot.id,
				booked: slot.booked,
				capacity: slot.capacity
			});
			return new Response(
				JSON.stringify({
					error: 'Slot completo. Por favor selecciona otro horario.',
				}),
				{ status: 409 }
			);
		}

		// Verificación adicional: contar citas activas reales para prevenir condiciones de carrera
		const { data: activeAppointments, error: countError } = await supabase
			.from('appointments')
			.select('id')
			.eq('slot_id', slot.id)
			.in('status', ['pending', 'confirmed']);

		const actualBookedCount = activeAppointments?.length || 0;
		
		if (actualBookedCount >= slot.capacity) {
			console.warn('⚠️ Slot completo según conteo real de citas:', {
				slotId: slot.id,
				actualBookedCount,
				capacity: slot.capacity
			});
			return new Response(
				JSON.stringify({
					error: 'Slot completo. Por favor selecciona otro horario.',
				}),
				{ status: 409 }
			);
		}

		// Preparar datos para inserción
		const appointmentData: AppointmentInsert = {
			slot_id: slot.id,
			agent_id: slot.agent_id,
			client_name: data.name,
			client_email: data.email.toLowerCase(),
			client_phone: data.phone || null,
			operation_type: data.operationType,
			budget_range:
				data.operationType === 'rentar'
					? ('budgetRentar' in data ? data.budgetRentar : '')
					: ('budgetComprar' in data ? data.budgetComprar : ''),
			company: data.operationType === 'rentar' && 'company' in data ? data.company : null,
			resource_type:
				data.operationType === 'comprar' && 'resourceType' in data ? data.resourceType : null,
			resource_details:
				data.operationType === 'comprar'
					? {
							banco: (data as any).banco || null,
							creditoPreaprobado:
								(data as any).creditoPreaprobado || null,
							modalidadInfonavit:
								(data as any).modalidadInfonavit || null,
							numeroTrabajadorInfonavit:
								(data as any).numeroTrabajadorInfonavit || null,
							modalidadFovissste:
								(data as any).modalidadFovissste || null,
							numeroTrabajadorFovissste:
								(data as any).numeroTrabajadorFovissste || null,
						}
					: null,
			appointment_date: data.date,
			appointment_time: normalizedTime, // Usar hora normalizada
			duration_minutes: 45, // Duración configurada
			notes: data.notes || null,
			status: 'pending',
			confirmed_at: null,
			cancelled_at: null,
		};

		console.log('📝 Datos para inserción:', {
			slot_id: appointmentData.slot_id,
			agent_id: appointmentData.agent_id,
			date: appointmentData.appointment_date,
			time: appointmentData.appointment_time,
		});

		// Insertar cita
		const { data: appointment, error: insertError } = await supabase
			.from('appointments')
			.insert(appointmentData as any)
			.select()
			.single();

		if (insertError || !appointment) {
			console.error('❌ Insert error completo:', {
				message: insertError?.message,
				details: insertError?.details,
				hint: insertError?.hint,
				code: insertError?.code,
			});
			return new Response(
				JSON.stringify({
					error: 'Error al crear cita',
					details: insertError?.message || 'No se pudo crear la cita',
					hint: insertError?.hint,
					code: insertError?.code,
				}),
				{ status: 500 }
			);
		}

		// Type assertion para el appointment
		const typedAppointment = appointment as import('../../lib/supabase').Appointment;

		console.log('✅ Cita creada exitosamente:', typedAppointment.id);

		// Fallback: Actualizar manualmente el contador si el trigger no funcionó
		// Esto asegura que el slot se marque como ocupado inmediatamente
		try {
			const { data: activeAppointments } = await supabase
				.from('appointments')
				.select('id')
				.eq('slot_id', slot.id)
				.in('status', ['pending', 'confirmed']);

			const newBookedCount = Math.min(
				slot.capacity,
				activeAppointments?.length || 0
			);

			// Actualizar el contador directamente
			console.log('🔄 Intentando actualizar contador:', {
				slotId: slot.id,
				currentBooked: slot.booked,
				newBookedCount,
				activeAppointmentsCount: activeAppointments?.length || 0
			});

			const { error: updateError, data: updateData } = await supabase
				.from('availability_slots')
				.update({ booked: newBookedCount })
				.eq('id', slot.id)
				.select();

			if (updateError) {
				console.error('❌ Error al actualizar contador:', {
					error: updateError.message,
					details: updateError.details,
					hint: updateError.hint,
					code: updateError.code
				});
			} else {
				console.log('✅ Contador actualizado manualmente (fallback):', {
					slotId: slot.id,
					oldBooked: slot.booked,
					newBooked: newBookedCount,
					updatedSlot: updateData
				});
			}
		} catch (fallbackError) {
			console.warn('⚠️ Error en fallback de actualización de contador:', fallbackError);
			// No fallar la creación de la cita si solo falla la actualización del contador
		}

		// TODO: Enviar emails de confirmación (Fase 2)
		// await sendConfirmationEmails(typedAppointment);

		return new Response(
			JSON.stringify({
				success: true,
				appointment: {
					id: typedAppointment.id,
					date: typedAppointment.appointment_date,
					time: typedAppointment.appointment_time,
					status: typedAppointment.status,
				},
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('❌ API Error completo:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;
		
		console.error('Error details:', {
			message: errorMessage,
			stack: errorStack,
			type: error?.constructor?.name,
		});
		
		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				message: errorMessage,
				...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
			}),
			{ status: 500 }
		);
	}
};

