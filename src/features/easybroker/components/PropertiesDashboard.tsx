/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { CreatePropertyModal } from './CreatePropertyModal';
import { PropertyAppointmentModal } from './PropertyAppointmentModal';
import { getEasyBrokerPropertyUrl } from '../../../core/utils/easybroker-url';
import { easybrokerConfig } from '../../../core/config/easybroker';
import type { EasyBrokerProperty } from '../../../core/types/easybroker';

interface PropertiesDashboardProps {
	onPropertyClick?: (property: EasyBrokerProperty) => void;
	onRegisterProperty?: () => void;
}

/**
 * Dashboard principal de propiedades
 * Muestra lista de propiedades con filtros y búsqueda
 */
export function PropertiesDashboard({
	onPropertyClick,
	onRegisterProperty,
}: PropertiesDashboardProps): JSX.Element {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [selectedPropertyForAppointment, setSelectedPropertyForAppointment] =
		useState<EasyBrokerProperty | null>(null);
	const {
		properties,
		loading,
		error,
		searchQuery,
		selectedType,
		currentPage,
		totalPages,
		fetchProperties,
		setSearchQuery,
		setSelectedType,
		setCurrentPage,
		goToNextPage,
		goToPreviousPage,
	} = useProperties();

	// Cargar propiedades al montar
	useEffect(() => {
		fetchProperties();
	}, []);

	// Debug: Log para verificar paginación
	useEffect(() => {
		console.log('📄 Paginación Debug:', {
			propiedades: properties.value.length,
			paginaActual: currentPage.value,
			totalPaginas: totalPages.value,
			muestraControles: totalPages.value > 1 && properties.value.length > 0,
		});
	}, [properties.value.length, currentPage.value, totalPages.value]);

	return (
		<div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100 p-4 sm:p-6">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Cartera de Inmuebles
						</h1>
						<p className="mt-1 text-gray-600">
							Gestiona tu inventario exclusivo
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCreateModal(true)}
						className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-gray-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Registrar Propiedad
					</button>
				</div>

				{/* Filtros */}
				<PropertyFilters
					selectedType={selectedType.value}
					searchQuery={searchQuery.value}
					onTypeChange={setSelectedType}
					onSearchChange={setSearchQuery}
				/>

				{/* Contenido */}
				{loading.value && properties.value.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
							<p className="text-gray-600">Cargando propiedades...</p>
						</div>
					</div>
				) : error.value ? (
					<div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-6 text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
							<svg
								className="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h3 className="mb-2 text-lg font-semibold text-red-800">
							Error al cargar propiedades
						</h3>
						<p className="mb-4 text-sm text-red-600">{error.value}</p>
						<p className="mb-4 text-xs text-red-500">
							Revisa la consola del navegador para más detalles
						</p>
						<button
							type="button"
							onClick={fetchProperties}
							className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 shadow-md"
						>
							Reintentar
						</button>
					</div>
				) : properties.value.length === 0 ? (
					<div className="rounded-lg bg-white p-12 text-center shadow-sm">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
							<svg
								className="h-8 w-8 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
							</svg>
						</div>
						<h3 className="mb-2 text-lg font-semibold text-gray-900">
							No se encontraron propiedades
						</h3>
						<p className="text-sm text-gray-600">
							{searchQuery.value || selectedType.value !== 'todos'
								? 'Intenta ajustar los filtros de búsqueda'
								: 'No hay propiedades disponibles en este momento'}
						</p>
					</div>
				) : (
					<>
						{/* Grid de propiedades */}
						<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{properties.value.length > 0 ? properties.value.map((property) => (
								<PropertyCard
									key={property.public_id}
									property={property}
									onClick={onPropertyClick}
									onScheduleAppointment={(prop) => {
										setSelectedPropertyForAppointment(prop);
										setShowAppointmentModal(true);
									}}
									onDownloadSheet={(prop) => {
										// Abrir la ficha oficial de Easy Broker con el formato correcto
										const easyBrokerUrl = getEasyBrokerPropertyUrl(
											prop,
											easybrokerConfig.agencySlug
										);
										window.open(easyBrokerUrl, '_blank');
									}}
								/>
							)) : (
								<div className="col-span-full text-center py-8 text-gray-500">
									No hay propiedades en esta página
								</div>
							)}
						</div>

						{/* Controles de paginación */}
						{totalPages.value > 1 && (
							<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:gap-4">
								<div className="text-xs sm:text-sm text-gray-600">
									Página {currentPage.value} de {totalPages.value}
								</div>
								<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
									<button
										type="button"
										onClick={goToPreviousPage}
										disabled={currentPage.value === 1}
										className="rounded-lg bg-gray-900 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 flex items-center gap-1"
									>
										<svg
											className="h-3.5 w-3.5 sm:h-4 sm:w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
										<span className="hidden sm:inline">Anterior</span>
									</button>

									{/* Números de página - Responsive: mostrar menos en móvil */}
									<div className="flex items-center gap-1 overflow-x-auto max-w-full px-2 scrollbar-hide">
										{(() => {
											const pages: number[] = [];
											const total = totalPages.value;
											const current = currentPage.value;

											// Lógica inteligente de paginación
											if (total <= 7) {
												// Mostrar todas las páginas si son 7 o menos
												for (let i = 1; i <= total; i++) {
													pages.push(i);
												}
											} else {
												// Mostrar páginas con elipsis
												if (current <= 3) {
													// Al inicio: mostrar primeras 4, elipsis, última
													for (let i = 1; i <= 4; i++) pages.push(i);
													pages.push(-1); // Elipsis
													pages.push(total);
												} else if (current >= total - 2) {
													// Al final: primera, elipsis, últimas 4
													pages.push(1);
													pages.push(-1); // Elipsis
													for (let i = total - 3; i <= total; i++) pages.push(i);
												} else {
													// En el medio: primera, elipsis, actual-1, actual, actual+1, elipsis, última
													pages.push(1);
													pages.push(-1); // Elipsis
													for (let i = current - 1; i <= current + 1; i++) pages.push(i);
													pages.push(-1); // Elipsis
													pages.push(total);
												}
											}

											return pages.map((page, index) => {
												if (page === -1) {
													return (
														<span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-gray-400 text-xs sm:text-sm">
															...
														</span>
													);
												}
												return (
													<button
														key={page}
														type="button"
														onClick={() => setCurrentPage(page)}
														className={`min-w-[2rem] sm:min-w-[2.5rem] h-8 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center px-1 sm:px-0 ${
															currentPage.value === page
																? 'bg-gray-900 text-white shadow-md'
																: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
														}`}
													>
														{page}
													</button>
												);
											});
										})()}
									</div>

									<button
										type="button"
										onClick={goToNextPage}
										disabled={currentPage.value === totalPages.value}
										className="rounded-lg bg-gray-900 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 flex items-center gap-1"
									>
										<span className="hidden sm:inline">Siguiente</span>
										<svg
											className="h-3.5 w-3.5 sm:h-4 sm:w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Modal para crear propiedad */}
			<CreatePropertyModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSuccess={() => {
					fetchProperties();
					setShowCreateModal(false);
				}}
			/>

			{/* Modal para agendar cita desde propiedad */}
			<PropertyAppointmentModal
				isOpen={showAppointmentModal}
				property={selectedPropertyForAppointment}
				onClose={() => {
					setShowAppointmentModal(false);
					setSelectedPropertyForAppointment(null);
				}}
				onSuccess={() => {
					setShowAppointmentModal(false);
					setSelectedPropertyForAppointment(null);
					// Opcional: mostrar mensaje de éxito
				}}
			/>
		</div>
	);
}

