/** @jsxImportSource preact */
import { useState, useEffect, useMemo } from 'preact/hooks';
import { render } from 'preact';
import CalendarCRM from './CalendarCRM';
import TimeSlotsCRM from './TimeSlotsCRM';
import AppointmentFormCRM from './AppointmentFormCRM';

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

interface CreateAppointmentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export default function CreateAppointmentModal({ isOpen, onClose, onSuccess }: CreateAppointmentModalProps) {
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	// Función helper para formatear fecha en hora local
	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Función helper para parsear fecha desde string
	const parseDateLocal = (dateStr: string): Date => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day);
	};

	// Cargar disponibilidad desde la API
	const loadAvailability = async () => {
		setIsLoading(true);
		try {
			const startDate = new Date().toISOString().split('T')[0];
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 6);
			const endDateStr = endDate.toISOString().split('T')[0];
			
			const response = await fetch(`/api/citas/availability?start=${startDate}&end=${endDateStr}`);
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

	// Cargar disponibilidad cuando se abre el modal
	useEffect(() => {
		if (isOpen) {
			loadAvailability();
		}
	}, [isOpen]);

	// Encontrar slots para la fecha seleccionada
	const slotsForSelectedDate = useMemo(() => {
		if (!selectedDate) return [];
		const dateStr = formatDateLocal(selectedDate);
		const dayData = availableSlots.find(slot => slot.date === dateStr);
		return dayData?.slots || [];
	}, [selectedDate, availableSlots]);

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
		setSelectedTime(null);
		setCurrentStep(2);
		// Refrescar disponibilidad cuando se selecciona una fecha
		loadAvailability();
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
		setCurrentStep(3);
	};

	const handleFormSubmit = async (data: any) => {
		// Refrescar disponibilidad después de crear la cita
		await loadAvailability();
		
		// Cerrar modal y notificar éxito
		onSuccess();
		onClose();
		
		// Resetear estado
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
	};

	const handleBackToCalendar = () => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
		loadAvailability();
	};

	const handleBackToTime = () => {
		setCurrentStep(2);
		setSelectedTime(null);
	};

	// Manejar el portal del modal
	useEffect(() => {
		if (!isOpen) {
			const existingModal = document.getElementById('create-appointment-modal-root');
			if (existingModal) {
				render(null, existingModal);
				existingModal.remove();
			}
			setModalRoot(null);
			// Resetear estado al cerrar
			setCurrentStep(1);
			setSelectedDate(null);
			setSelectedTime(null);
			return;
		}

		let root = document.getElementById('create-appointment-modal-root');
		if (!root) {
			root = document.createElement('div');
			root.id = 'create-appointment-modal-root';
			root.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;';
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
		if (!modalRoot || !isOpen) return;

		const ModalContent = () => (
			<div 
				class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
				onClick={(e) => {
					if (e.target === e.currentTarget && currentStep === 1) {
						onClose();
					}
				}}
			>
				<div 
					class="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header con botón cerrar */}
					<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
						<h2 class="text-xl font-semibold text-gray-900">Crear Nueva Cita</h2>
						<button
							onClick={onClose}
							class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-md"
							disabled={isLoading}
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Contenido con scroll */}
					<div class="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
						{/* Progress Indicator personalizado para 3 pasos */}
						<div class="mb-8 max-w-2xl mx-auto">
							<div class="flex items-center justify-between relative">
								{/* Línea de progreso */}
								<div class="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
									<div class="h-full bg-gray-900 transition-all duration-500 ease-out" style={`width: ${((currentStep - 1) / 2) * 100}%`}></div>
								</div>
								
								{/* Paso 1: Fecha */}
								<div class="flex flex-col items-center flex-1">
									<div class={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 ${
										currentStep >= 1
											? 'bg-gray-900 text-white border-gray-900 scale-110'
											: 'bg-white text-gray-400 border-gray-200'
									}`}>
										{currentStep > 1 ? (
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										) : '1'}
									</div>
									<span class={`mt-2 text-xs font-semibold uppercase tracking-wide ${
										currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
									}`}>Fecha</span>
								</div>
								
								{/* Paso 2: Hora */}
								<div class="flex flex-col items-center flex-1">
									<div class={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 ${
										currentStep >= 2
											? 'bg-gray-900 text-white border-gray-900 scale-110'
											: 'bg-white text-gray-400 border-gray-200'
									}`}>
										{currentStep > 2 ? (
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										) : '2'}
									</div>
									<span class={`mt-2 text-xs font-semibold uppercase tracking-wide ${
										currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
									}`}>Hora</span>
								</div>
								
								{/* Paso 3: Información */}
								<div class="flex flex-col items-center flex-1">
									<div class={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 ${
										currentStep >= 3
											? 'bg-gray-900 text-white border-gray-900 scale-110'
											: 'bg-white text-gray-400 border-gray-200'
									}`}>
										3
									</div>
									<span class={`mt-2 text-xs font-semibold uppercase tracking-wide ${
										currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'
									}`}>Información</span>
								</div>
							</div>
						</div>
						
						{currentStep === 1 && (
							<CalendarCRM 
								availableSlots={availableSlots}
								onDateSelect={handleDateSelect}
								selectedDate={selectedDate}
							/>
						)}
						
						{currentStep === 2 && (
							<TimeSlotsCRM
								selectedDate={selectedDate}
								selectedTime={selectedTime}
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
							/>
						)}
					</div>
				</div>
			</div>
		);

		render(<ModalContent />, modalRoot);
	}, [modalRoot, isOpen, currentStep, selectedDate, selectedTime, availableSlots, slotsForSelectedDate, isLoading, onClose, onSuccess]);

	return null;
}
