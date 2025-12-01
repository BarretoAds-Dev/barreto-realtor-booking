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

interface CalendarProps {
	availableSlots: AvailableSlot[];
	onDateSelect: (date: Date) => void;
	selectedDate: Date | null;
}

export default function Calendar({ availableSlots, onDateSelect, selectedDate }: CalendarProps) {
	// Crear Set de fechas disponibles para acceso rápido
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

	// Función helper para formatear fecha en hora local (sin conversión UTC)
	const formatDateLocal = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const isDateAvailable = (date: Date): boolean => {
		const dateStr = formatDateLocal(date);
		// Permitir seleccionar cualquier fecha que tenga slots (disponibles o ocupados)
		return availableDates.has(dateStr);
	};
	
	const hasAvailableSlots = (date: Date): boolean => {
		const dateStr = formatDateLocal(date);
		const daySlots = availableSlots.find(slot => slot.date === dateStr);
		if (!daySlots) return false;
		// Verificar si tiene al menos un slot disponible
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
				<h2 class="text-2xl font-bold text-white mb-2 tracking-tight">Selecciona una fecha</h2>
				<p class="text-gray-300 text-sm font-light">Elige el día que mejor te convenga</p>
			</div>

			{/* Mensaje de advertencia para día actual */}
			{showTodayMessage && (
				<div class="mb-4 bg-yellow-500/20 border-2 border-yellow-500/50 backdrop-blur-xl p-4 rounded animate-pulse">
					<div class="flex items-start gap-3">
						<svg class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<div class="flex-1">
							<p class="text-sm font-semibold text-yellow-200 mb-1">Las citas deben tener 24 horas de anticipación</p>
							<p class="text-xs text-yellow-300">Por favor selecciona una cita para el día siguiente o posterior.</p>
						</div>
						<button
							onClick={() => setShowTodayMessage(false)}
							class="text-yellow-400 hover:text-yellow-200"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			)}
			
			{/* Navegación del mes */}
			<div class="flex items-center justify-between mb-6 bg-slate-700/40 backdrop-blur-xl p-3 border-2 border-slate-600/40 shadow-md shadow-black/20">
				<button
					type="button"
					onClick={prevMonth}
					class="p-2 hover:bg-[#003d82]/30 backdrop-blur-sm transition-all duration-200 active:scale-95 border-2 border-transparent hover:border-[#00a0df]/30"
					aria-label="Mes anterior"
				>
					<svg class="w-6 h-6 text-gray-300 hover:text-[#00a0df] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<h3 class="text-lg font-bold text-white">
					{months[currentDate.getMonth()]} {currentDate.getFullYear()}
				</h3>
				<button
					type="button"
					onClick={nextMonth}
					class="p-2 hover:bg-[#003d82]/30 backdrop-blur-sm transition-all duration-200 active:scale-95 border-2 border-transparent hover:border-[#00a0df]/30"
					aria-label="Mes siguiente"
				>
					<svg class="w-6 h-6 text-gray-300 hover:text-[#00a0df] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			{/* Días de la semana */}
			<div class="grid grid-cols-7 gap-2 mb-3">
				{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
					<div key={day} class="text-center text-xs font-semibold text-gray-400 py-2">
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
					
					if (isPast || !isAvailable) {
						dayBgClass = 'bg-slate-800/20 border-slate-700/20 text-slate-600';
						dayHoverClass = '';
					} else {
						switch (availabilityStatus) {
							case 'available':
								dayBgClass = 'bg-green-500/20 border-green-400/50 text-green-100';
								dayHoverClass = 'hover:bg-green-500/30 hover:border-green-400 hover:text-green-50';
								break;
							case 'half-full':
								dayBgClass = 'bg-orange-500/20 border-orange-400/50 text-orange-100';
								dayHoverClass = 'hover:bg-orange-500/30 hover:border-orange-400 hover:text-orange-50';
								break;
							case 'full':
								dayBgClass = 'bg-red-500/20 border-red-400/50 text-red-100';
								dayHoverClass = 'hover:bg-red-500/30 hover:border-red-400 hover:text-red-50';
								break;
							case 'none':
							default:
								dayBgClass = 'bg-slate-800/20 border-slate-700/20 text-slate-600';
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
								py-3 px-2 text-sm font-bold transition-all duration-200 backdrop-blur-sm relative border-2 rounded-md
								${dayBgClass}
								${!isPast && isAvailable && availabilityStatus !== 'full' && availabilityStatus !== 'none' 
									? `${dayHoverClass} hover:scale-105 active:scale-95 shadow-sm shadow-black/10 hover:shadow-md hover:shadow-black/15 cursor-pointer`
									: 'cursor-not-allowed'
								}
								${isSelected 
									? 'bg-[#003d82] backdrop-blur-xl text-white shadow-md shadow-black/20 scale-105 border-2 border-[#00a0df]/60' 
									: ''
								}
								${isTodayDate && !isSelected && isAvailable && availabilityStatus !== 'full' && availabilityStatus !== 'none'
									? 'ring-2 ring-[#00a0df]/60 ring-offset-2 ring-offset-slate-800/50'
									: ''
								}
								${isTodayDate && isSelected
									? 'bg-[#003d82] backdrop-blur-xl text-white'
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
								<span class="absolute -top-1 -right-1 w-2 h-2 bg-[#00a0df] rounded-full"></span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

