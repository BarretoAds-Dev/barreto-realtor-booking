/** @jsxImportSource preact */
import { useState, useEffect, useMemo } from 'preact/hooks';
import { supabaseAuth } from '../../../core/config/auth';
import Sidebar from './Sidebar';
import AppointmentsTable from './AppointmentsTable';
import CreateAppointmentModal from './CreateAppointmentModal';
import AdvancedFilters, { type FilterState } from './AdvancedFilters';
import AdminSettings from './AdminSettings';

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
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSearchInput, setShowSearchInput] = useState(false);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [advancedFilters, setAdvancedFilters] = useState<FilterState | null>(null);

	// Verificar sesión al cargar el componente
	useEffect(() => {
		const checkSession = async () => {
			const { data: { session }, error } = await supabaseAuth.auth.getSession();
			if (!session || error) {
				// Si no hay sesión, redirigir al login
				window.location.href = '/login';
				return;
			}
		};
		checkSession();
	}, []);

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

	// Filtrar citas según la búsqueda y filtros avanzados
	const filteredAppointments = useMemo(() => {
		let filtered = [...appointments];

		// Aplicar búsqueda rápida
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(apt => {
				const nameMatch = apt.clientName.toLowerCase().includes(query);
				const emailMatch = apt.clientEmail.toLowerCase().includes(query);
				const phoneMatch = apt.clientPhone?.toLowerCase().includes(query) || false;
				const propertyMatch = apt.property?.toLowerCase().includes(query) || false;
				
				return nameMatch || emailMatch || phoneMatch || propertyMatch;
			});
		}

		// Aplicar filtros avanzados
		if (advancedFilters) {
			// Filtro por nombre
			if (advancedFilters.name) {
				filtered = filtered.filter(apt => 
					apt.clientName.toLowerCase().includes(advancedFilters.name.toLowerCase())
				);
			}

			// Filtro por email
			if (advancedFilters.email) {
				filtered = filtered.filter(apt => 
					apt.clientEmail.toLowerCase().includes(advancedFilters.email.toLowerCase())
				);
			}

			// Filtro por teléfono
			if (advancedFilters.phone) {
				filtered = filtered.filter(apt => 
					apt.clientPhone?.toLowerCase().includes(advancedFilters.phone.toLowerCase())
				);
			}

			// Filtro por rango de fechas
			if (advancedFilters.dateFrom) {
				filtered = filtered.filter(apt => {
					const aptDate = new Date(apt.date);
					const fromDate = new Date(advancedFilters.dateFrom);
					fromDate.setHours(0, 0, 0, 0);
					return aptDate >= fromDate;
				});
			}

			if (advancedFilters.dateTo) {
				filtered = filtered.filter(apt => {
					const aptDate = new Date(apt.date);
					const toDate = new Date(advancedFilters.dateTo);
					toDate.setHours(23, 59, 59, 999);
					return aptDate <= toDate;
				});
			}

			// Filtro por tipo de operación
			if (advancedFilters.operationType) {
				filtered = filtered.filter(apt => 
					apt.operationType === advancedFilters.operationType
				);
			}

			// Filtro por tipo de recurso (propiedad)
			if (advancedFilters.propertyType) {
				filtered = filtered.filter(apt => {
					// Esto requeriría acceso a resource_type en los datos
					// Por ahora filtramos por el texto de la propiedad
					if (!apt.property) return false;
					const propLower = apt.property.toLowerCase();
					if (advancedFilters.propertyType === 'credito-bancario') {
						return propLower.includes('banco') || propLower.includes('crédito');
					}
					if (advancedFilters.propertyType === 'infonavit') {
						return propLower.includes('infonavit');
					}
					if (advancedFilters.propertyType === 'fovissste') {
						return propLower.includes('fovissste');
					}
					if (advancedFilters.propertyType === 'recursos-propios') {
						return propLower.includes('propios') || (!propLower.includes('banco') && !propLower.includes('infonavit') && !propLower.includes('fovissste'));
					}
					return true;
				});
			}

			// Filtro por rango de precio
			if (advancedFilters.priceRange) {
				filtered = filtered.filter(apt => 
					apt.budgetRange === advancedFilters.priceRange
				);
			}

			// Filtro por estado (ya se aplica con statusFilter, pero lo respetamos)
			if (advancedFilters.status && advancedFilters.status !== 'all') {
				filtered = filtered.filter(apt => 
					apt.status === advancedFilters.status
				);
			}
		}

		return filtered;
	}, [appointments, searchQuery, advancedFilters]);

	const fetchAppointments = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const url = `/api/crm/appointments-list${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
			console.log('🔍 Fetching appointments from:', url);
			const response = await fetch(url);
			if (response.ok) {
				const data = await response.json();
				console.log('✅ Appointments received:', data.length, 'citas');
				console.log('📋 Data:', data);
				setAppointments(data);
			} else {
				const errorData = await response.json().catch(() => ({}));
				const errorMsg = errorData.error || errorData.message || 'Error al cargar las citas';
				setError(errorMsg);
				console.error('❌ Error al cargar citas:', errorData);
			}
		} catch (error) {
			const errorMsg = 'Error de conexión. Por favor verifica tu conexión e intenta nuevamente.';
			setError(errorMsg);
			console.error('❌ Error al cargar citas:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div class="h-screen bg-gray-50 lg:flex relative overflow-hidden" style="margin: 0; padding: 0; width: 100%;">
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

			<main class="w-full lg:flex-1 lg:w-0 lg:min-w-0 h-screen overflow-y-auto m-0 p-0">
				{/* Header superior */}
				<header class="bg-white border-b border-gray-100 px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 shadow-sm sticky top-0 z-30 m-0">
					<div class="flex items-center justify-between gap-2 sm:gap-2.5 md:gap-3">
						<div class="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 flex-1">
							{/* Botón hamburguesa para móvil */}
							<button
								onClick={() => setSidebarOpen(!sidebarOpen)}
								class="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-all duration-150 shadow-md hover:shadow-lg flex-shrink-0"
								aria-label="Toggle sidebar"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							
							{/* Campo de búsqueda */}
							{showSearchInput ? (
								<div class="flex items-center gap-2 flex-1 max-w-md">
									<input
										type="text"
										value={searchQuery}
										onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
										placeholder="Buscar por nombre, email, teléfono..."
										class="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
										autoFocus
									/>
									<button
										onClick={() => {
											setShowSearchInput(false);
											setSearchQuery('');
										}}
										class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							) : (
								<>
									{/* Botón de búsqueda - visible en todos los tamaños */}
									<button 
										onClick={() => setShowSearchInput(true)}
										class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-all duration-150 shadow-md hover:shadow-lg flex-shrink-0"
										title="Buscar citas"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
									</button>
									{/* Botón de filtros avanzados - visible en todos los tamaños */}
									<button 
										onClick={() => setShowAdvancedFilters(true)}
										class={`p-2 rounded-md transition-all duration-150 shadow-md hover:shadow-lg relative flex-shrink-0 ${
											advancedFilters
												? 'text-gray-900 bg-gray-100 hover:bg-gray-200'
												: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
										}`}
										title="Filtros avanzados"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
										</svg>
										{advancedFilters && (
											<span class="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
										)}
									</button>
								</>
							)}
						</div>
						{/* Botón Agendar Cita - siempre visible con texto completo */}
						<button 
							onClick={() => setShowCreateModal(true)}
							class="bg-gray-900 hover:bg-gray-800 text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-sm transition-all duration-150 shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0"
						>
							Agendar Cita
						</button>
					</div>
				</header>

			<div class="p-3 sm:p-4 md:p-5 lg:p-6 w-full max-w-full overflow-x-hidden">
				{/* Mensaje de error global */}
				{error && (
					<div class="mb-4 sm:mb-5 md:mb-6 bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 md:p-5 rounded">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<svg class="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<p class="text-sm sm:text-base text-red-700">{error}</p>
							</div>
							<button
								onClick={() => setError(null)}
								class="text-red-400 hover:text-red-600 p-1"
							>
								<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				)}
				
				{currentView === 'appointments' ? (
					<div class="w-full lg:max-w-7xl lg:mx-auto">
						{/* Header */}
						<div class="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
							<div class="mb-3 sm:mb-3.5 md:mb-4 lg:mb-4">
								<h1 class="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-1.5">Citas y Clientes</h1>
								<p class="text-gray-500 text-xs sm:text-sm md:text-base">
									Programa visitas y gestiona tu agenda.
								</p>
							</div>

							{/* Filtros */}
							<div class="flex items-center gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto pb-2 -mx-3 sm:-mx-4 md:-mx-5 lg:-mx-6 px-3 sm:px-4 md:px-5 lg:px-6 scrollbar-hide">
								<button
									onClick={() => setStatusFilter('all')}
									class={`px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg ${
										statusFilter === 'all'
											? 'bg-gray-900 text-white'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Todas
								</button>
								<button
									onClick={() => setStatusFilter('pending')}
									class={`px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg ${
										statusFilter === 'pending'
											? 'bg-purple-100 text-purple-700 border border-purple-200'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Pendientes
								</button>
								<button
									onClick={() => setStatusFilter('confirmed')}
									class={`px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg ${
										statusFilter === 'confirmed'
											? 'bg-green-100 text-green-700 border border-green-200'
											: 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
									}`}
								>
									Confirmadas
								</button>
								<button
									onClick={() => setStatusFilter('cancelled')}
									class={`px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg ${
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
							appointments={filteredAppointments} 
							isLoading={isLoading}
							onStatusChange={fetchAppointments}
						/>
						
						{/* Mensaje cuando no hay resultados de búsqueda */}
						{searchQuery.trim() && filteredAppointments.length === 0 && !isLoading && (
							<div class="text-center py-8">
								<svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<p class="text-gray-500 text-sm">No se encontraron citas que coincidan con "{searchQuery}"</p>
								<button
									onClick={() => setSearchQuery('')}
									class="mt-2 text-gray-600 hover:text-gray-900 text-sm underline"
								>
									Limpiar búsqueda
								</button>
							</div>
						)}
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
				) : currentView === 'settings' ? (
					<AdminSettings />
				) : null}
			</div>
			</main>

			{/* Modal para crear cita */}
			<CreateAppointmentModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSuccess={() => {
					fetchAppointments();
					setShowCreateModal(false);
				}}
			/>

			{/* Modal de filtros avanzados */}
			<AdvancedFilters
				isOpen={showAdvancedFilters}
				onClose={() => setShowAdvancedFilters(false)}
				onApply={(filters) => {
					setAdvancedFilters(filters);
					setStatusFilter(filters.status || 'all');
				}}
				onReset={() => {
					setAdvancedFilters(null);
					setStatusFilter('all');
				}}
			/>
		</div>
	);
}

