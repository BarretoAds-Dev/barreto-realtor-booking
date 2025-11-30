// Validación simple del cliente sin Zod
export interface ValidationResult {
	success: boolean;
	errors?: Record<string, string>;
	data?: any;
}

export function validateAppointmentClient(data: any): ValidationResult {
	const errors: Record<string, string> = {};

	// Validar nombre
	if (!data.name || data.name.trim().length < 2) {
		errors.name = 'El nombre debe tener al menos 2 caracteres';
	} else if (data.name.length > 100) {
		errors.name = 'El nombre no puede exceder 100 caracteres';
	}

	// Validar email
	if (!data.email) {
		errors.email = 'El email es requerido';
	} else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			errors.email = 'El formato del email es inválido';
		}
	}

	// Validar teléfono (opcional)
	if (data.phone && data.phone.length > 20) {
		errors.phone = 'El teléfono no puede exceder 20 caracteres';
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
	if (data.notes && data.notes.length > 1000) {
		errors.notes = 'Las notas no pueden exceder los 1000 caracteres';
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	return { success: true, data };
}

