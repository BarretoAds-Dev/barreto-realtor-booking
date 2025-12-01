/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { render } from 'preact';
import CalendarCRM from '../../crm/components/CalendarCRM';
import TimeSlotsCRM from '../../crm/components/TimeSlotsCRM';
import AppointmentFormCRM from '../../crm/components/AppointmentFormCRM';
import type { EasyBrokerProperty } from '../../../core/types/easybroker';

interface AvailableSlot {
	date: string;
	dayOfWeek: string;
	slots: Array<{
		time: string;
		available: boolean;
		capacity: number;
		booked: number;
		enabled?: boolean;
	}>;
	metadata?: {
		notes?: string;
		specialHours?: boolean;
	};
}

interface PropertyAppointmentModalProps {
	isOpen: boolean;
	property: EasyBrokerProperty | null;
	onClose: () => void;
	onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export function PropertyAppointmentModal({
	isOpen,
	property,
	onClose,
	onSuccess,
}: PropertyAppointmentModalProps): JSX.Element | null {
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const loadAvailability = async (): Promise<void> => {
		setIsLoading(true);
		try {
			const startDate = new Date().toISOString().split('T')[0];
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 6);
			const endDateStr = endDate.toISOString().split('T')[0];

			const response = await fetch(
				`/api/appointments/available?start=${startDate}&end=${endDateStr}`
			);
			if (response.ok) {
				const slots = await response.json();
				setAvailableSlots(slots);
			}
		} catch (error) {
			console.error('Error al cargar disponibilidad:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			loadAvailability();
		}
	}, [isOpen]);

	const slotsForSelectedDate = availableSlots.find(
		(slot) => selectedDate && slot.date === formatDateLocal(selectedDate)
	)?.slots || [];

	const handleDateSelect = (date: Date): void => {
		setSelectedDate(date);
		setSelectedTime(null);
		setCurrentStep(2);
		loadAvailability();
	};

	const handleTimeSelect = (time: string): void => {
		setSelectedTime(time);
		setCurrentStep(3);
	};

	const handleFormSubmit = async (data: any): Promise<void> => {
		let propertyId: string | null = null;

		// Si la propiedad tiene 'id' (propiedad de Supabase), usar ese directamente
		if (property && 'id' in property && typeof property.id === 'string') {
			propertyId = property.id;
		} else if (property && property.public_id) {
			// Si es una propiedad de Easy Broker, buscar o crear en Supabase
			try {
				// Primero, intentar buscar si ya existe una propiedad con este public_id
				// (asumiendo que guardamos el public_id en un campo o en las notas)
				// Por ahora, intentamos crear/sincronizar la propiedad en Supabase
				const propertyResponse = await fetch('/api/properties/sync-easybroker', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						public_id: property.public_id,
						title: property.title,
						address: typeof property.location === 'string'
							? property.location
							: property.location?.address || property.location?.city || 'Dirección no disponible',
						price: property.operations[0]?.amount || 0,
						property_type: property.property_type || 'casa',
						bedrooms: property.features?.bedrooms || null,
						bathrooms: property.features?.bathrooms || null,
						area: property.features?.construction_size || null,
						description: property.description || null,
					}),
				});

				if (propertyResponse.ok) {
					const result = await propertyResponse.json();
					propertyId = result.property?.id || null;
				}
			} catch (error) {
				console.warn('No se pudo sincronizar la propiedad con Supabase:', error);
				// Continuar sin propertyId, pero guardar info en notas
			}
		}

		// Agregar información de la propiedad a los datos de la cita
		const appointmentData = {
			...data,
			propertyId: propertyId,
			notes: property
				? `${data.notes || ''}\n\nPropiedad: ${property.title}${property.location ? `\nDirección: ${typeof property.location === 'string' ? property.location : property.location.address || property.location.city || ''}` : ''}${property.public_id ? `\nEasy Broker ID: ${property.public_id}` : ''}`.trim()
				: data.notes,
		};

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
				alert(result.error || 'Error al crear la cita');
				return;
			}

			await loadAvailability();
			onSuccess();
			onClose();
			setCurrentStep(1);
			setSelectedDate(null);
			setSelectedTime(null);
		} catch (error) {
			console.error('Error al crear cita:', error);
			alert('Error al crear la cita. Intenta nuevamente.');
		}
	};

	const handleBackToCalendar = (): void => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
		loadAvailability();
	};

	const handleBackToTime = (): void => {
		setCurrentStep(2);
		setSelectedTime(null);
	};

	useEffect(() => {
		if (!isOpen) {
			const existingModal = document.getElementById('property-appointment-modal-root');
			if (existingModal) {
				render(null, existingModal);
				existingModal.remove();
			}
			setModalRoot(null);
			setCurrentStep(1);
			setSelectedDate(null);
			setSelectedTime(null);
			return;
		}

		let root = document.getElementById('property-appointment-modal-root');
		if (!root) {
			root = document.createElement('div');
			root.id = 'property-appointment-modal-root';
			root.style.cssText =
				'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;';
			document.body.appendChild(root);
		}
		setModalRoot(root);

		return () => {
			if (root && root.parentNode) {
				render(null, root);
				root.remove();
			}
		};
	}, [isOpen]);

	useEffect(() => {
		if (!modalRoot || !isOpen || !property) return;

		const ModalContent = () => (
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto z-50"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onClose();
					}
				}}
			>
				<div
					className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header con imagen de propiedad */}
					<div className="relative">
						{/* Imagen de fondo */}
						{property.title_image_full && (
							<div className="relative h-48 w-full overflow-hidden">
								<img
									src={
										property.title_image_full.includes('easybroker.com') ||
										property.title_image_full.includes('ebimg')
											? `/api/easybroker/image-proxy?url=${encodeURIComponent(property.title_image_full)}`
											: property.title_image_full
									}
									alt={property.title}
									className="h-full w-full object-cover"
									onError={(e) => {
										console.warn('⚠️ Error al cargar imagen en modal:', property.title_image_full);
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
							</div>
						)}
						{/* Contenido del header */}
						<div className={`${property.title_image_full ? 'absolute bottom-0 left-0 right-0' : 'bg-gradient-to-r from-blue-600 to-blue-700'} px-6 py-5`}>
							<div className="flex items-center justify-between">
								<div className={property.title_image_full ? 'text-white' : ''}>
									<h2 className="text-2xl font-bold">
										Agendar Cita
									</h2>
									<p className={`text-sm mt-1 ${property.title_image_full ? 'text-white/90' : 'text-blue-100'}`}>
										{property.title}
									</p>
								</div>
								<button
									type="button"
									onClick={onClose}
									className={`transition-colors p-2 hover:bg-white/10 rounded-lg ${property.title_image_full ? 'text-white/80 hover:text-white' : 'text-white/80 hover:text-white'}`}
								>
									<svg
										className="w-6 h-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>

					{/* Contenido */}
					<div className="flex-1 overflow-y-auto p-6">
						{currentStep === 1 && (
							<CalendarCRM
								availableSlots={availableSlots}
								onDateSelect={handleDateSelect}
								isLoading={isLoading}
							/>
						)}
						{currentStep === 2 && selectedDate && (
							<TimeSlotsCRM
								selectedDate={selectedDate}
								slots={slotsForSelectedDate}
								onTimeSelect={handleTimeSelect}
								onBack={handleBackToCalendar}
							/>
						)}
						{currentStep === 3 && selectedDate && selectedTime && (
							<AppointmentFormCRM
								selectedDate={selectedDate}
								selectedTime={selectedTime}
								onBack={handleBackToTime}
								onSubmit={handleFormSubmit}
								preselectedProperty={property ? {
									id: property.public_id,
									title: property.title,
									address: typeof property.location === 'string'
										? property.location
										: property.location?.address || property.location?.city || 'Dirección no disponible',
									price: property.operations[0]?.amount || 0,
									property_type: property.property_type,
									operations: property.operations,
								} : null}
								allowedOperationType={
									property?.operations && property.operations.length > 0
										? (() => {
												const opType = property.operations[0].type.toLowerCase();
												if (opType.includes('rent') || opType.includes('renta')) {
													return 'rentar';
												}
												if (opType.includes('sale') || opType.includes('venta')) {
													return 'comprar';
												}
												return null;
											})()
										: null
								}
							/>
						)}
					</div>
				</div>
			</div>
		);

		render(<ModalContent />, modalRoot);
	}, [modalRoot, isOpen, property, currentStep, selectedDate, selectedTime, availableSlots, slotsForSelectedDate, isLoading, onClose, onSuccess]);

	return null;
}

