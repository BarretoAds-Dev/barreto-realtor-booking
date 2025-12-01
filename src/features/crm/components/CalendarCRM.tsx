/** @jsxImportSource preact */
import { useState, useMemo } from 'preact/hooks';

const months = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface AvailableSlot {
	date: string;
	dayOfWeek: string;
	slots: Array<{
		time: string;
		available: boolean;
		capacity: number;
		booked: number;
	}>;
}

interface CalendarCRMProps {
	availableSlots: AvailableSlot[];
	onDateSelect: (date: Date) => void;
	selectedDate: Date | null;
}

export default function CalendarCRM({ availableSlots, onDateSelect, selectedDate }: CalendarCRMProps) {
	const availableDates = useMemo(() => {
		return new Set(availableSlots.map(slot => slot.date));
	}, [availableSlots]);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [showTodayMessage, setShowTodayMessage] = useState(false);

	const isDatePast = (date: Date): boolean => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	};

	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const isDateAvailable = (date: Date): boolean => {
		const dateStr = formatDateLocal(date);
		return availableDates.has(dateStr);
	};
	
	const hasAvailableSlots = (date: Date): boolean => {
		const dateStr = formatDateLocal(date);
		const daySlots = availableSlots.find(slot => slot.date === dateStr);
		if (!daySlots) return false;
		return daySlots.slots.some(slot => slot.available && slot.booked < slot.capacity);
	};

	const getDayAvailabilityStatus = (date: Date): 'available' | 'half-full' | 'full' | 'none' => {
		const dateStr = formatDateLocal(date);
		const daySlots = availableSlots.find(slot => slot.date === dateStr);
		if (!daySlots || daySlots.slots.length === 0) return 'none';
		
		const enabledSlots = daySlots.slots.filter(slot => slot.enabled !== false);
		if (enabledSlots.length === 0) return 'none';
		
		const totalCapacity = enabledSlots.reduce((sum, slot) => sum + slot.capacity, 0);
		const totalBooked = enabledSlots.reduce((sum, slot) => sum + slot.booked, 0);
		
		if (totalCapacity === 0) return 'none';
		
		const occupancyRate = totalBooked / totalCapacity;
		
		// Si todos los slots están completamente ocupados
		const allFull = enabledSlots.every(slot => slot.booked >= slot.capacity);
		if (allFull) return 'full';
		
		// Si hay slots disponibles
		const hasAvailable = enabledSlots.some(slot => slot.booked < slot.capacity);
		if (!hasAvailable) return 'full';
		
		// Si está entre 50% y 99% ocupado, es medio lleno
		if (occupancyRate >= 0.5 && occupancyRate < 1) return 'half-full';
		
		// Si está menos del 50% ocupado, está disponible
		return 'available';
	};

	const isToday = (date: Date): boolean => {
		const today = new Date();
		return date.getDate() === today.getDate() &&
			   date.getMonth() === today.getMonth() &&
			   date.getFullYear() === today.getFullYear();
	};

	const isDateSelected = (date: Date): boolean => {
		if (!selectedDate) return false;
		return date.getDate() === selectedDate.getDate() &&
			   date.getMonth() === selectedDate.getMonth() &&
			   date.getFullYear() === selectedDate.getFullYear();
	};

	const prevMonth = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			newDate.setMonth(prev.getMonth() - 1);
			return newDate;
		});
	};

	const nextMonth = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		setCurrentDate((prev) => {
			const newDate = new Date(prev);
			newDate.setMonth(prev.getMonth() + 1);
			return newDate;
		});
	};

	const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
	const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay();

	const emptyDays = Array(startingDayOfWeek).fill(null);
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

	const handleDateClick = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const clickedDate = new Date(date);
		clickedDate.setHours(0, 0, 0, 0);
		
		// Si es el día actual, mostrar mensaje
		if (clickedDate.getTime() === today.getTime()) {
			setShowTodayMessage(true);
			setTimeout(() => {
				setShowTodayMessage(false);
			}, 5000);
			return;
		}
		
		// Si no es el día actual y está disponible, seleccionar
		if (!isDatePast(date) && isDateAvailable(date)) {
			onDateSelect(date);
		}
	};

	return (
		<div class="max-w-md mx-auto transition-all duration-500">
			<div class="text-center mb-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Selecciona una fecha</h2>
				<p class="text-gray-600 text-sm">Elige el día que mejor te convenga</p>
			</div>

			{/* Mensaje de advertencia para día actual */}
			{showTodayMessage && (
				<div class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-pulse">
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<div class="flex-1">
							<p class="text-sm font-semibold text-yellow-800 mb-1">Las citas deben tener 24 horas de anticipación</p>
							<p class="text-xs text-yellow-700">Por favor selecciona una cita para el día siguiente o posterior.</p>
						</div>
						<button
							onClick={() => setShowTodayMessage(false)}
							class="text-yellow-600 hover:text-yellow-800"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			)}
			
			{/* Navegación del mes */}
			<div class="flex items-center justify-between mb-6 bg-white p-3 border border-gray-200 rounded-lg shadow-md">
				<button
					type="button"
					onClick={prevMonth}
					class="p-2 hover:bg-gray-100 transition-all duration-200 rounded-md"
					aria-label="Mes anterior"
				>
					<svg class="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<h3 class="text-lg font-bold text-gray-900">
					{months[currentDate.getMonth()]} {currentDate.getFullYear()}
				</h3>
				<button
					type="button"
					onClick={nextMonth}
					class="p-2 hover:bg-gray-100 transition-all duration-200 rounded-md"
					aria-label="Mes siguiente"
				>
					<svg class="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			{/* Días de la semana */}
			<div class="grid grid-cols-7 gap-2 mb-3">
				{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
					<div key={day} class="text-center text-xs font-semibold text-gray-500 py-2">
						{day}
					</div>
				))}
			</div>

			{/* Calendario */}
			<div class="grid grid-cols-7 gap-2">
				{emptyDays.map((_, i) => (
					<div key={`empty-${i}`}></div>
				))}
				{days.map((day) => {
					const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
					const isPast = isDatePast(date);
					const isAvailable = isDateAvailable(date);
					const availabilityStatus = getDayAvailabilityStatus(date);
					const isSelected = isDateSelected(date);
					const isTodayDate = isToday(date);

					// Determinar colores según el estado de disponibilidad
					let dayBgClass = '';
					let dayHoverClass = '';
					let dayBorderClass = '';
					
					if (isPast || !isAvailable) {
						dayBgClass = 'bg-gray-50 border-gray-200 text-gray-300';
						dayHoverClass = '';
					} else {
						switch (availabilityStatus) {
							case 'available':
								dayBgClass = 'bg-green-50 border-green-200 text-gray-900';
								dayHoverClass = 'hover:bg-green-100 hover:border-green-300 hover:text-green-700';
								break;
							case 'half-full':
								dayBgClass = 'bg-orange-50 border-orange-200 text-gray-900';
								dayHoverClass = 'hover:bg-orange-100 hover:border-orange-300 hover:text-orange-700';
								break;
							case 'full':
								dayBgClass = 'bg-red-50 border-red-200 text-gray-900';
								dayHoverClass = 'hover:bg-red-100 hover:border-red-300 hover:text-red-700';
								break;
							case 'none':
							default:
								dayBgClass = 'bg-gray-50 border-gray-200 text-gray-300';
								dayHoverClass = '';
								break;
						}
					}

					return (
						<button
							key={day}
							type="button"
							onClick={() => handleDateClick(date)}
							disabled={isPast || !isAvailable || availabilityStatus === 'full' || availabilityStatus === 'none'}
							class={`
								py-3 px-2 text-sm font-bold transition-all duration-200 relative rounded-md border
								${dayBgClass}
								${!isPast && isAvailable && availabilityStatus !== 'full' && availabilityStatus !== 'none' 
									? `${dayHoverClass} hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer`
									: 'cursor-not-allowed'
								}
								${isSelected 
									? 'bg-gray-900 text-white shadow-md scale-105 border-2 border-gray-900' 
									: ''
								}
								${isTodayDate && !isSelected && isAvailable && availabilityStatus !== 'full' && availabilityStatus !== 'none'
									? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white'
									: ''
								}
								${isTodayDate && isSelected
									? 'bg-gray-900 text-white'
									: ''
								}
							`}
							title={
								isTodayDate 
									? 'Hoy - Las citas requieren 24 horas de anticipación'
									: availabilityStatus === 'available'
									? 'Disponible'
									: availabilityStatus === 'half-full'
									? 'Medio lleno'
									: availabilityStatus === 'full'
									? 'Lleno'
									: 'No disponible'
							}
						>
							{day}
							{isTodayDate && (
								<span class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

