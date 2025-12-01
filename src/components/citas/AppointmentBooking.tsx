/** @jsxImportSource preact */
import { useState, useMemo } from 'preact/hooks';
import Calendar from './Calendar';
import TimeSlots from './TimeSlots';
import AppointmentForm from './AppointmentForm';
import ConfirmationPanel from './ConfirmationPanel';
import ProgressIndicator from './ProgressIndicator';

type Step = 1 | 2 | 3 | 4;

interface AvailableSlot {
	date: string;
	dayOfWeek: string;
	slots: Array<{
		time: string;
		available: boolean;
		capacity: number;
		booked: number;
	}>;
	metadata?: {
		notes?: string;
		specialHours?: boolean;
	};
}

interface Config {
	slotDuration: number;
	bufferTime: number;
	businessHours: Record<string, any>;
}

interface Props {
	availableSlots: AvailableSlot[];
	config: Config;
}

export default function AppointmentBooking({ availableSlots: initialAvailableSlots, config }: Props) {
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [appointmentData, setAppointmentData] = useState<any>(null);
	const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>(initialAvailableSlots);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Encontrar slots para la fecha seleccionada
	const slotsForSelectedDate = useMemo(() => {
		if (!selectedDate) return [];
		const dayData = availableSlots.find(slot => slot.date === selectedDate);
		return dayData?.slots || [];
	}, [selectedDate, availableSlots]);

	// Función helper para formatear fecha en hora local (sin conversión UTC)
	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Función optimizada para refrescar disponibilidad
	const refreshAvailability = async () => {
		if (isRefreshing) return; // Evitar llamadas simultáneas
		
		setIsRefreshing(true);
		try {
			const startDate = new Date().toISOString().split('T')[0];
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 6);
			const endDateStr = endDate.toISOString().split('T')[0];
			
			const response = await fetch(`/api/citas/availability?start=${startDate}&end=${endDateStr}`);
			if (response.ok) {
				const refreshedSlots = await response.json();
				setAvailableSlots(refreshedSlots);
			}
		} catch (error) {
			console.warn('Error al refrescar disponibilidad:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleDateSelect = async (date: Date) => {
		const dateStr = formatDateLocal(date);
		setSelectedDate(dateStr);
		setSelectedTime(null);
		setCurrentStep(2);
		// Refrescar disponibilidad cuando se selecciona una fecha (solo si no está refrescando)
		if (!isRefreshing) {
			refreshAvailability();
		}
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
		setCurrentStep(3);
	};

	const handleFormSubmit = async (data: any) => {
		setAppointmentData(data);
		
		// Refrescar disponibilidad inmediatamente después de crear la cita
		// Esto asegura que el slot se marque como ocupado
		refreshAvailability();
		
		// Mostrar mensaje de éxito y volver a la selección de horarios
		// para que el usuario vea que el slot está en rojo
		setSuccessMessage(`¡Cita creada exitosamente para ${data.date} a las ${data.time}!`);
		setSelectedTime(null); // Limpiar la selección de hora
		setCurrentStep(2); // Volver a la selección de horarios
		
		// Ocultar el mensaje después de 5 segundos y volver al inicio
		setTimeout(() => {
			setSuccessMessage(null);
			// Volver al paso 1 (calendario) después de que desaparezca el mensaje
			setCurrentStep(1);
			setSelectedDate(null);
			setSelectedTime(null);
		}, 5000);
	};

	const handleBackToCalendar = async () => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
		// Refrescar disponibilidad cuando se vuelve al calendario (solo si no está refrescando)
		if (!isRefreshing) {
			refreshAvailability();
		}
	};

	const handleBackToTime = () => {
		setCurrentStep(2);
		setSelectedTime(null);
	};

	const handleNewAppointment = async () => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
		setAppointmentData(null);
		// Refrescar disponibilidad después de crear una cita (solo si no está refrescando)
		if (!isRefreshing) {
			refreshAvailability();
		}
	};

	// Función helper para crear Date desde string YYYY-MM-DD en hora local
	const parseDateLocal = (dateStr: string): Date => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day);
	};

	return (
		<>
			<ProgressIndicator currentStep={currentStep} />
			
			<div class="bg-slate-800/40 backdrop-blur-xl shadow-lg shadow-black/30 overflow-hidden border-2 border-slate-700/50 relative">
				<div class="absolute inset-0 bg-gradient-to-br from-[#003d82]/2 via-transparent to-[#00a0df]/2 pointer-events-none"></div>
				<div class="p-6 md:p-10 relative z-10">
					{currentStep === 1 && (
						<Calendar 
							availableSlots={availableSlots}
							onDateSelect={handleDateSelect}
							selectedDate={selectedDate ? parseDateLocal(selectedDate) : null}
						/>
					)}
					
					{currentStep === 2 && (
						<>
							{successMessage && (
								<div class="mb-6 bg-green-500/20 border-2 border-green-500/50 backdrop-blur-xl p-4 rounded animate-pulse">
									<div class="flex items-center gap-3">
										<svg class="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div class="flex-1">
											<p class="text-green-200 text-sm font-semibold">{successMessage}</p>
											<p class="text-green-300 text-xs mt-1">El horario seleccionado ahora aparece en rojo (ocupado).</p>
										</div>
									</div>
								</div>
							)}
							<TimeSlots
								selectedDate={selectedDate ? parseDateLocal(selectedDate) : null}
								selectedTime={selectedTime}
								slots={slotsForSelectedDate}
								onTimeSelect={handleTimeSelect}
								onBack={handleBackToCalendar}
							/>
						</>
					)}
					
					{currentStep === 3 && (
						<AppointmentForm
							selectedDate={selectedDate ? parseDateLocal(selectedDate) : null}
							selectedTime={selectedTime}
							onBack={handleBackToTime}
							onSubmit={handleFormSubmit}
						/>
					)}
					
					{currentStep === 4 && (
						<ConfirmationPanel
							appointmentData={appointmentData}
							onNewAppointment={handleNewAppointment}
						/>
					)}
				</div>
			</div>
		</>
	);
}

