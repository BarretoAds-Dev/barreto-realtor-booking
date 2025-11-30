
/** @jsxImportSource preact */

interface TimeSlot {
	time: string;
	available: boolean;
	capacity: number;
	booked: number;
	enabled?: boolean;
}

interface TimeSlotsProps {
	selectedDate: Date | null;
	selectedTime: string | null;
	slots: TimeSlot[];
	onTimeSelect: (time: string) => void;
	onBack: () => void;
}

export default function TimeSlots({ selectedDate, selectedTime, slots, onTimeSelect, onBack }: TimeSlotsProps) {
	if (!selectedDate) return null;

	const dateStr = selectedDate.toLocaleDateString('es-ES', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	// Determinar el estado de cada slot
	const getSlotStatus = (slot: TimeSlot): 'available' | 'occupied' | 'disabled' => {
		// Si enabled es false o undefined pero el slot no está disponible, considerarlo deshabilitado
		if (slot.enabled === false) return 'disabled';
		// Si está ocupado (booked >= capacity)
		if (slot.booked >= slot.capacity) return 'occupied';
		// Si está disponible
		return 'available';
	};

	// Ordenar slots por hora
	const sortedSlots = [...slots].sort((a, b) => {
		const timeA = a.time.split(':').map(Number);
		const timeB = b.time.split(':').map(Number);
		return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
	});

	const hasAvailableSlots = sortedSlots.some(slot => getSlotStatus(slot) === 'available');

	return (
		<div className="max-w-2xl mx-auto transition-all duration-500">
			<div className="text-center mb-6">
				<button
					onClick={onBack}
					className="inline-flex items-center text-sm text-gray-300 hover:text-[#00a0df] mb-4 transition-colors font-semibold uppercase tracking-wide"
				>
					<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
					</svg>
					Cambiar fecha
				</button>
				<h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Selecciona una hora</h2>
				<p className="text-gray-300 text-sm font-light">
					Horarios para <span className="font-semibold text-[#00a0df]">
						{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
					</span>
				</p>
				{!hasAvailableSlots && (
					<p className="text-yellow-400 text-sm font-medium mt-2">
						⚠️ No hay horarios disponibles en este momento
					</p>
				)}
			</div>
			
			<div className="bg-slate-700/30 backdrop-blur-xl p-6 border-2 border-slate-600/40 shadow-md shadow-black/20">
				{/* Leyenda de colores */}
				<div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-300">
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-green-500/60 border border-green-400 rounded"></div>
						<span>Disponible</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-red-500/60 border border-red-400 rounded"></div>
						<span>Ocupado</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-4 bg-gray-500/40 border border-gray-500 rounded"></div>
						<span>No disponible</span>
					</div>
				</div>
				
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{sortedSlots.map((slot) => {
						const isSelected = selectedTime === slot.time;
						const status = getSlotStatus(slot);
						const remaining = slot.capacity - slot.booked;
						const isClickable = status === 'available';
						
						// Colores según el estado
						let baseClasses = '';
						let selectedClasses = '';
						
						if (status === 'available') {
							// Verde: Disponible
							baseClasses = 'bg-green-500/20 border-green-400/50 text-green-100 hover:bg-green-500/30 hover:border-green-400';
							selectedClasses = 'bg-green-600/40 border-green-400 scale-105 shadow-lg shadow-green-500/20';
						} else if (status === 'occupied') {
							// Rojo: Ocupado
							baseClasses = 'bg-red-500/20 border-red-400/50 text-red-100 cursor-not-allowed opacity-75';
							selectedClasses = 'bg-red-600/40 border-red-400';
						} else {
							// Gris: Deshabilitado
							baseClasses = 'bg-gray-500/20 border-gray-500/50 text-gray-400 cursor-not-allowed opacity-50';
							selectedClasses = 'bg-gray-600/40 border-gray-500';
						}
						
						return (
							<button
								key={slot.time}
								type="button"
								disabled={!isClickable}
								onClick={() => isClickable && onTimeSelect(slot.time)}
								className={`
									py-3 px-4 text-sm font-bold transition-all duration-200 backdrop-blur-xl relative
									border-2 rounded
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
									<span className="absolute top-1 right-1 text-xs">🔒</span>
								)}
								{status === 'available' && remaining < slot.capacity && (
									<span className="absolute top-1 right-1 text-xs">
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

