/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';

interface Appointment {
	id: string;
	clientName: string;
	clientEmail: string;
	clientPhone: string | null;
	property: string | null;
	date: string;
	time: string;
	status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
	notes: string | null;
	operationType: 'rentar' | 'comprar';
	budgetRange: string;
	createdAt: string;
}

interface AppointmentsTableProps {
	appointments: Appointment[];
	isLoading?: boolean;
	onStatusChange?: () => void;
}

export default function AppointmentsTable({ appointments, isLoading, onStatusChange }: AppointmentsTableProps) {
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const handleStatusUpdate = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled') => {
		setUpdatingId(appointmentId);
		try {
			const response = await fetch('/api/crm/appointments/update-status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					appointmentId,
					status: newStatus,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMsg = errorData.details 
					? `${errorData.error}: ${errorData.details}`
					: errorData.error || errorData.message || 'Error desconocido';
				console.error('Error al actualizar cita:', errorData);
				setErrorMessage(errorMsg);
				setTimeout(() => setErrorMessage(null), 5000);
				return;
			}

			setSuccessMessage('Estado actualizado correctamente');
			setTimeout(() => setSuccessMessage(null), 3000);
			
			// Refrescar la lista de citas
			if (onStatusChange) {
				onStatusChange();
			}
		} catch (error) {
			console.error('Error al actualizar estado:', error);
			setErrorMessage('Error al actualizar la cita. Por favor, intenta de nuevo.');
			setTimeout(() => setErrorMessage(null), 5000);
		} finally {
			setUpdatingId(null);
		}
	};

	const handleDeleteAppointment = async (appointmentId: string) => {
		setDeleteConfirmId(appointmentId);
	};

	const confirmDelete = async () => {
		if (!deleteConfirmId) return;

		setUpdatingId(deleteConfirmId);
		setDeleteConfirmId(null);
		try {
			const response = await fetch('/api/crm/appointments/delete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					appointmentId: deleteConfirmId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMsg = errorData.details 
					? `${errorData.error}: ${errorData.details}`
					: errorData.error || errorData.message || 'Error desconocido';
				console.error('Error al eliminar cita:', errorData);
				setErrorMessage(errorMsg);
				setTimeout(() => setErrorMessage(null), 5000);
				return;
			}

			setSuccessMessage('Cita eliminada correctamente');
			setTimeout(() => setSuccessMessage(null), 3000);

			// Refrescar la lista de citas
			if (onStatusChange) {
				onStatusChange();
			}
		} catch (error) {
			console.error('Error al eliminar cita:', error);
			setErrorMessage('Error al eliminar la cita. Por favor, intenta de nuevo.');
			setTimeout(() => setErrorMessage(null), 5000);
		} finally {
			setUpdatingId(null);
		}
	};
	const getStatusBadge = (status: string) => {
		const styles = {
			pending: 'bg-purple-50 text-purple-600 border border-purple-200',
			confirmed: 'bg-green-50 text-green-600 border border-green-200',
			cancelled: 'bg-red-50 text-red-600 border border-red-200',
			completed: 'bg-blue-50 text-blue-600 border border-blue-200',
			'no-show': 'bg-gray-50 text-gray-600 border border-gray-200',
		};

		const labels = {
			pending: 'Pendiente',
			confirmed: 'Confirmada',
			cancelled: 'Cancelada',
			completed: 'Completada',
			'no-show': 'No asistió',
		};

		return (
			<span
				class={`px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium w-16 sm:w-20 text-center flex-shrink-0 shadow-sm ${
					styles[status as keyof typeof styles] || styles.pending
				}`}
			>
				{labels[status as keyof typeof labels] || status}
			</span>
		);
	};

	const formatDate = (dateStr: string, timeStr: string) => {
		const date = new Date(dateStr);
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
		const displayHour = hour % 12 || 12;
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		return `${day}/${month}/${year} ${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.substring(0, 2);
	};

	if (isLoading) {
		return (
			<div class="flex flex-col items-center justify-center py-12">
				<svg class="w-12 h-12 text-gray-400 animate-spin mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				<div class="text-gray-500 font-medium">Cargando citas...</div>
				<div class="text-gray-400 text-sm mt-1">Por favor espera</div>
			</div>
		);
	}

	if (appointments.length === 0) {
		return (
			<div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
				<div class="flex flex-col items-center justify-center py-16 px-4">
					<div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p class="text-lg font-semibold text-gray-900 mb-1">No hay citas registradas</p>
					<p class="text-sm text-gray-500 text-center max-w-md">
						Las citas aparecerán aquí cuando se creen. Puedes crear una nueva cita desde el botón "+ Nueva Cita" en la parte superior.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
			{/* Mensajes de estado */}
			{errorMessage && (
				<div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 mt-4 rounded">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-sm text-red-700">{errorMessage}</p>
					</div>
				</div>
			)}
			{successMessage && (
				<div class="bg-green-50 border-l-4 border-green-400 p-4 mb-4 mx-4 mt-4 rounded">
					<div class="flex items-center">
						<svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-sm text-green-700">{successMessage}</p>
					</div>
				</div>
			)}
			
			{/* Modal de confirmación de eliminación */}
			{deleteConfirmId && (
				<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
						<p class="text-sm text-gray-600 mb-6">
							¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.
						</p>
						<div class="flex gap-3 justify-end">
							<button
								onClick={() => setDeleteConfirmId(null)}
								disabled={updatingId === deleteConfirmId}
								class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								onClick={confirmDelete}
								disabled={updatingId === deleteConfirmId}
								class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
							>
								{updatingId === deleteConfirmId ? (
									<>
										<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
										Eliminando...
									</>
								) : (
									'Eliminar'
								)}
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Vista de tabla para desktop */}
			<div class="hidden md:block overflow-x-auto w-full">
				<table class="w-full min-w-[640px]">
					<thead class="bg-gray-50/50 border-b border-gray-100">
						<tr>
							<th class="px-3 md:px-4 lg:px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
								CLIENTE
							</th>
							<th class="px-3 md:px-4 lg:px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
								PROPIEDAD DE INTERÉS
							</th>
							<th class="px-3 md:px-4 lg:px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
								FECHA
							</th>
							<th class="px-3 md:px-4 lg:px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
								ESTADO
							</th>
							<th class="px-3 md:px-4 lg:px-6 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
								NOTAS
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-50">
						{appointments.map((apt) => (
							<tr
								key={apt.id}
								class="hover:bg-gray-50/50 transition-colors duration-150"
							>
								<td class="px-3 md:px-4 lg:px-6 py-3">
									<div class="flex items-center gap-2 md:gap-2.5">
										<div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0 shadow-sm">
											{getInitials(apt.clientName)}
										</div>
										<div class="min-w-0">
											<div class="font-semibold text-gray-900 truncate text-xs sm:text-sm">{apt.clientName}</div>
											<div class="text-xs text-gray-500 truncate">{apt.clientEmail}</div>
										</div>
									</div>
								</td>
								<td class="px-3 md:px-4 lg:px-6 py-3 hidden lg:table-cell">
									<div class="flex items-center gap-1.5">
										<span class="text-gray-400 text-sm">❓</span>
										<span class="text-gray-700 text-xs">
											{apt.property || `${apt.operationType === 'rentar' ? 'Renta' : 'Compra'} - ${apt.budgetRange}`}
										</span>
									</div>
								</td>
								<td class="px-3 md:px-4 lg:px-6 py-3 text-gray-700 text-xs sm:text-sm">
									{formatDate(apt.date, apt.time)}
								</td>
								<td class="px-3 md:px-4 lg:px-6 py-3">
									<div class="flex items-center gap-2 md:gap-3">
										{getStatusBadge(apt.status)}
										{/* Botones de acción con distancia uniforme y siempre incluye eliminar */}
										<div class="flex items-center gap-0.5 md:gap-1">
											{apt.status === 'pending' && (
												<>
													<button
														onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
														disabled={updatingId === apt.id}
														class="p-1 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:text-green-400 disabled:border-green-200 border border-green-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Confirmar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
															</svg>
														)}
													</button>
													<button
														onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
														disabled={updatingId === apt.id}
														class="p-1 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:text-red-400 disabled:border-red-200 border border-red-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Cancelar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
															</svg>
														)}
													</button>
													<button
														onClick={() => handleDeleteAppointment(apt.id)}
														disabled={updatingId === apt.id}
														class="p-1 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Eliminar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														)}
													</button>
												</>
											)}
											{apt.status === 'confirmed' && (
												<>
													<button
														onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
														disabled={updatingId === apt.id}
														class="p-1 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:text-red-400 disabled:border-red-200 border border-red-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Cancelar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
															</svg>
														)}
													</button>
													<button
														onClick={() => handleDeleteAppointment(apt.id)}
														disabled={updatingId === apt.id}
														class="p-1 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Eliminar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														)}
													</button>
												</>
											)}
											{apt.status === 'cancelled' && (
												<>
													<button
														onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
														disabled={updatingId === apt.id}
														class="p-1 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:text-green-400 disabled:border-green-200 border border-green-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Reconfirmar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
															</svg>
														)}
													</button>
													<button
														onClick={() => handleDeleteAppointment(apt.id)}
														disabled={updatingId === apt.id}
														class="p-1 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
														title="Eliminar cita"
													>
														{updatingId === apt.id ? (
															<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
														) : (
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
															</svg>
														)}
													</button>
												</>
											)}
										</div>
									</div>
								</td>
								<td class="px-3 md:px-4 lg:px-6 py-3 text-xs sm:text-sm text-gray-600 max-w-md hidden xl:table-cell">
									{apt.notes || '-'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Vista de cards para móvil */}
			<div class="md:hidden divide-y divide-gray-100 w-full">
				{appointments.map((apt) => (
					<div key={apt.id} class="p-2 sm:p-2.5 hover:bg-gray-50/50 transition-colors duration-150 w-full overflow-hidden">
						<div class="flex items-start gap-2 mb-2 w-full">
							<div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0 shadow-sm">
								{getInitials(apt.clientName)}
							</div>
							<div class="flex-1 min-w-0 pr-2 overflow-hidden">
								<div class="font-semibold text-gray-900 text-xs mb-0.5 truncate">{apt.clientName}</div>
								<div class="text-xs text-gray-500 truncate">{apt.clientEmail}</div>
							</div>
							<div class="flex-shrink-0">
								{getStatusBadge(apt.status)}
							</div>
						</div>
						<div class="space-y-1 text-xs">
							<div class="flex items-start gap-1.5">
								<span class="text-gray-400 text-xs flex-shrink-0">📅</span>
								<span class="text-gray-700 break-words flex-1">{formatDate(apt.date, apt.time)}</span>
							</div>
							<div class="flex items-start gap-1.5">
								<span class="text-gray-400 text-xs flex-shrink-0">❓</span>
								<span class="text-gray-700 break-words flex-1">
									{apt.property || `${apt.operationType === 'rentar' ? 'Renta' : 'Compra'} - ${apt.budgetRange}`}
								</span>
							</div>
							{apt.notes && (
								<div class="flex items-start gap-1.5">
									<span class="text-gray-400 text-xs flex-shrink-0">📝</span>
									<span class="text-gray-600 text-xs break-words flex-1">{apt.notes}</span>
								</div>
							)}
						</div>
						{/* Botones de acción para móvil - siempre incluye eliminar */}
						<div class="mt-2 flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
							<div class="flex items-center gap-1">
								{apt.status === 'pending' && (
									<>
										<button
											onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
											disabled={updatingId === apt.id}
											class="p-1.5 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:text-green-400 disabled:border-green-200 border border-green-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Confirmar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</button>
										<button
											onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
											disabled={updatingId === apt.id}
											class="p-1.5 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:text-red-400 disabled:border-red-200 border border-red-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Cancelar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											)}
										</button>
										<button
											onClick={() => handleDeleteAppointment(apt.id)}
											disabled={updatingId === apt.id}
											class="p-1.5 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Eliminar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											)}
										</button>
									</>
								)}
								{apt.status === 'confirmed' && (
									<>
										<button
											onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
											disabled={updatingId === apt.id}
											class="p-1.5 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:text-red-400 disabled:border-red-200 border border-red-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Cancelar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											)}
										</button>
										<button
											onClick={() => handleDeleteAppointment(apt.id)}
											disabled={updatingId === apt.id}
											class="p-1.5 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Eliminar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											)}
										</button>
									</>
								)}
								{apt.status === 'cancelled' && (
									<>
										<button
											onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
											disabled={updatingId === apt.id}
											class="p-1.5 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:text-green-400 disabled:border-green-200 border border-green-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Reconfirmar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											)}
										</button>
										<button
											onClick={() => handleDeleteAppointment(apt.id)}
											disabled={updatingId === apt.id}
											class="p-1.5 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-300 disabled:border-gray-200 border border-gray-200 rounded-md transition-all duration-150 disabled:cursor-not-allowed shadow-sm hover:shadow"
											title="Eliminar"
										>
											{updatingId === apt.id ? (
												<svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											) : (
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											)}
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

