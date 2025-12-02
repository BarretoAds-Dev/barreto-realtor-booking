// Tipos relacionados con formularios

export interface FormFieldError {
	message: string;
	field: string;
}

export interface FormValidationResult<T = any> {
	success: boolean;
	data?: T;
	errors?: Record<string, string>;
}

export interface FormState<T = any> {
	values: T;
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	isSubmitting: boolean;
	isValid: boolean;
}

