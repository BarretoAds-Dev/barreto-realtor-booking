// Validación compartida (sin Zod, para uso en cliente)
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '../config/validation-rules';

export interface ValidationResult {
	success: boolean;
	errors?: Record<string, string>;
	data?: any;
}

/**
 * Valida un campo de nombre
 */
export function validateName(name: string): string | null {
	if (!name || name.trim().length < VALIDATION_RULES.name.minLength) {
		return VALIDATION_MESSAGES.name.minLength;
	}
	if (name.length > VALIDATION_RULES.name.maxLength) {
		return VALIDATION_MESSAGES.name.maxLength;
	}
	if (!VALIDATION_RULES.name.pattern.test(name)) {
		return VALIDATION_MESSAGES.name.pattern;
	}
	return null;
}

/**
 * Valida un email
 */
export function validateEmail(email: string): string | null {
	if (!email) {
		return VALIDATION_MESSAGES.email.required;
	}
	if (!VALIDATION_RULES.email.pattern.test(email)) {
		return VALIDATION_MESSAGES.email.invalid;
	}
	if (email.length > VALIDATION_RULES.email.maxLength) {
		return VALIDATION_MESSAGES.email.maxLength;
	}
	return null;
}

/**
 * Valida un teléfono (opcional)
 */
export function validatePhone(phone: string): string | null {
	if (!phone) return null; // Opcional
	if (phone.length > VALIDATION_RULES.phone.maxLength) {
		return VALIDATION_MESSAGES.phone.maxLength;
	}
	if (!VALIDATION_RULES.phone.pattern.test(phone)) {
		return VALIDATION_MESSAGES.phone.invalid;
	}
	return null;
}

/**
 * Valida notas (opcional)
 */
export function validateNotes(notes: string): string | null {
	if (!notes) return null; // Opcional
	if (notes.length > VALIDATION_RULES.notes.maxLength) {
		return VALIDATION_MESSAGES.notes.maxLength;
	}
	return null;
}

/**
 * Valida un formulario de cita completo (validación del cliente)
 */
export function validateAppointmentClient(data: any): ValidationResult {
	const errors: Record<string, string> = {};

	// Validar nombre
	const nameError = validateName(data.name);
	if (nameError) errors.name = nameError;

	// Validar email
	const emailError = validateEmail(data.email);
	if (emailError) errors.email = emailError;

	// Validar teléfono (opcional)
	if (data.phone) {
		const phoneError = validatePhone(data.phone);
		if (phoneError) errors.phone = phoneError;
	}

	// Validar tipo de operación
	if (!data.operationType || (data.operationType !== 'rentar' && data.operationType !== 'comprar')) {
		errors.operationType = 'Debe seleccionar un tipo de operación';
	}

	// Validar campos según tipo de operación
	if (data.operationType === 'rentar') {
		if (!data.budgetRentar) {
			errors.budgetRentar = 'El presupuesto es requerido para rentar';
		}
		if (!data.company || data.company.trim().length < 2) {
			errors.company = 'La empresa es requerida para rentar';
		}
	} else if (data.operationType === 'comprar') {
		if (!data.budgetComprar) {
			errors.budgetComprar = 'El presupuesto es requerido para comprar';
		}
		if (!data.resourceType) {
			errors.resourceType = 'El tipo de recurso es requerido para comprar';
		}

		// Validar campos según tipo de recurso
		if (data.resourceType === 'credito-bancario') {
			if (!data.banco) {
				errors.banco = 'El banco es requerido para crédito bancario';
			}
			if (!data.creditoPreaprobado) {
				errors.creditoPreaprobado = '¿Cuenta con crédito preaprobado? es requerido';
			}
		} else if (data.resourceType === 'infonavit') {
			if (!data.modalidadInfonavit) {
				errors.modalidadInfonavit = 'La modalidad Infonavit es requerida';
			}
		} else if (data.resourceType === 'fovissste') {
			if (!data.modalidadFovissste) {
				errors.modalidadFovissste = 'La modalidad Fovissste es requerida';
			}
		}
	}

	// Validar notas (opcional)
	if (data.notes) {
		const notesError = validateNotes(data.notes);
		if (notesError) errors.notes = notesError;
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return { success: true, data };
}
