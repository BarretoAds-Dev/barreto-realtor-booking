/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import Sidebar from './Sidebar';
import AppointmentsTable from './AppointmentsTable';

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

export default function CRMApp() {
	const [currentView, setCurrentView] = useState('appointments');
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// En móvil/tablet, siempre mantener el sidebar expandido
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setSidebarCollapsed(false);
			}
		};
		
		window.addEventListener('resize', handleResize);
		handleResize(); // Verificar al montar
		
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		fetchAppointments();
	}, [statusFilter]);

	const fetchAppointments = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const url = `/api/crm/appointments-list${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json();
				setAppointments(data);
			} else {
				const errorData = await response.json().catch(() => ({}));
				const errorMsg = errorData.error || errorData.message || 'Error al cargar las citas';
				setError(errorMsg);
				console.error('Error al cargar citas:', errorData);
			}
		} catch (error) {
			const errorMsg = 'Error de conexión. Por favor verifica tu conexión e intenta nuevamente.';
			setError(errorMsg);
			console.error('Error al cargar citas:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div class="min-h-screen bg-gray-50 lg:flex relative overflow-x-hidden" style="margin: 0; padding: 0; width: 100%;">
			{/* Overlay para móvil cuando sidebar está abierto */}
			{sidebarOpen && (
				<div
					class="fixed inset-0 bg-black/50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<Sidebar
				currentView={currentView}
				onViewChange={(view) => {
					setCurrentView(view);
					setSidebarOpen(false);
				}}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				isCollapsed={sidebarCollapsed}
				onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>

			<main class="w-full lg:flex-1 lg:w-0 lg:min-w-0 overflow-x-hidden m-0 p-0">
				{/* Header superior */}
				<header class="bg-white border-b border-gray-100 px-2 sm:px-3 lg:px-6 py-2 shadow-sm sticky top-0 z-30 m-0">
					<div class="flex items-center justify-between gap-1.5 sm:gap-2">
						<div class="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
							{/* Botón hamburguesa para móvil */}
							<button
								onClick={() => setSidebarOpen(!sidebarOpen)}
								class="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-all duration-150 shadow-sm hover:shadow flex-shrink-0"
								aria-label="Toggle sidebar"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							<button class="hidden md:block p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-all duration-150 shadow-sm hover:shadow">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</button>
							<button class="hidden md:block p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-all duration-150 shadow-sm hover:shadow">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</button>
						</div>
						<button 
							onClick={() => window.location.href = '/citas/CitasDashboard'}
							class="bg-gray-900 hover:bg-gray-800 text-white px-2 sm:px-2.5 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs transition-all duration-150 shadow-sm hover:shadow whitespace-nowrap flex-shrink-0"
						>
							<span class="hidden sm:inline">+ Nueva Cita</span>
							<span class="sm:hidden">+</span>
						</button>
					</div>
				</header>

			<div class="p-2 sm:p-3 lg:p-6 w-full max-w-full overflow-x-hidden">
				{/* Mensaje de error global */}
				{error && (
					<div class="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p class="text-sm text-red-700">{error}</p>
							</div>
							<button
								onClick={() => setError(null)}
								class="text-red-400 hover:text-red-600"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				)}
				
				{currentView === 'appointments' ? (
					<div class="w-full lg:max-w-7xl lg:mx-auto">
						{/* Header */}
						<div class="mb-2.5 sm:mb-3 lg:mb-4">
							<div class="mb-2 sm:mb-2.5 lg:mb-3">
								<h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">Citas y Clientes</h1>
								<p class="text-gray-500 text-xs sm:text-sm">
									Programa visitas y gestiona tu agenda.
								</p>
							</div>

							{/* Filtros */}
							<div class="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-2 -mx-2 sm:mx-0 px-2 sm:px-0 scrollbar-hide">
								<button
									onClick={() => setStatusFilter('all')}
									class={`px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow ${
										statusFilter === 'all'
											? 'bg-gray-900 text-white'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Todas
								</button>
								<button
									onClick={() => setStatusFilter('pending')}
									class={`px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow ${
										statusFilter === 'pending'
											? 'bg-purple-100 text-purple-700 border border-purple-200'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Pendientes
								</button>
								<button
									onClick={() => setStatusFilter('confirmed')}
									class={`px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow ${
										statusFilter === 'confirmed'
											? 'bg-green-100 text-green-700 border border-green-200'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Confirmadas
								</button>
								<button
									onClick={() => setStatusFilter('cancelled')}
									class={`px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow ${
										statusFilter === 'cancelled'
											? 'bg-red-100 text-red-700 border border-red-200'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Canceladas
								</button>
							</div>
						</div>

						{/* Tabla de citas */}
						<AppointmentsTable 
							appointments={appointments} 
							isLoading={isLoading}
							onStatusChange={fetchAppointments}
						/>
					</div>
				) : currentView === 'dashboard' ? (
					<div class="w-full lg:max-w-7xl lg:mx-auto">
						<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Panel General</h1>
						<p class="text-gray-600 text-xs sm:text-sm">Vista de dashboard (próximamente)</p>
					</div>
				) : currentView === 'properties' ? (
					<div class="w-full lg:max-w-7xl lg:mx-auto">
						<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Propiedades</h1>
						<p class="text-gray-600 text-xs sm:text-sm">Gestión de propiedades (próximamente)</p>
					</div>
				) : null}
			</div>
			</main>
		</div>
	);
}

