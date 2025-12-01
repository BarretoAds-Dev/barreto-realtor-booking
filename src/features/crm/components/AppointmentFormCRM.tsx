/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { validateAppointmentClient } from '../../../core/utils/validation';

type AppointmentFormData = any;

interface AppointmentFormCRMProps {
	selectedDate: Date | null;
	selectedTime: string | null;
	onBack: () => void;
	onSubmit: (data: AppointmentFormData) => void;
}

interface Property {
	id: string;
	title: string;
	address: string;
	price: number;
	property_type: string;
}

export default function AppointmentFormCRM({ selectedDate, selectedTime, onBack, onSubmit }: AppointmentFormCRMProps) {
	const [operationType, setOperationType] = useState<'rentar' | 'comprar' | ''>('');
	const [resourceType, setResourceType] = useState('');
	const [creditoPreaprobado, setCreditoPreaprobado] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
	const [properties, setProperties] = useState<Property[]>([]);
	const [isLoadingProperties, setIsLoadingProperties] = useState(false);

	// Cargar propiedades disponibles
	useEffect(() => {
		const loadProperties = async () => {
			setIsLoadingProperties(true);
			try {
				// Cargar de Easy Broker y Supabase
				const [easyBrokerRes, supabaseRes] = await Promise.all([
					fetch('/api/easybroker/properties?limit=100').catch(() => null),
					fetch('/api/properties').catch(() => null),
				]);

				const allProperties: Property[] = [];

				if (easyBrokerRes?.ok) {
					const easyBrokerData = await easyBrokerRes.json();
					if (easyBrokerData.content) {
						easyBrokerData.content.forEach((prop: any) => {
							allProperties.push({
								id: prop.public_id || prop.id,
								title: prop.title,
								address: prop.location || prop.address || 'Dirección no disponible',
								price: prop.price?.amount || prop.price || 0,
								property_type: prop.property_type || 'casa',
							});
						});
					}
				}

				if (supabaseRes?.ok) {
					const supabaseData = await supabaseRes.json();
					if (supabaseData.properties) {
						supabaseData.properties.forEach((prop: any) => {
							allProperties.push({
								id: prop.id,
								title: prop.title,
								address: prop.address,
								price: prop.price,
								property_type: prop.property_type || 'casa',
							});
						});
					}
				}

				setProperties(allProperties);
			} catch (error) {
				console.error('Error al cargar propiedades:', error);
			} finally {
				setIsLoadingProperties(false);
			}
		};

		loadProperties();
	}, []);

	const validateField = (name: string, value: any) => {
		const form = document.getElementById('appointmentFormCRM') as HTMLFormElement;
		if (!form) return;

		const formData = new FormData(form);
		const data: any = {
			date: selectedDate ? formatDateLocal(selectedDate) : '',
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

	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const handleBlur = (fieldName: string) => {
		setTouched(prev => ({ ...prev, [fieldName]: true }));
		const form = document.getElementById('appointmentFormCRM') as HTMLFormElement;
		if (form) {
			const radioButtons = form.querySelectorAll(`[name="${fieldName}"]`) as NodeListOf<HTMLInputElement>;
			let value = '';
			if (radioButtons.length > 0) {
				const selected = Array.from(radioButtons).find(radio => radio.checked);
				value = selected?.value || '';
			} else {
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

		const dateStr = formatDateLocal(selectedDate);

		const appointmentData: any = {
			date: dateStr,
			time: selectedTime,
			name: formData.get('name') || '',
			email: formData.get('email') || '',
			phone: formData.get('phone') || '',
			operationType: formData.get('operationType') || '',
			notes: formData.get('notes') || '',
			propertyId: selectedPropertyId || null,
		};

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

		const validation = validateAppointmentClient(appointmentData);

		if (!validation.success) {
			const validationErrors = validation.errors || {};
			const filteredErrors: Record<string, string> = {};
			Object.entries(validationErrors).forEach(([key, value]) => {
				if (value && String(value).trim().length > 0) {
					filteredErrors[key] = String(value);
				}
			});

			setErrors(filteredErrors);
			setIsSubmitting(false);
			const allFields = Object.keys(filteredErrors);
			const touchedFields: Record<string, boolean> = {};
			allFields.forEach(field => {
				touchedFields[field] = true;
			});
			setTouched(touchedFields);

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
			const response = await fetch('/api/appointments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(appointmentData),
			});

			const result = await response.json();

			if (!response.ok) {
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
					class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors font-semibold uppercase tracking-wide"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
					</svg>
					Cambiar hora
				</button>
				<h2 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Información de contacto</h2>
				<p class="text-gray-600 text-sm">Completa los datos para confirmar la cita</p>
			</div>

			{/* Resumen de selección */}
			<div class="bg-gray-100 p-4 mb-6 border border-gray-200 rounded-lg">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs text-gray-500 mb-1">Fecha seleccionada</p>
						<p class="text-sm font-semibold text-gray-900">{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</p>
					</div>
					<div class="text-right">
						<p class="text-xs text-gray-500 mb-1">Hora seleccionada</p>
						<p class="text-sm font-bold text-gray-900">{selectedTime}</p>
					</div>
				</div>
			</div>

			<form id="appointmentFormCRM" onSubmit={handleSubmit} class="space-y-5">
				{Object.keys(errors).length > 0 && (
					<div class="bg-red-50 border border-red-200 p-4 mb-4 rounded-lg">
						<p class="text-red-700 text-sm font-semibold mb-2">Por favor corrige los siguientes errores:</p>
						{errors.general ? (
							<p class="text-red-600 text-sm mb-2">{errors.general}</p>
						) : null}
						<ul class="list-disc list-inside text-red-600 text-xs space-y-1">
							{Object.entries(errors)
								.filter(([field, error]) => field !== 'general' && error && error.trim().length > 0)
								.map(([field, error]) => (
									<li key={field} class="mt-1">{String(error)}</li>
								))}
						</ul>
					</div>
				)}

				{/* Selector de Propiedad (Opcional) */}
				<div>
					<label htmlFor="propertyId" class="block text-sm font-medium text-gray-700 mb-1.5">
						Propiedad de interés <span class="text-gray-400 text-xs">(Opcional)</span>
					</label>
					<select
						id="propertyId"
						name="propertyId"
						value={selectedPropertyId}
						onChange={(e) => setSelectedPropertyId((e.target as HTMLSelectElement).value)}
						class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
					>
						<option value="">Seleccionar propiedad (opcional)</option>
						{isLoadingProperties ? (
							<option disabled>Cargando propiedades...</option>
						) : (
							properties.map((prop) => (
								<option key={prop.id} value={prop.id}>
									{prop.title} - {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(prop.price)}
								</option>
							))
						)}
					</select>
					{properties.length === 0 && !isLoadingProperties && (
						<p class="mt-1 text-xs text-gray-500">No hay propiedades disponibles</p>
					)}
				</div>

				{/* Nombre */}
				<div>
					<label htmlFor="name" class="block text-sm font-medium text-gray-700 mb-1.5">
						Nombre completo <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						onBlur={() => handleBlur('name')}
						class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
							touched.name && errors.name
								? 'border-red-300 focus:ring-red-500 focus:border-red-500'
								: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
						}`}
						placeholder="Ej: Juan Pérez"
					/>
					{touched.name && errors.name && (
						<p class="mt-1 text-sm text-red-600">{errors.name}</p>
					)}
				</div>

				{/* Email */}
				<div>
					<label htmlFor="email" class="block text-sm font-medium text-gray-700 mb-1.5">
						Correo electrónico <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						onBlur={() => handleBlur('email')}
						class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
							touched.email && errors.email
								? 'border-red-300 focus:ring-red-500 focus:border-red-500'
								: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
						}`}
						placeholder="Ej: juan@ejemplo.com"
					/>
					{touched.email && errors.email && (
						<p class="mt-1 text-sm text-red-600">{errors.email}</p>
					)}
				</div>

				{/* Teléfono */}
				<div>
					<label htmlFor="phone" class="block text-sm font-medium text-gray-700 mb-1.5">
						Teléfono <span class="text-gray-500 text-xs font-normal">(opcional)</span>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						onBlur={() => handleBlur('phone')}
						class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
							touched.phone && errors.phone
								? 'border-red-300 focus:ring-red-500 focus:border-red-500'
								: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
						}`}
						placeholder="Ej: +52 555 123 4567"
					/>
					{touched.phone && errors.phone && (
						<p class="mt-1 text-sm text-red-600">{errors.phone}</p>
					)}
				</div>

				{/* Tipo de operación */}
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Tipo de operación <span class="text-red-500">*</span>
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
							operationType === 'rentar'
								? 'border-gray-900 bg-gray-50'
								: touched.operationType && errors.operationType
								? 'border-red-300 bg-white'
								: 'border-gray-200 hover:border-gray-300 bg-white'
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
								class="mr-2"
							/>
							<span class="font-medium text-gray-900">Rentar</span>
						</label>
						<label class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
							operationType === 'comprar'
								? 'border-gray-900 bg-gray-50'
								: touched.operationType && errors.operationType
								? 'border-red-300 bg-white'
								: 'border-gray-200 hover:border-gray-300 bg-white'
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
								class="mr-2"
							/>
							<span class="font-medium text-gray-900">Comprar</span>
						</label>
					</div>
					{touched.operationType && errors.operationType && (
						<p class="mt-2 text-sm text-red-600">{errors.operationType}</p>
					)}
				</div>

				{/* Campos para RENTAR */}
				{operationType === 'rentar' && (
					<div class="space-y-4">
						<div>
							<label htmlFor="budgetRentar" class="block text-sm font-medium text-gray-700 mb-1.5">
								Presupuesto <span class="text-red-500">*</span>
							</label>
							<select
								id="budgetRentar"
								name="budgetRentar"
								required
								onBlur={() => handleBlur('budgetRentar')}
								class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
									touched.budgetRentar && errors.budgetRentar
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
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
								<p class="mt-1 text-sm text-red-600">{errors.budgetRentar}</p>
							)}
						</div>
						<div>
							<label htmlFor="company" class="block text-sm font-medium text-gray-700 mb-1.5">
								Empresa donde labora <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="company"
								name="company"
								required
								onBlur={() => handleBlur('company')}
								class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
									touched.company && errors.company
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
								}`}
								placeholder="Ej: Empresa S.A."
							/>
							{touched.company && errors.company && (
								<p class="mt-1 text-sm text-red-600">{errors.company}</p>
							)}
						</div>
					</div>
				)}

				{/* Campos para COMPRAR */}
				{operationType === 'comprar' && (
					<div class="space-y-4">
						<div>
							<label htmlFor="budgetComprar" class="block text-sm font-medium text-gray-700 mb-1.5">
								Presupuesto <span class="text-red-500">*</span>
							</label>
							<select
								id="budgetComprar"
								name="budgetComprar"
								required
								onBlur={() => handleBlur('budgetComprar')}
								class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
									touched.budgetComprar && errors.budgetComprar
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
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
								<p class="mt-1 text-sm text-red-600">{errors.budgetComprar}</p>
							)}
						</div>
						<div>
							<label htmlFor="resourceType" class="block text-sm font-medium text-gray-700 mb-1.5">
								Tipo de recurso <span class="text-red-500">*</span>
							</label>
							<select
								id="resourceType"
								name="resourceType"
								value={resourceType}
								onChange={(e) => {
									const target = e.target as HTMLSelectElement;
									if (target) {
										setResourceType(target.value);
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
								class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
									touched.resourceType && errors.resourceType
										? 'border-red-300 focus:ring-red-500 focus:border-red-500'
										: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
								}`}
							>
								<option value="">Selecciona el origen del recurso</option>
								<option value="recursos-propios">Recursos propios</option>
								<option value="credito-bancario">Crédito bancario</option>
								<option value="infonavit">Infonavit</option>
								<option value="fovissste">Fovissste</option>
							</select>
							{touched.resourceType && errors.resourceType && (
								<p class="mt-1 text-sm text-red-600">{errors.resourceType}</p>
							)}
						</div>

						{/* Crédito bancario */}
						{resourceType === 'credito-bancario' && (
							<div class="space-y-4">
								<div>
									<label htmlFor="banco" class="block text-sm font-medium text-gray-700 mb-1.5">
										Banco <span class="text-red-500">*</span>
									</label>
									<select
										id="banco"
										name="banco"
										required
										onBlur={() => handleBlur('banco')}
										class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
											touched.banco && errors.banco
												? 'border-red-300 focus:ring-red-500 focus:border-red-500'
												: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
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
										<p class="mt-1 text-sm text-red-600">{errors.banco}</p>
									)}
								</div>
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										¿Ya cuenta con un crédito preaprobado? <span class="text-red-500">*</span>
									</label>
									<div class="grid grid-cols-2 gap-3">
										<label class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
											creditoPreaprobado === 'si'
												? 'border-gray-900 bg-gray-50'
												: touched.creditoPreaprobado && errors.creditoPreaprobado
												? 'border-red-300 bg-white'
												: 'border-gray-200 hover:border-gray-300 bg-white'
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
												class="mr-2"
											/>
											<span class="text-gray-900">Sí</span>
										</label>
										<label class={`flex items-center p-3 border-2 rounded-md cursor-pointer transition-all ${
											creditoPreaprobado === 'no'
												? 'border-gray-900 bg-gray-50'
												: touched.creditoPreaprobado && errors.creditoPreaprobado
												? 'border-red-300 bg-white'
												: 'border-gray-200 hover:border-gray-300 bg-white'
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
												class="mr-2"
											/>
											<span class="text-gray-900">No</span>
										</label>
									</div>
									{touched.creditoPreaprobado && errors.creditoPreaprobado && (
										<p class="mt-2 text-sm text-red-600">{errors.creditoPreaprobado}</p>
									)}
								</div>
							</div>
						)}

						{/* Infonavit */}
						{resourceType === 'infonavit' && (
							<div class="space-y-4">
								<div>
									<label htmlFor="modalidadInfonavit" class="block text-sm font-medium text-gray-700 mb-1.5">
										Modalidad de préstamo <span class="text-red-500">*</span>
									</label>
									<select
										id="modalidadInfonavit"
										name="modalidadInfonavit"
										required
										onBlur={() => handleBlur('modalidadInfonavit')}
										class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
											touched.modalidadInfonavit && errors.modalidadInfonavit
												? 'border-red-300 focus:ring-red-500 focus:border-red-500'
												: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
										}`}
									>
										<option value="">Selecciona una modalidad</option>
										<option value="tradicional">Tradicional</option>
										<option value="cofinavit">Cofinavit</option>
										<option value="mejoravit">Mejoravit</option>
										<option value="tu-casa">Tu Casa</option>
									</select>
									{touched.modalidadInfonavit && errors.modalidadInfonavit && (
										<p class="mt-1 text-sm text-red-600">{errors.modalidadInfonavit}</p>
									)}
								</div>
								<div>
									<label htmlFor="numeroTrabajadorInfonavit" class="block text-sm font-medium text-gray-700 mb-1.5">
										Número de trabajador Infonavit <span class="text-gray-500 text-xs font-normal">(opcional)</span>
									</label>
									<input
										type="text"
										id="numeroTrabajadorInfonavit"
										name="numeroTrabajadorInfonavit"
										class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
										placeholder="Ej: 12345678901"
									/>
								</div>
							</div>
						)}

						{/* Fovissste */}
						{resourceType === 'fovissste' && (
							<div class="space-y-4">
								<div>
									<label htmlFor="modalidadFovissste" class="block text-sm font-medium text-gray-700 mb-1.5">
										Modalidad de préstamo <span class="text-red-500">*</span>
									</label>
									<select
										id="modalidadFovissste"
										name="modalidadFovissste"
										required
										onBlur={() => handleBlur('modalidadFovissste')}
										class={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
											touched.modalidadFovissste && errors.modalidadFovissste
												? 'border-red-300 focus:ring-red-500 focus:border-red-500'
												: 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
										}`}
									>
										<option value="">Selecciona una modalidad</option>
										<option value="tradicional">Tradicional</option>
										<option value="cofinavit">Cofinavit</option>
										<option value="mi-vivienda">Mi Vivienda</option>
									</select>
									{touched.modalidadFovissste && errors.modalidadFovissste && (
										<p class="mt-1 text-sm text-red-600">{errors.modalidadFovissste}</p>
									)}
								</div>
								<div>
									<label htmlFor="numeroTrabajadorFovissste" class="block text-sm font-medium text-gray-700 mb-1.5">
										Número de trabajador Fovissste <span class="text-gray-500 text-xs font-normal">(opcional)</span>
									</label>
									<input
										type="text"
										id="numeroTrabajadorFovissste"
										name="numeroTrabajadorFovissste"
										class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
										placeholder="Ej: 12345678901"
									/>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Notas */}
				<div>
					<label htmlFor="notes" class="block text-sm font-medium text-gray-700 mb-1.5">
						Notas adicionales <span class="text-gray-500 text-xs font-normal">(opcional)</span>
					</label>
					<textarea
						id="notes"
						name="notes"
						rows={4}
						class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
						placeholder="Notas adicionales sobre la cita..."
					></textarea>
				</div>

				{/* Botón de envío */}
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-md transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
							<span>Crear Cita</span>
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

