import { defineCollection, z } from 'astro:content';

// Nota: Las collections 'availability' y 'appointments' ya no se usan
// porque ahora los datos vienen directamente de Supabase

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
// Solo mantenemos 'schedule' y 'holidays' porque se usan como fallback
// 'availability' y 'appointments' ahora vienen de Supabase
export const collections = {
	schedule: defineCollection({
		type: 'data',
		schema: businessHoursSchema
	}),

	holidays: defineCollection({
		type: 'data',
		schema: z.array(holidaySchema)
	})
};

