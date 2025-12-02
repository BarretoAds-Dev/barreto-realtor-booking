// Reglas de validación globales

export const VALIDATION_RULES = {
	name: {
		minLength: 2,
		maxLength: 100,
		pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
	},
	email: {
		maxLength: 255,
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	},
	phone: {
		maxLength: 20,
		pattern: /^[\d\s\+\-\(\)]*$/,
	},
	notes: {
		maxLength: 1000,
	},
	workerNumber: {
		maxLength: 20,
		pattern: /^[\d]*$/,
	},
	company: {
		minLength: 2,
		maxLength: 100,
		pattern: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.\,\-]+$/,
	},
} as const;

export const VALIDATION_MESSAGES = {
	name: {
		required: 'El nombre es requerido',
		minLength: 'El nombre debe tener al menos 2 caracteres',
		maxLength: 'El nombre no puede exceder 100 caracteres',
		pattern: 'El nombre solo puede contener letras y espacios',
	},
	email: {
		required: 'El email es requerido',
		invalid: 'Debe ser un email válido',
		maxLength: 'El email no puede exceder 255 caracteres',
	},
	phone: {
		invalid: 'El teléfono contiene caracteres inválidos',
		maxLength: 'El teléfono no puede exceder 20 caracteres',
	},
	notes: {
		maxLength: 'Las notas no pueden exceder 1000 caracteres',
	},
} as const;

