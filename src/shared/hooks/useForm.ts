import { useState, useCallback } from 'preact/hooks';

export interface UseFormOptions<T> {
	initialValues: T;
	onSubmit: (values: T) => void | Promise<void>;
	validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export interface UseFormReturn<T> {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	touched: Partial<Record<keyof T, boolean>>;
	isSubmitting: boolean;
	handleChange: (name: keyof T) => (e: Event) => void;
	handleBlur: (name: keyof T) => () => void;
	handleSubmit: (e: Event) => Promise<void>;
	setFieldValue: (name: keyof T, value: any) => void;
	setFieldError: (name: keyof T, error: string | undefined) => void;
	reset: () => void;
}

/**
 * Hook genérico para manejo de formularios
 * 
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   onSubmit: async (values) => {
 *     await submitForm(values);
 *   },
 *   validate: (values) => {
 *     const errors = {};
 *     if (!values.name) errors.name = 'Nombre requerido';
 *     if (!values.email) errors.email = 'Email requerido';
 *     return errors;
 *   }
 * });
 * ```
 */
export function useForm<T extends Record<string, any>>({
	initialValues,
	onSubmit,
	validate,
}: UseFormOptions<T>): UseFormReturn<T> {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = useCallback(
		(name: keyof T) => (e: Event) => {
			const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
			const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;

			setValues((prev) => ({ ...prev, [name]: value }));

			// Validar campo si ya fue tocado
			if (touched[name] && validate) {
				const fieldErrors = validate({ ...values, [name]: value });
				setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
			}
		},
		[values, touched, validate]
	);

	const handleBlur = useCallback(
		(name: keyof T) => () => {
			setTouched((prev) => ({ ...prev, [name]: true }));

			// Validar campo al perder foco
			if (validate) {
				const fieldErrors = validate(values);
				setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
			}
		},
		[values, validate]
	);

	const handleSubmit = useCallback(
		async (e: Event) => {
			e.preventDefault();

			// Marcar todos los campos como tocados
			const allTouched = Object.keys(values).reduce(
				(acc, key) => ({ ...acc, [key]: true }),
				{} as Partial<Record<keyof T, boolean>>
			);
			setTouched(allTouched);

			// Validar formulario completo
			if (validate) {
				const formErrors = validate(values);
				if (Object.keys(formErrors).length > 0) {
					setErrors(formErrors);
					return;
				}
			}

			// Limpiar errores y enviar
			setErrors({});
			setIsSubmitting(true);

			try {
				await onSubmit(values);
			} catch (error) {
				console.error('Error al enviar formulario:', error);
			} finally {
				setIsSubmitting(false);
			}
		},
		[values, validate, onSubmit]
	);

	const setFieldValue = useCallback((name: keyof T, value: any) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
		setErrors((prev) => ({ ...prev, [name]: error }));
	}, []);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
		setIsSubmitting(false);
	}, [initialValues]);

	return {
		values,
		errors,
		touched,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		setFieldValue,
		setFieldError,
		reset,
	};
}

