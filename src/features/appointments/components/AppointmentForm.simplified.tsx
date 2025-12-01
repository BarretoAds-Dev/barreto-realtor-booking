/** @jsxImportSource preact */
import { Button, Input, FormField, ErrorMessage, Textarea } from '../../../shared/ui';
import { useAppointmentForm } from '../../../shared/hooks/useAppointmentForm';
import AppointmentFormFields from '../../../shared/components/AppointmentFormFields';

interface AppointmentFormProps {
	selectedDate: Date | null;
	selectedTime: string | null;
	onBack: () => void;
	onSubmit: (data: any) => void;
}

export default function AppointmentForm({ selectedDate, selectedTime, onBack, onSubmit }: AppointmentFormProps) {
	const {
		operationType,
		resourceType,
		creditoPreaprobado,
		isSubmitting,
		setIsSubmitting,
		errors,
		setErrors,
		touched,
		handleBlur,
		handleRadioChange,
		handleSelectChange,
		validateForm,
	} = useAppointmentForm({
		selectedDate,
		selectedTime,
		formId: 'appointmentForm',
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setIsSubmitting(true);

		const validation = await validateForm();
		if (!validation.success) {
			setIsSubmitting(false);
			return;
		}

		try {
			const response = await fetch('/api/appointments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(validation.data),
			});

			const result = await response.json();

			if (!response.ok) {
				setErrors({
					general: result.details || result.error || 'Error al crear la cita',
				});
				setIsSubmitting(false);
				return;
			}

			onSubmit({
				...validation.data,
				appointmentId: result.appointment.id,
			});
		} catch (error) {
			setErrors({
				general: 'Error de conexión. Por favor verifica tu conexión e intenta nuevamente.',
			});
			setIsSubmitting(false);
		}
	};

	if (!selectedDate || !selectedTime) return null;

	const dateStr = selectedDate.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<div class="max-w-xl mx-auto transition-all duration-500">
			<div class="text-center mb-6">
				<Button variant="ghost" onClick={onBack} size="sm" className="mb-4">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
					</svg>
					Cambiar hora
				</Button>
				<h2 class="text-2xl font-bold text-white mb-2 tracking-tight">Información de contacto</h2>
				<p class="text-gray-300 text-sm font-light">Completa tus datos para confirmar la cita</p>
			</div>

			{/* Resumen de selección */}
			<div class="bg-gradient-to-r from-[#003d82]/30 to-[#004C97]/30 backdrop-blur-xl p-4 mb-6 border-2 border-[#00a0df]/30 shadow-md shadow-black/15">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs text-gray-400 mb-1">Fecha seleccionada</p>
						<p class="text-sm font-semibold text-white">{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-gray-400 mb-1">Hora seleccionada</p>
						<p class="text-sm font-bold text-[#00a0df]">{selectedTime}</p>
					</div>
				</div>
			</div>

			<form id="appointmentForm" onSubmit={handleSubmit} class="space-y-5">
				<ErrorMessage errors={errors} general={errors.general} />

				<FormField label="Nombre completo" required error={errors.name} touched={touched.name}>
					<Input
						name="name"
						type="text"
						placeholder="Ej: Juan Pérez"
						required
						onBlur={() => handleBlur('name')}
						error={errors.name}
						touched={touched.name}
					/>
				</FormField>

				<FormField label="Correo electrónico" required error={errors.email} touched={touched.email}>
					<Input
						name="email"
						type="email"
						placeholder="Ej: juan@ejemplo.com"
						required
						onBlur={() => handleBlur('email')}
						error={errors.email}
						touched={touched.email}
					/>
				</FormField>

				<FormField label="Teléfono" optional error={errors.phone} touched={touched.phone}>
					<Input
						name="phone"
						type="tel"
						placeholder="Ej: +34 600 000 000"
						onBlur={() => handleBlur('phone')}
						error={errors.phone}
						touched={touched.phone}
					/>
				</FormField>

				<AppointmentFormFields
					operationType={operationType}
					resourceType={resourceType}
					creditoPreaprobado={creditoPreaprobado}
					errors={errors}
					touched={touched}
					onBlur={handleBlur}
					onOperationTypeChange={(value) => handleRadioChange('operationType', value)}
					onResourceTypeChange={(value) => handleSelectChange('resourceType', value)}
					onCreditoPreaprobadoChange={(value) => handleSelectChange('creditoPreaprobado', value)}
				/>

				<FormField label="Notas adicionales" optional>
					<textarea
						name="notes"
						rows={4}
						class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all resize-none bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
						placeholder="Cuéntanos sobre el motivo de tu cita..."
					></textarea>
				</FormField>

				<Button type="submit" disabled={isSubmitting} loading={isSubmitting} fullWidth size="lg">
					Confirmar cita
				</Button>
			</form>
		</div>
	);
}

