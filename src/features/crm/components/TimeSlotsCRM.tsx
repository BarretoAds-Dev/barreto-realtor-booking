/** @jsxImportSource preact */

interface TimeSlot {
	time: string;
	available: boolean;
	capacity: number;
	booked: number;
	enabled?: boolean;
}

interface TimeSlotsCRMProps {
	selectedDate: Date | null;
	selectedTime: string | null;
	slots: TimeSlot[];
	onTimeSelect: (time: string) => void;
	onBack: () => void;
}

export default function TimeSlotsCRM({ selectedDate, selectedTime, slots, onTimeSelect, onBack }: TimeSlotsCRMProps) {
	if (!selectedDate) return null;

	const dateStr = selectedDate.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const getSlotStatus = (slot: TimeSlot): 'available' | 'occupied' | 'disabled' => {
		if (slot.enabled === false) return 'disabled';
		if (slot.booked >= slot.capacity) return 'occupied';
		return 'available';
	};

	const sortedSlots = [...slots].sort((a, b) => {
		const timeA = a.time.split(':').map(Number);
		const timeB = b.time.split(':').map(Number);
		return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
	});

	const hasAvailableSlots = sortedSlots.some(slot => getSlotStatus(slot) === 'available');

	return (
		<div class="max-w-2xl mx-auto transition-all duration-500">
			<div class="text-center mb-6">
				<button
					onClick={onBack}
					class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors font-semibold uppercase tracking-wide"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Cambiar fecha
				</button>
				<h2 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Selecciona una hora</h2>
				<p class="text-gray-600 text-sm">
					Horarios para <span class="font-semibold text-gray-900">
						{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
					</span>
				</p>
				{!hasAvailableSlots && (
					<p class="text-yellow-600 text-sm font-medium mt-2">
						⚠️ No hay horarios disponibles en este momento
					</p>
				)}
			</div>
			
			<div class="bg-white p-6 border border-gray-200 rounded-lg shadow-md">
				{/* Leyenda de colores */}
				<div class="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
						<span>Disponible</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
						<span>Ocupado</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-4 h-4 bg-gray-100 border border-gray-400 rounded"></div>
						<span>No disponible</span>
					</div>
				</div>
				
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{sortedSlots.map((slot) => {
						const isSelected = selectedTime === slot.time;
						const status = getSlotStatus(slot);
						const remaining = slot.capacity - slot.booked;
						const isClickable = status === 'available';
						
						let baseClasses = '';
						let selectedClasses = '';
						
						if (status === 'available') {
							baseClasses = 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400';
							selectedClasses = 'bg-green-600 border-green-600 text-white scale-105 shadow-lg';
						} else if (status === 'occupied') {
							baseClasses = 'bg-red-50 border-red-300 text-red-700 cursor-not-allowed opacity-75';
							selectedClasses = 'bg-red-600 border-red-600 text-white';
						} else {
							baseClasses = 'bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed opacity-50';
							selectedClasses = 'bg-gray-400 border-gray-400 text-white';
						}
						
						return (
							<button
								key={slot.time}
								type="button"
								disabled={!isClickable}
								onClick={() => isClickable && onTimeSelect(slot.time)}
								class={`
									py-3 px-4 text-sm font-bold transition-all duration-200 relative
									border-2 rounded-md shadow-sm hover:shadow-md
									${isSelected && isClickable
										? selectedClasses
										: baseClasses
									}
									${isClickable ? 'hover:scale-105 active:scale-95' : ''}
								`}
								title={
									status === 'available' 
										? `Disponible (${remaining} cupo${remaining > 1 ? 's' : ''})`
										: status === 'occupied'
										? `Ocupado (${slot.booked}/${slot.capacity})`
										: 'No disponible'
								}
							>
								{slot.time}
								{status === 'occupied' && (
									<span class="absolute top-1 right-1 text-xs">🔒</span>
								)}
								{status === 'available' && remaining < slot.capacity && (
									<span class="absolute top-1 right-1 text-xs">
										{remaining}/{slot.capacity}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

