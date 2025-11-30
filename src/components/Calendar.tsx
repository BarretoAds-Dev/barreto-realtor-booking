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

	const isDatePast = (date: Date): boolean => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	};

	const isDateAvailable = (date: Date): boolean => {
		const dateStr = date.toISOString().split('T')[0];
		return availableDates.has(dateStr);
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

	const prevMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
	};

	const nextMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
	};

	const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
	const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
	const daysInMonth = lastDay.getDate();
	const startingDayOfWeek = firstDay.getDay();

	const emptyDays = Array(startingDayOfWeek).fill(null);
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

	return (
		<div class="max-w-md mx-auto transition-all duration-500">
			<div class="text-center mb-6">
				<h2 class="text-2xl font-bold text-white mb-2 tracking-tight">Selecciona una fecha</h2>
				<p class="text-gray-300 text-sm font-light">Elige el día que mejor te convenga</p>
			</div>
			
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
					const isSelected = isDateSelected(date);
					const isTodayDate = isToday(date);

					return (
						<button
							key={day}
							type="button"
							onClick={() => {
								if (!isPast && isAvailable) {
									onDateSelect(date);
								}
							}}
							disabled={isPast || !isAvailable}
							class={`
								py-3 px-2 text-sm font-bold transition-all duration-200 backdrop-blur-sm
								${isPast || !isAvailable
									? 'text-slate-600 cursor-not-allowed bg-slate-800/20 backdrop-blur-sm border-2 border-slate-700/20' 
									: 'text-white hover:bg-slate-700/50 backdrop-blur-xl hover:text-[#00a0df] hover:scale-105 active:scale-95 border-2 border-transparent hover:border-[#00a0df]/30 shadow-sm shadow-black/10 hover:shadow-md hover:shadow-black/15'
								}
								${isSelected 
									? 'bg-[#003d82] backdrop-blur-xl text-white shadow-md shadow-black/20 scale-105 border-2 border-[#00a0df]/60' 
									: ''
								}
								${isTodayDate && !isSelected && isAvailable
									? 'ring-2 ring-[#00a0df]/40 ring-offset-2 ring-offset-slate-800/50'
									: ''
								}
							`}
						>
							{day}
						</button>
					);
				})}
			</div>
		</div>
	);
}

