/** @jsxImportSource preact */
import { useState, useMemo } from 'preact/hooks';
import AppointmentCard from './AppointmentCard';

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

interface AppointmentsDashboardProps {
	appointments: Appointment[];
}

export default function AppointmentsDashboard({ appointments }: AppointmentsDashboardProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
	const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

	// Calcular estadísticas
	const stats = useMemo(() => {
		const total = appointments.length;
		const pending = appointments.filter(a => a.status === 'pending').length;
		const confirmed = appointments.filter(a => a.status === 'confirmed').length;
		const cancelled = appointments.filter(a => a.status === 'cancelled').length;
		const completed = appointments.filter(a => a.status === 'completed').length;

		return { total, pending, confirmed, cancelled, completed };
	}, [appointments]);

	// Filtrar citas
	const filteredAppointments = useMemo(() => {
		let filtered = [...appointments];

		// Filtro de búsqueda
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(apt => 
				apt.client.name.toLowerCase().includes(query) ||
				apt.client.email.toLowerCase().includes(query) ||
				(apt.client.phone && apt.client.phone.toLowerCase().includes(query))
			);
		}

		// Filtro de estado
		if (statusFilter !== 'all') {
			filtered = filtered.filter(apt => apt.status === statusFilter);
		}

		// Filtro de fecha
		if (dateFilter !== 'all') {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			filtered = filtered.filter(apt => {
				const aptDate = new Date(apt.date);
				aptDate.setHours(0, 0, 0, 0);

				switch (dateFilter) {
					case 'today':
						return aptDate.getTime() === today.getTime();
					case 'week':
						const weekAgo = new Date(today);
						weekAgo.setDate(weekAgo.getDate() - 7);
						return aptDate >= weekAgo;
					case 'month':
						const monthAgo = new Date(today);
						monthAgo.setMonth(monthAgo.getMonth() - 1);
						return aptDate >= monthAgo;
					default:
						return true;
				}
			});
		}

		return filtered;
	}, [appointments, searchQuery, statusFilter, dateFilter]);

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

	return (
		<div class="space-y-6">
			{/* Estadísticas */}
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div class="bg-slate-800/40 backdrop-blur-xl p-4 border-2 border-slate-700/50 shadow-md shadow-black/20">
					<div class="text-sm text-gray-400 mb-1 uppercase tracking-wide">Total</div>
					<div class="text-2xl font-bold text-white">{stats.total}</div>
				</div>
				<div class="bg-slate-800/40 backdrop-blur-xl p-4 border-2 border-slate-700/50 shadow-md shadow-black/20">
					<div class="text-sm text-gray-400 mb-1 uppercase tracking-wide">Pendientes</div>
					<div class="text-2xl font-bold text-yellow-400">{stats.pending}</div>
				</div>
				<div class="bg-slate-800/40 backdrop-blur-xl p-4 border-2 border-slate-700/50 shadow-md shadow-black/20">
					<div class="text-sm text-gray-400 mb-1 uppercase tracking-wide">Confirmadas</div>
					<div class="text-2xl font-bold text-green-400">{stats.confirmed}</div>
				</div>
				<div class="bg-slate-800/40 backdrop-blur-xl p-4 border-2 border-slate-700/50 shadow-md shadow-black/20">
					<div class="text-sm text-gray-400 mb-1 uppercase tracking-wide">Canceladas</div>
					<div class="text-2xl font-bold text-red-400">{stats.cancelled}</div>
				</div>
				<div class="bg-slate-800/40 backdrop-blur-xl p-4 border-2 border-slate-700/50 shadow-md shadow-black/20">
					<div class="text-sm text-gray-400 mb-1 uppercase tracking-wide">Completadas</div>
					<div class="text-2xl font-bold text-blue-400">{stats.completed}</div>
				</div>
			</div>

			{/* Filtros */}
			<div class="bg-slate-800/40 backdrop-blur-xl p-6 border-2 border-slate-700/50 shadow-md shadow-black/20">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Búsqueda */}
					<div>
						<label class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
							Buscar
						</label>
						<input
							type="text"
							value={searchQuery}
							onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
							placeholder="Nombre, email o teléfono..."
							class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white placeholder-gray-400 shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
						/>
					</div>

					{/* Filtro de estado */}
					<div>
						<label class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
							Estado
						</label>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as any)}
							class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
						>
							<option value="all">Todos</option>
							<option value="pending">Pendientes</option>
							<option value="confirmed">Confirmadas</option>
							<option value="cancelled">Canceladas</option>
							<option value="completed">Completadas</option>
						</select>
					</div>

					{/* Filtro de fecha */}
					<div>
						<label class="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
							Fecha
						</label>
						<select
							value={dateFilter}
							onChange={(e) => setDateFilter((e.target as HTMLSelectElement).value as any)}
							class="w-full px-4 py-3 border-2 border-slate-600/50 focus:ring-2 focus:ring-[#00a0df]/30 focus:border-[#00a0df]/70 outline-none transition-all bg-slate-700/40 backdrop-blur-xl text-white appearance-none cursor-pointer shadow-sm shadow-black/15 hover:bg-slate-700/50 font-light"
						>
							<option value="all">Todas</option>
							<option value="today">Hoy</option>
							<option value="week">Última semana</option>
							<option value="month">Último mes</option>
						</select>
					</div>
				</div>
			</div>

			{/* Lista de citas */}
			<div class="space-y-4">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold text-white">
						Citas ({filteredAppointments.length})
					</h2>
				</div>

				{filteredAppointments.length === 0 ? (
					<div class="bg-slate-800/40 backdrop-blur-xl p-12 border-2 border-slate-700/50 shadow-md shadow-black/20 text-center">
						<svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<p class="text-gray-400 text-lg">No se encontraron citas con los filtros seleccionados</p>
					</div>
				) : (
					filteredAppointments.map((appointment) => (
						<AppointmentCard key={appointment.id} appointment={appointment} />
					))
				)}
			</div>
		</div>
	);
}

