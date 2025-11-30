/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { validateAppointmentClient } from '../utils/clientValidation';

type AppointmentFormData = any;

interface AppointmentFormProps {
	selectedDate: Date | null;
	selectedTime: string | null;
	onBack: () => void;
	onSubmit: (data: AppointmentFormData) => void;
}

export default function AppointmentForm({ selectedDate, selectedTime, onBack, onSubmit }: AppointmentFormProps) {
	const [operationType, setOperationType] = useState<'rentar' | 'comprar' | ''>('');
	const [resourceType, setResourceType] = useState('');
	const [creditoPreaprobado, setCreditoPreaprobado] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const validateField = (name: string, value: any) => {
		const form = document.getElementById('appointmentForm') as HTMLFormElement;
		if (!form) return;

		const formData = new FormData(form);
		const data: any = {
			date: selectedDate?.toLocaleDateString('es-ES') || '',
			time: selectedTime || '',
			name: formData.get('name') || '',
			email: formData.get('email') || '',
			phone: formData.get('phone') || '',
			operationType: formData.get('operationType') || '',
			notes: formData.get('notes') || ''
		};

		if (operationType === 'rentar') {
			data.budgetRentar = formData.get('budgetRentar') || '';
			data.company = formData.get('company') || '';
		} else if (operationType === 'comprar') {
			data.budgetComprar = formData.get('budgetComprar') || '';
			data.resourceType = formData.get('resourceType') || '';
			
			if (resourceType === 'credito-bancario') {
				data.banco = formData.get('banco') || '';
				data.creditoPreaprobado = formData.get('creditoPreaprobado') || '';
			} else if (resourceType === 'infonavit') {
				data.modalidadInfonavit = formData.get('modalidadInfonavit') || '';
				data.numeroTrabajadorInfonavit = formData.get('numeroTrabajadorInfonavit') || '';
			} else if (resourceType === 'fovissste') {
				data.modalidadFovissste = formData.get('modalidadFovissste') || '';
				data.numeroTrabajadorFovissste = formData.get('numeroTrabajadorFovissste') || '';
			}
		}

		const result = validateAppointmentClient(data);
		if (!result.success && result.errors) {
			const errorMessage = result.errors[name];
			if (errorMessage && String(errorMessage).trim().length > 0) {
				setErrors(prev => ({ ...prev, [name]: String(errorMessage) }));
			} else {
				setErrors(prev => {
					const newErrors = { ...prev };
					delete newErrors[name];
					return newErrors;
				});
			}
		} else {
			setErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const handleBlur = (fieldName: string) => {
		setTouched(prev => ({ ...prev, [fieldName]: true }));
		const form = document.getElementById('appointmentForm') as HTMLFormElement;
		if (form) {
			// Para radio buttons, buscar el seleccionado
			const radioButtons = form.querySelectorAll(`[name="${fieldName}"]`) as NodeListOf<HTMLInputElement>;
			let value = '';
			if (radioButtons.length > 0) {
				// Es un radio button
				const selected = Array.from(radioButtons).find(radio => radio.checked);
				value = selected?.value || '';
			} else {
				// Es otro tipo de campo
				const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
				value = field?.value || '';
			}
			if (value) {
				validateField(fieldName, value);
			}
		}
	};

	const handleRadioChange = (fieldName: string, value: string) => {
		setTouched(prev => ({ ...prev, [fieldName]: true }));
		if (fieldName === 'creditoPreaprobado') {
			setCreditoPreaprobado(value);
		}
		validateField(fieldName, value);
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!selectedDate || !selectedTime) return;

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		
		// Formatear fecha como YYYY-MM-DD para la API (en hora local, sin conversión UTC)
		const formatDateLocal = (date: Date): string => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		};
		const dateStr = formatDateLocal(selectedDate);
		
		const appointmentData: any = {
			date: dateStr,
			time: selectedTime,
			name: formData.get('name') || '',
			email: formData.get('email') || '',
			phone: formData.get('phone') || '',
			operationType: formData.get('operationType') || '',
			notes: formData.get('notes') || ''
		};

		// Agregar campos según el tipo de operación
		if (operationType === 'rentar') {
			appointmentData.budgetRentar = formData.get('budgetRentar') || '';
			appointmentData.company = formData.get('company') || '';
		} else if (operationType === 'comprar') {
			appointmentData.budgetComprar = formData.get('budgetComprar') || '';
			appointmentData.resourceType = formData.get('resourceType') || '';
			
			if (resourceType === 'credito-bancario') {
				appointmentData.banco = formData.get('banco') || '';
				appointmentData.creditoPreaprobado = formData.get('creditoPreaprobado') || '';
			} else if (resourceType === 'infonavit') {
				appointmentData.modalidadInfonavit = formData.get('modalidadInfonavit') || '';
				appointmentData.numeroTrabajadorInfonavit = formData.get('numeroTrabajadorInfonavit') || '';
			} else if (resourceType === 'fovissste') {
				appointmentData.modalidadFovissste = formData.get('modalidadFovissste') || '';
				appointmentData.numeroTrabajadorFovissste = formData.get('numeroTrabajadorFovissste') || '';
			}
		}

		// Validar datos client-side primero
		const validation = validateAppointmentClient(appointmentData);
		
		if (!validation.success) {
			const validationErrors = validation.errors || {};
			// Filtrar errores vacíos o undefined
			const filteredErrors: Record<string, string> = {};
			Object.entries(validationErrors).forEach(([key, value]) => {
				if (value && String(value).trim().length > 0) {
					filteredErrors[key] = String(value);
				}
			});
			
			setErrors(filteredErrors);
			setIsSubmitting(false);
			// Marcar todos los campos como touched para mostrar errores
			const allFields = Object.keys(filteredErrors);
			const touchedFields: Record<string, boolean> = {};
			allFields.forEach(field => {
				touchedFields[field] = true;
			});
			setTouched(touchedFields);
			
			// Scroll al primer error
			if (allFields.length > 0) {
				const firstErrorField = document.querySelector(`[name="${allFields[0]}"]`);
				if (firstErrorField) {
					firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
					(firstErrorField as HTMLElement).focus();
				}
			}
			return;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			// Enviar a la API
			const response = await fetch('/api/appointments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(appointmentData),
			});

			const result = await response.json();

			if (!response.ok) {
				// Error del servidor
				console.error('Error del servidor:', result);
				const errorMessage = result.details 
					? `${result.error}: ${result.details}`
					: result.error || 'Error al crear la cita. Por favor intenta nuevamente.';
				
				setErrors({
					general: errorMessage,
				});
				setIsSubmitting(false);
				return;
			}

			// Éxito - pasar al siguiente paso
			if (validation.data) {
				onSubmit({
					...validation.data,
					appointmentId: result.appointment.id,
				});
			}
		} catch (error) {
			console.error('Error al enviar cita:', error);
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
		day: 'numeric'
	});

	return (
		<div class="max-w-xl mx-auto transition-all duration-500">
			<div class="text-center mb-6">
				<button
					onClick={onBack}
					class="inline-flex items-center text-sm text-gray-300 hover:text-[#00a0df] mb-4 transition-colors font-semibold uppercase tracking-wide"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
					</svg>
					Cambiar hora
				</button>
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
				{Object.keys(errors).length > 0 && (
					<div class="bg-red-500/20 border-2 border-red-500/50 backdrop-blur-xl p-4 mb-4 rounded">
						<p class="text-red-300 text-sm font-semibold mb-2">Por favor corrige los siguientes errores:</p>
						{errors.general ? (
							<p class="text-red-200 text-sm mb-2">{errors.general}</p>
						) : null}
						<ul class="list-disc list-inside text-red-200 text-xs space-y-1">
							{Object.entries(errors)
								.filter(([field, error]) => field !== 'general' && error && error.trim().length > 0)
								.map(([field, error]) => (
									<li key={field} class="mt-1">{String(error)}</li>
								))}
						</ul>
					</div>
				)}
				<div>
					<label htmlFor="name" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
						Nombre completo <span class="text-red-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						onBlur={() => handleBlur('name')}
						class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
							touched.name && errors.name
								? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
								: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
						}`}
						placeholder="Ej: Juan Pérez"
					/>
					{touched.name && errors.name && (
						<p class="mt-1 text-sm text-red-400">{errors.name}</p>
					)}
				</div>

				<div>
					<label htmlFor="email" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
						Correo electrónico <span class="text-red-400">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						onBlur={() => handleBlur('email')}
						class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
							touched.email && errors.email
								? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
								: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
						}`}
						placeholder="Ej: juan@ejemplo.com"
					/>
					{touched.email && errors.email && (
						<p class="mt-1 text-sm text-red-400">{errors.email}</p>
					)}
				</div>

				<div>
					<label htmlFor="phone" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
						Teléfono <span class="text-gray-400 text-xs font-normal normal-case">(opcional)</span>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						onBlur={() => handleBlur('phone')}
						class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
							touched.phone && errors.phone
								? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
								: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
						}`}
						placeholder="Ej: +34 600 000 000"
					/>
					{touched.phone && errors.phone && (
						<p class="mt-1 text-sm text-red-400">{errors.phone}</p>
					)}
				</div>

				{/* Campo de selección: Rentar o Comprar */}
				<div>
					<label class="block text-sm font-bold text-white mb-3 uppercase tracking-wide">
						Tipo de operación <span class="text-red-400">*</span>
					</label>
					<div class={`grid grid-cols-2 gap-3 ${touched.operationType && errors.operationType ? 'mb-2' : ''}`}>
						<label class={`group relative flex items-center p-4 border-2 cursor-pointer bg-slate-700/40 backdrop-blur-xl hover:bg-slate-700/60 transition-all shadow-md shadow-black/20 hover:shadow-md hover:shadow-black/25 ${
							operationType === 'rentar' ? 'border-[#00a0df]/60 bg-[#003d82]/15' : touched.operationType && errors.operationType ? 'border-red-500/50' : 'border-slate-600/50 hover:border-[#00a0df]/40'
						}`}>
							<input
								type="radio"
								name="operationType"
								value="rentar"
								checked={operationType === 'rentar'}
								onChange={(e) => {
									const target = e.target as HTMLInputElement;
									if (target) {
										setOperationType(target.value as 'rentar');
										handleBlur('operationType');
									}
								}}
								required
								class="sr-only peer"
							/>
							<div class="flex items-center gap-3 w-full">
								<div class={`w-5 h-5 rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
									operationType === 'rentar' ? 'border-[#00a0df] bg-[#00a0df] shadow-[#00a0df]/15' : 'border-slate-500/50'
								}`}>
									<div class={`w-2 h-2 rounded-full transition-all ${
										operationType === 'rentar' ? 'bg-white' : 'bg-slate-700'
									}`}></div>
								</div>
								<span class={`text-white font-semibold transition-colors uppercase tracking-wide text-xs ${
									operationType === 'rentar' ? 'text-[#00a0df]' : ''
								}`}>Rentar</span>
							</div>
						</label>
						<label class={`group relative flex items-center p-4 border-2 cursor-pointer bg-slate-700/40 backdrop-blur-xl hover:bg-slate-700/60 transition-all shadow-md shadow-black/20 hover:shadow-md hover:shadow-black/25 ${
							operationType === 'comprar' ? 'border-[#00a0df]/60 bg-[#003d82]/15' : touched.operationType && errors.operationType ? 'border-red-500/50' : 'border-slate-600/50 hover:border-[#00a0df]/40'
						}`}>
							<input
								type="radio"
								name="operationType"
								value="comprar"
								checked={operationType === 'comprar'}
								onChange={(e) => {
									const target = e.target as HTMLInputElement;
									if (target) {
										setOperationType(target.value as 'comprar');
										handleBlur('operationType');
									}
								}}
								required
								class="sr-only peer"
							/>
							<div class="flex items-center gap-3 w-full">
								<div class={`w-5 h-5 rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
									operationType === 'comprar' ? 'border-[#00a0df] bg-[#00a0df] shadow-[#00a0df]/15' : 'border-slate-500/50'
								}`}>
									<div class={`w-2 h-2 rounded-full transition-all ${
										operationType === 'comprar' ? 'bg-white' : 'bg-slate-700'
									}`}></div>
								</div>
								<span class={`text-white font-semibold transition-colors uppercase tracking-wide text-xs ${
									operationType === 'comprar' ? 'text-[#00a0df]' : ''
								}`}>Comprar</span>
							</div>
						</label>
					</div>
					{touched.operationType && errors.operationType && (
						<p class="mt-2 text-sm text-red-400">{errors.operationType}</p>
					)}
				</div>

				{/* Campos condicionales para RENTAR */}
				{operationType === 'rentar' && (
					<div class="space-y-5">
						<div>
							<label htmlFor="budgetRentar" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
								Presupuesto <span class="text-red-400">*</span>
							</label>
							<select
								id="budgetRentar"
								name="budgetRentar"
								required
								onBlur={() => handleBlur('budgetRentar')}
								class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
									touched.budgetRentar && errors.budgetRentar
										? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
										: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
								}`}
							>
								<option value="">Selecciona un rango</option>
								<option value="20000-30000">$20,000 - $30,000 MXN</option>
								<option value="30000-40000">$30,000 - $40,000 MXN</option>
								<option value="40000-50000">$40,000 - $50,000 MXN</option>
								<option value="50000-60000">$50,000 - $60,000 MXN</option>
								<option value="60000-80000">$60,000 - $80,000 MXN</option>
								<option value="80000-100000">$80,000 - $100,000 MXN</option>
								<option value="100000-150000">$100,000 - $150,000 MXN</option>
								<option value="mas-150000">Más de $150,000 MXN</option>
							</select>
							{touched.budgetRentar && errors.budgetRentar && (
								<p class="mt-1 text-sm text-red-400">{errors.budgetRentar}</p>
							)}
						</div>
						<div>
							<label htmlFor="company" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
								Empresa donde labora <span class="text-red-400">*</span>
							</label>
							<input
								type="text"
								id="company"
								name="company"
								required
								onBlur={() => handleBlur('company')}
								class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
									touched.company && errors.company
										? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
										: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
								}`}
								placeholder="Ej: Empresa S.A."
							/>
							{touched.company && errors.company && (
								<p class="mt-1 text-sm text-red-400">{errors.company}</p>
							)}
						</div>
					</div>
				)}

				{/* Campos condicionales para COMPRAR */}
				{operationType === 'comprar' && (
					<div class="space-y-5">
						<div>
							<label htmlFor="budgetComprar" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
								Presupuesto <span class="text-red-400">*</span>
							</label>
							<select
								id="budgetComprar"
								name="budgetComprar"
								required
								onBlur={() => handleBlur('budgetComprar')}
								class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
									touched.budgetComprar && errors.budgetComprar
										? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
										: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
								}`}
							>
								<option value="">Selecciona un rango</option>
								<option value="2500000-3000000">$2,500,000 - $3,000,000 MXN</option>
								<option value="3000000-3500000">$3,000,000 - $3,500,000 MXN</option>
								<option value="3500000-4000000">$3,500,000 - $4,000,000 MXN</option>
								<option value="4000000-5000000">$4,000,000 - $5,000,000 MXN</option>
								<option value="5000000-6000000">$5,000,000 - $6,000,000 MXN</option>
								<option value="6000000-8000000">$6,000,000 - $8,000,000 MXN</option>
								<option value="8000000-10000000">$8,000,000 - $10,000,000 MXN</option>
								<option value="mas-10000000">Más de $10,000,000 MXN</option>
							</select>
							{touched.budgetComprar && errors.budgetComprar && (
								<p class="mt-1 text-sm text-red-400">{errors.budgetComprar}</p>
							)}
						</div>
						<div>
							<label htmlFor="resourceType" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
								Tipo de recurso <span class="text-red-400">*</span>
							</label>
							<select
								id="resourceType"
								name="resourceType"
								value={resourceType}
								onChange={(e) => {
									const target = e.target as HTMLSelectElement;
									if (target) {
										setResourceType(target.value);
										// Limpiar errores relacionados cuando cambia el tipo de recurso
										setErrors(prev => {
											const newErrors = { ...prev };
											delete newErrors.banco;
											delete newErrors.creditoPreaprobado;
											delete newErrors.modalidadInfonavit;
											delete newErrors.modalidadFovissste;
											return newErrors;
										});
									}
								}}
								onBlur={() => handleBlur('resourceType')}
								required
								class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
									touched.resourceType && errors.resourceType
										? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
										: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
								}`}
							>
								<option value="">Selecciona el origen del recurso</option>
								<option value="recursos-propios">Recursos propios</option>
								<option value="credito-bancario">Crédito bancario</option>
								<option value="infonavit">Infonavit</option>
								<option value="fovissste">Fovissste</option>
							</select>
							{touched.resourceType && errors.resourceType && (
								<p class="mt-1 text-sm text-red-400">{errors.resourceType}</p>
							)}
						</div>

						{/* Campos condicionales para CRÉDITO BANCARIO */}
						{resourceType === 'credito-bancario' && (
							<div class="space-y-5">
								<div>
									<label htmlFor="banco" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
										Banco <span class="text-red-400">*</span>
									</label>
									<select
										id="banco"
										name="banco"
										required
										onBlur={() => handleBlur('banco')}
										class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
											touched.banco && errors.banco
												? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
												: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
										}`}
									>
										<option value="">Selecciona un banco</option>
										<option value="bbva">BBVA</option>
										<option value="banamex">Citibanamex</option>
										<option value="santander">Santander</option>
										<option value="hsbc">HSBC</option>
										<option value="banorte">Banorte</option>
										<option value="scotiabank">Scotiabank</option>
										<option value="banco-azteca">Banco Azteca</option>
										<option value="bancoppel">Bancoppel</option>
										<option value="inbursa">Banco Inbursa</option>
										<option value="banregio">Banregio</option>
										<option value="banco-del-bajio">Banco del Bajío</option>
										<option value="banco-multiva">Banco Multiva</option>
										<option value="otro-banco">Otro banco</option>
									</select>
									{touched.banco && errors.banco && (
										<p class="mt-1 text-sm text-red-400">{errors.banco}</p>
									)}
								</div>
								<div>
									<label class="block text-sm font-bold text-white mb-3 uppercase tracking-wide">
										¿Ya cuenta con un crédito preaprobado? <span class="text-red-400 normal-case">*</span>
									</label>
									<div class={`grid grid-cols-2 gap-3 ${touched.creditoPreaprobado && errors.creditoPreaprobado ? 'mb-2' : ''}`}>
										<label class={`group relative flex items-center p-4 border-2 cursor-pointer bg-slate-700/40 backdrop-blur-xl hover:bg-slate-700/60 transition-all shadow-md shadow-black/20 hover:shadow-md hover:shadow-black/25 ${
											creditoPreaprobado === 'si' ? 'border-[#00a0df]/60 bg-[#003d82]/15' : touched.creditoPreaprobado && errors.creditoPreaprobado ? 'border-red-500/50' : 'border-slate-600/50'
										}`}>
											<input
												type="radio"
												name="creditoPreaprobado"
												value="si"
												checked={creditoPreaprobado === 'si'}
												required
												onChange={(e) => {
													const target = e.target as HTMLInputElement;
													handleRadioChange('creditoPreaprobado', target.value);
												}}
												class="sr-only peer"
											/>
											<div class="flex items-center gap-3 w-full">
												<div class={`w-5 h-5 rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
													creditoPreaprobado === 'si' ? 'border-[#00a0df] bg-[#00a0df] shadow-[#00a0df]/15' : 'border-slate-500/50'
												}`}>
													<div class={`w-2 h-2 rounded-full transition-all ${
														creditoPreaprobado === 'si' ? 'bg-white' : 'bg-slate-700'
													}`}></div>
												</div>
												<span class={`text-white font-semibold transition-colors uppercase tracking-wide text-xs ${
													creditoPreaprobado === 'si' ? 'text-[#00a0df]' : ''
												}`}>Sí</span>
											</div>
										</label>
										<label class={`group relative flex items-center p-4 border-2 cursor-pointer bg-slate-700/40 backdrop-blur-xl hover:bg-slate-700/60 transition-all shadow-md shadow-black/20 hover:shadow-md hover:shadow-black/25 ${
											creditoPreaprobado === 'no' ? 'border-[#00a0df]/60 bg-[#003d82]/15' : touched.creditoPreaprobado && errors.creditoPreaprobado ? 'border-red-500/50' : 'border-slate-600/50'
										}`}>
											<input
												type="radio"
												name="creditoPreaprobado"
												value="no"
												checked={creditoPreaprobado === 'no'}
												required
												onChange={(e) => {
													const target = e.target as HTMLInputElement;
													handleRadioChange('creditoPreaprobado', target.value);
												}}
												class="sr-only peer"
											/>
											<div class="flex items-center gap-3 w-full">
												<div class={`w-5 h-5 rounded-full border-2 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm ${
													creditoPreaprobado === 'no' ? 'border-[#00a0df] bg-[#00a0df] shadow-[#00a0df]/15' : 'border-slate-500/50'
												}`}>
													<div class={`w-2 h-2 rounded-full transition-all ${
														creditoPreaprobado === 'no' ? 'bg-white' : 'bg-slate-700'
													}`}></div>
												</div>
												<span class={`text-white font-semibold transition-colors uppercase tracking-wide text-xs ${
													creditoPreaprobado === 'no' ? 'text-[#00a0df]' : ''
												}`}>No</span>
											</div>
										</label>
									</div>
									{touched.creditoPreaprobado && errors.creditoPreaprobado && (
										<p class="mt-2 text-sm text-red-400">{errors.creditoPreaprobado}</p>
									)}
								</div>
							</div>
						)}

						{/* Campos condicionales para INFONAVIT */}
						{resourceType === 'infonavit' && (
							<div class="space-y-5">
								<div>
									<label htmlFor="modalidadInfonavit" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
										Modalidad de préstamo <span class="text-red-400">*</span>
									</label>
									<select
										id="modalidadInfonavit"
										name="modalidadInfonavit"
										required
										onBlur={() => handleBlur('modalidadInfonavit')}
										class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
											touched.modalidadInfonavit && errors.modalidadInfonavit
												? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
												: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
										}`}
									>
										<option value="">Selecciona una modalidad</option>
										<option value="tradicional">Tradicional</option>
										<option value="cofinavit">Cofinavit</option>
										<option value="mejoravit">Mejoravit</option>
										<option value="tu-casa">Tu Casa</option>
									</select>
									{touched.modalidadInfonavit && errors.modalidadInfonavit && (
										<p class="mt-1 text-sm text-red-400">{errors.modalidadInfonavit}</p>
									)}
								</div>
								<div>
									<label htmlFor="numeroTrabajadorInfonavit" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
										Número de trabajador Infonavit <span class="text-gray-400 text-xs font-normal normal-case">(opcional)</span>
									</label>
									<input
										type="text"
										id="numeroTrabajadorInfonavit"
										name="numeroTrabajadorInfonavit"
										class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
										placeholder="Ej: 12345678901"
									/>
								</div>
							</div>
						)}

						{/* Campos condicionales para FOVISSSTE */}
						{resourceType === 'fovissste' && (
							<div class="space-y-5">
								<div>
									<label htmlFor="modalidadFovissste" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
										Modalidad de préstamo <span class="text-red-400">*</span>
									</label>
									<select
										id="modalidadFovissste"
										name="modalidadFovissste"
										required
										onBlur={() => handleBlur('modalidadFovissste')}
										class={`w-full px-4 py-3 border-2 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light ${
											touched.modalidadFovissste && errors.modalidadFovissste
												? 'border-red-500/70 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
												: 'border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70'
										}`}
									>
										<option value="">Selecciona una modalidad</option>
										<option value="tradicional">Tradicional</option>
										<option value="cofinavit">Cofinavit</option>
										<option value="mi-vivienda">Mi Vivienda</option>
									</select>
									{touched.modalidadFovissste && errors.modalidadFovissste && (
										<p class="mt-1 text-sm text-red-400">{errors.modalidadFovissste}</p>
									)}
								</div>
								<div>
									<label htmlFor="numeroTrabajadorFovissste" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
										Número de trabajador Fovissste <span class="text-gray-400 text-xs font-normal normal-case">(opcional)</span>
									</label>
									<input
										type="text"
										id="numeroTrabajadorFovissste"
										name="numeroTrabajadorFovissste"
										class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
										placeholder="Ej: 12345678901"
									/>
								</div>
							</div>
						)}
					</div>
				)}

				<div>
					<label htmlFor="notes" class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
						Notas adicionales <span class="text-gray-400 text-xs font-normal normal-case">(opcional)</span>
					</label>
					<textarea
						id="notes"
						name="notes"
						rows={4}
						class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all resize-none bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
						placeholder="Cuéntanos sobre el motivo de tu cita o cualquier información adicional que consideres relevante..."
					></textarea>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full bg-[#003d82] backdrop-blur-xl text-white font-bold py-4 px-6 hover:bg-[#004C97] transition-all duration-300 shadow-md shadow-black/25 hover:shadow-md hover:shadow-black/30 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 border-2 border-[#00a0df]/30 hover:border-[#00a0df]/50 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? (
						<span class="flex items-center gap-2">
							<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Procesando...
						</span>
					) : (
						<>
							<span>Confirmar cita</span>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
							</svg>
						</>
					)}
				</button>
			</form>
		</div>
	);
}

