/** @jsxImportSource preact */

interface Appointment {
	id: string;
	date: string;
	time: string;
	duration: number;
	client: {
		name: string;
		email: string;
		phone?: string;
		notes?: string;
	};
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
	createdAt: string;
}

interface AppointmentCardProps {
	appointment: Appointment;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'confirmed':
				return 'bg-green-500/20 text-green-400 border-green-500/30';
			case 'pending':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
			case 'cancelled':
				return 'bg-red-500/20 text-red-400 border-red-500/30';
			case 'completed':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
			default:
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'confirmed':
				return 'Confirmada';
			case 'pending':
				return 'Pendiente';
			case 'cancelled':
				return 'Cancelada';
			case 'completed':
				return 'Completada';
			default:
				return status;
		}
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatDateTime = (dateStr: string, timeStr: string) => {
		const date = new Date(`${dateStr}T${timeStr}`);
		return date.toLocaleString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatCreatedAt = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div class="bg-slate-800/40 backdrop-blur-xl border-2 border-slate-700/50 shadow-md shadow-black/20 hover:shadow-lg hover:shadow-black/30 transition-all hover:border-[#00a0df]/30">
			<div class="p-6">
				<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					{/* Información principal */}
					<div class="flex-1">
						<div class="flex items-start justify-between mb-3">
							<div>
								<h3 class="text-xl font-bold text-white mb-1">{appointment.client.name}</h3>
								<p class="text-sm text-gray-400">{appointment.client.email}</p>
							</div>
							<span class={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${getStatusColor(appointment.status)}`}>
								{getStatusLabel(appointment.status)}
							</span>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							{/* Fecha y hora */}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5 text-[#00a0df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<div>
									<div class="text-xs text-gray-400 uppercase tracking-wide">Fecha y hora</div>
									<div class="text-sm font-semibold text-white">
										{formatDateTime(appointment.date, appointment.time)}
									</div>
									<div class="text-xs text-gray-500">
										{formatDate(appointment.date)}
									</div>
								</div>
							</div>

							{/* Duración */}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5 text-[#00a0df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<div class="text-xs text-gray-400 uppercase tracking-wide">Duración</div>
									<div class="text-sm font-semibold text-white">{appointment.duration} minutos</div>
								</div>
							</div>

							{/* Teléfono */}
							{appointment.client.phone && (
								<div class="flex items-center gap-3">
									<svg class="w-5 h-5 text-[#00a0df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<div>
										<div class="text-xs text-gray-400 uppercase tracking-wide">Teléfono</div>
										<div class="text-sm font-semibold text-white">{appointment.client.phone}</div>
									</div>
								</div>
							)}

							{/* Creado */}
							<div class="flex items-center gap-3">
								<svg class="w-5 h-5 text-[#00a0df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<div class="text-xs text-gray-400 uppercase tracking-wide">Creada</div>
									<div class="text-sm font-semibold text-white">{formatCreatedAt(appointment.createdAt)}</div>
								</div>
							</div>
						</div>

						{/* Notas */}
						{appointment.client.notes && (
							<div class="mt-4 pt-4 border-t border-slate-700/50">
								<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</div>
								<p class="text-sm text-gray-300">{appointment.client.notes}</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

