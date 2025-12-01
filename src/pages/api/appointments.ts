import type { APIRoute } from 'astro';
import { validateAppointment } from '../../features/appointments/schemas';
import { AppointmentsService } from '../../lib/services/appointments.service';

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

		const formData = validation.data;
		console.log('✅ Datos validados:', { date: formData.date, time: formData.time });

		// Buscar slot disponible
		const { slot, error: slotError } = await AppointmentsService.findAvailableSlot(
			formData.date,
			formData.time
		);

		if (slotError || !slot) {
			console.error('❌ Error al buscar slot:', slotError);
			return new Response(
				JSON.stringify({
					error: 'Slot no encontrado o no disponible',
					details: slotError?.message || 'No se encontró un slot disponible',
				}),
				{ status: 404 }
			);
		}

		// Verificar disponibilidad
		const availability = await AppointmentsService.checkSlotAvailability(slot.id);
		
		if (!availability.available) {
			console.warn('⚠️ Slot completo:', {
				slotId: slot.id,
				bookedCount: availability.bookedCount,
				capacity: availability.capacity
			});
			return new Response(
				JSON.stringify({
					error: 'Slot completo. Por favor selecciona otro horario.',
				}),
				{ status: 409 }
			);
		}

		// Crear cita
		const { appointment, error: createError } = await AppointmentsService.createAppointment(
			formData,
			slot
		);

		if (createError || !appointment) {
			console.error('❌ Error al crear cita:', createError);
			return new Response(
				JSON.stringify({
					error: 'Error al crear cita',
					details: createError?.message || 'No se pudo crear la cita',
				}),
				{ status: 500 }
			);
		}

		console.log('✅ Cita creada exitosamente:', appointment.id);

		return new Response(
			JSON.stringify({
				success: true,
				appointment: {
					id: appointment.id,
					date: appointment.appointment_date,
					time: appointment.appointment_time,
					status: appointment.status,
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

