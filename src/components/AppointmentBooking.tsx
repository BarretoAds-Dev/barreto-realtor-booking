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

export default function AppointmentBooking({ availableSlots, config }: Props) {
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [appointmentData, setAppointmentData] = useState<any>(null);

	// Encontrar slots para la fecha seleccionada
	const slotsForSelectedDate = useMemo(() => {
		if (!selectedDate) return [];
		const dayData = availableSlots.find(slot => slot.date === selectedDate);
		return dayData?.slots || [];
	}, [selectedDate, availableSlots]);

	const handleDateSelect = (date: Date) => {
		const dateStr = date.toISOString().split('T')[0];
		setSelectedDate(dateStr);
		setSelectedTime(null);
		setCurrentStep(2);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
		setCurrentStep(3);
	};

	const handleFormSubmit = (data: any) => {
		setAppointmentData(data);
		setCurrentStep(4);
	};

	const handleBackToCalendar = () => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
	};

	const handleBackToTime = () => {
		setCurrentStep(2);
		setSelectedTime(null);
	};

	const handleNewAppointment = () => {
		setCurrentStep(1);
		setSelectedDate(null);
		setSelectedTime(null);
		setAppointmentData(null);
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
							selectedDate={selectedDate ? new Date(selectedDate) : null}
						/>
					)}
					
					{currentStep === 2 && (
						<TimeSlots
							selectedDate={selectedDate ? new Date(selectedDate) : null}
							selectedTime={selectedTime}
							slots={slotsForSelectedDate}
							onTimeSelect={handleTimeSelect}
							onBack={handleBackToCalendar}
						/>
					)}
					
					{currentStep === 3 && (
						<AppointmentForm
							selectedDate={selectedDate ? new Date(selectedDate) : null}
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

