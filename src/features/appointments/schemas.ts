import { z } from 'zod';

// Schema base para información de contacto
const contactSchema = z.object({
	name: z.string()
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(100, 'El nombre no puede exceder 100 caracteres')
		.regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
	
	email: z.string()
		.email('Debe ser un email válido')
		.toLowerCase()
		.max(255, 'El email no puede exceder 255 caracteres'),
	
	phone: z.string()
		.regex(/^[\d\s\+\-\(\)]*$/, 'El teléfono contiene caracteres inválidos')
		.max(20, 'El teléfono no puede exceder 20 caracteres')
		.optional()
		.or(z.literal('')),
	
	notes: z.string()
		.max(1000, 'Las notas no pueden exceder 1000 caracteres')
		.optional()
		.or(z.literal('')),
});

// Schema para operación de renta
const rentarSchema = z.object({
	operationType: z.literal('rentar'),
	budgetRentar: z.enum([
		'20000-30000',
		'30000-40000',
		'40000-50000',
		'50000-60000',
		'60000-80000',
		'80000-100000',
		'100000-150000',
		'mas-150000'
	], {
		message: 'Debes seleccionar un rango de presupuesto'
	}),
	company: z.string()
		.min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
		.max(100, 'El nombre de la empresa no puede exceder 100 caracteres')
		.regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.\,\-]+$/, 'El nombre de la empresa contiene caracteres inválidos'),
});

// Schema para crédito bancario
const creditoBancarioSchema = z.object({
	resourceType: z.literal('credito-bancario'),
	banco: z.enum([
		'bbva',
		'banamex',
		'santander',
		'hsbc',
		'banorte',
		'scotiabank',
		'banco-azteca',
		'bancoppel',
		'inbursa',
		'banregio',
		'banco-del-bajio',
		'banco-multiva',
		'otro-banco'
	], {
		message: 'Debes seleccionar un banco'
	}),
	creditoPreaprobado: z.enum(['si', 'no'], {
		message: 'Debes indicar si tienes crédito preaprobado'
	}),
});

// Schema para Infonavit
const infonavitSchema = z.object({
	resourceType: z.literal('infonavit'),
	modalidadInfonavit: z.enum([
		'tradicional',
		'cofinavit',
		'mejoravit',
		'tu-casa'
	], {
		message: 'Debes seleccionar una modalidad de Infonavit'
	}),
	numeroTrabajadorInfonavit: z.string()
		.regex(/^[\d]*$/, 'El número de trabajador solo puede contener dígitos')
		.max(20, 'El número de trabajador no puede exceder 20 caracteres')
		.optional()
		.or(z.literal('')),
});

// Schema para Fovissste
const fovisssteSchema = z.object({
	resourceType: z.literal('fovissste'),
	modalidadFovissste: z.enum([
		'tradicional',
		'cofinavit',
		'mi-vivienda'
	], {
		message: 'Debes seleccionar una modalidad de Fovissste'
	}),
	numeroTrabajadorFovissste: z.string()
		.regex(/^[\d]*$/, 'El número de trabajador solo puede contener dígitos')
		.max(20, 'El número de trabajador no puede exceder 20 caracteres')
		.optional()
		.or(z.literal('')),
});

// Schema para recursos propios
const recursosPropiosSchema = z.object({
	resourceType: z.literal('recursos-propios'),
});

// Schema para comprar con diferentes tipos de recurso
const comprarSchema = z.object({
	operationType: z.literal('comprar'),
	budgetComprar: z.enum([
		'2500000-3000000',
		'3000000-3500000',
		'3500000-4000000',
		'4000000-5000000',
		'5000000-6000000',
		'6000000-8000000',
		'8000000-10000000',
		'mas-10000000'
	], {
		message: 'Debes seleccionar un rango de presupuesto'
	}),
}).and(
	z.union([
		creditoBancarioSchema,
		infonavitSchema,
		fovisssteSchema,
		recursosPropiosSchema
	])
);

// Schema principal que combina todo
export const appointmentSchema = z.object({
	date: z.string().min(1, 'Debes seleccionar una fecha'),
	// Aceptar formato HH:MM o HH:MM:SS
	time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido'),
}).and(contactSchema).and(
	z.union([
		rentarSchema,
		comprarSchema
	])
);

// Tipo TypeScript inferido del schema
export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Función helper para validar
export function validateAppointment(data: unknown): {
	success: boolean;
	data?: AppointmentFormData;
	errors?: Record<string, string>;
} {
	try {
		const validated = appointmentSchema.parse(data);
		return { success: true, data: validated };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors: Record<string, string> = {};
			error.issues.forEach((err) => {
				const path = err.path.join('.');
				errors[path] = err.message;
			});
			return { success: false, errors };
		}
		return { success: false, errors: { general: 'Error de validación desconocido' } };
	}
}

