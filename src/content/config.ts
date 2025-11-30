import { defineCollection, z } from 'astro:content';

// 📅 Schema para disponibilidad de horarios
const availabilitySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: "Formato de fecha inválido. Use YYYY-MM-DD"
	}),
	dayOfWeek: z.enum([
		'monday', 'tuesday', 'wednesday', 
		'thursday', 'friday', 'saturday', 'sunday'
	]),
	timeSlots: z.array(
		z.object({
			time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
				message: "Formato de hora inválido. Use HH:MM"
			}),
			available: z.boolean(),
			capacity: z.number().int().min(1).max(10).default(1),
			booked: z.number().int().min(0).default(0)
		})
	),
	metadata: z.object({
		notes: z.string().optional(),
		specialHours: z.boolean().default(false)
	}).optional()
});

// 📋 Schema para citas reservadas
const appointmentSchema = z.object({
	id: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
	duration: z.number().int().min(15).max(240).default(30),
	client: z.object({
		name: z.string().min(2, "Nombre muy corto"),
		email: z.string().email("Email inválido"),
		phone: z.string().optional(),
		notes: z.string().max(500).optional()
	}),
	status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
	createdAt: z.string().datetime()
});

// ⏰ Schema para horarios de negocio
const businessHoursSchema = z.object({
	businessHours: z.record(
		z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
		z.object({
			open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
			close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
			breaks: z.array(
				z.object({
					start: z.string(),
					end: z.string()
				})
			).optional(),
			enabled: z.boolean().default(true)
		}).refine((data) => {
			// Si está habilitado, debe tener open y close
			if (data.enabled) {
				return data.open !== undefined && data.close !== undefined;
			}
			return true;
		}, {
			message: "Los días habilitados deben tener horarios de apertura y cierre"
		})
	),
	slotDuration: z.number().int().min(15).max(120).default(30),
	bufferTime: z.number().int().min(0).max(60).default(0)
});

// 🎉 Schema para días festivos
const holidaySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	name: z.string(),
	type: z.enum(['holiday', 'vacation', 'blocked']),
	recurring: z.boolean().default(false)
});

// 🔧 Definir las collections
export const collections = {
	availability: defineCollection({
		type: 'data',
		schema: z.array(availabilitySchema)
	}),

	appointments: defineCollection({
		type: 'data',
		schema: z.array(appointmentSchema)
	}),

	schedule: defineCollection({
		type: 'data',
		schema: businessHoursSchema
	}),

	holidays: defineCollection({
		type: 'data',
		schema: z.array(holidaySchema)
	})
};

