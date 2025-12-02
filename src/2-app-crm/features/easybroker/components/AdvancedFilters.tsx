/** @jsxImportSource preact */
import { useState } from 'preact/hooks';

interface AdvancedFiltersProps {
	minPrice: number | null;
	maxPrice: number | null;
	minBedrooms: number | null;
	maxBedrooms: number | null;
	minBathrooms: number | null;
	maxBathrooms: number | null;
	location: string;
	searchQuery: string;
	onFiltersChange: (filters: {
		minPrice: number | null;
		maxPrice: number | null;
		minBedrooms: number | null;
		maxBedrooms: number | null;
		minBathrooms: number | null;
		maxBathrooms: number | null;
		location: string;
	}) => void;
	onSearchChange: (query: string) => void;
	onReset: () => void;
}

/**
 * Componente de filtros avanzados para propiedades
 * Permite filtrar por precio, ubicación, recámaras, baños, etc.
 */
export function AdvancedFilters({
	minPrice: initialMinPrice,
	maxPrice: initialMaxPrice,
	minBedrooms: initialMinBedrooms,
	maxBedrooms: initialMaxBedrooms,
	minBathrooms: initialMinBathrooms,
	maxBathrooms: initialMaxBathrooms,
	location: initialLocation,
	searchQuery: initialSearchQuery,
	onFiltersChange,
	onSearchChange,
	onReset,
}: AdvancedFiltersProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [minPrice, setMinPrice] = useState<string>(
		initialMinPrice?.toString() || ''
	);
	const [maxPrice, setMaxPrice] = useState<string>(
		initialMaxPrice?.toString() || ''
	);
	const [minBedrooms, setMinBedrooms] = useState<string>(
		initialMinBedrooms?.toString() || ''
	);
	const [maxBedrooms, setMaxBedrooms] = useState<string>(
		initialMaxBedrooms?.toString() || ''
	);
	const [minBathrooms, setMinBathrooms] = useState<string>(
		initialMinBathrooms?.toString() || ''
	);
	const [maxBathrooms, setMaxBathrooms] = useState<string>(
		initialMaxBathrooms?.toString() || ''
	);
	const [location, setLocation] = useState<string>(initialLocation || '');
	const [searchInput, setSearchInput] = useState<string>(initialSearchQuery || '');

	const handleApply = (): void => {
		onFiltersChange({
			minPrice: minPrice ? parseFloat(minPrice) : null,
			maxPrice: maxPrice ? parseFloat(maxPrice) : null,
			minBedrooms: minBedrooms ? parseInt(minBedrooms, 10) : null,
			maxBedrooms: maxBedrooms ? parseInt(maxBedrooms, 10) : null,
			minBathrooms: minBathrooms ? parseInt(minBathrooms, 10) : null,
			maxBathrooms: maxBathrooms ? parseInt(maxBathrooms, 10) : null,
			location: location.trim(),
		});
	};

	const handleReset = (): void => {
		setMinPrice('');
		setMaxPrice('');
		setMinBedrooms('');
		setMaxBedrooms('');
		setMinBathrooms('');
		setMaxBathrooms('');
		setLocation('');
		setSearchInput('');
		onSearchChange('');
		onReset();
	};

	const hasActiveFilters =
		minPrice ||
		maxPrice ||
		minBedrooms ||
		maxBedrooms ||
		minBathrooms ||
		maxBathrooms ||
		location.trim() ||
		searchInput.trim();

	return (
		<div className="mb-6">
			{/* Botón para abrir/cerrar filtros avanzados - Reemplaza el buscador */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
				>
					<svg
						className="h-5 w-5 text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<span>Buscar Propiedades</span>
					{hasActiveFilters && (
						<span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">
							Activos
						</span>
					)}
					<svg
						className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
							isOpen ? 'rotate-180' : ''
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
			</div>

			{/* Panel de filtros avanzados */}
			{isOpen && (
				<div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
					{/* Buscador de texto */}
					<div className="mb-6">
						<label
							htmlFor="searchQuery"
							className="mb-2 block text-sm font-medium text-gray-700"
						>
							Buscar por título, zona o dirección
						</label>
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<input
								type="text"
								id="searchQuery"
								value={searchInput}
								onInput={(e) => {
									const value = (e.target as HTMLInputElement).value;
									setSearchInput(value);
									onSearchChange(value);
								}}
								placeholder="Buscar por título, zona o dirección..."
								className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>
					</div>

					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{/* Precio Mínimo */}
						<div>
							<label
								htmlFor="minPrice"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Precio Mínimo
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span className="text-gray-500">$</span>
								</div>
								<input
									type="number"
									id="minPrice"
									value={minPrice}
									onInput={(e) => {
										setMinPrice((e.target as HTMLInputElement).value);
									}}
									placeholder="0"
									min="0"
									className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
								/>
							</div>
						</div>

						{/* Precio Máximo */}
						<div>
							<label
								htmlFor="maxPrice"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Precio Máximo
							</label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span className="text-gray-500">$</span>
								</div>
								<input
									type="number"
									id="maxPrice"
									value={maxPrice}
									onInput={(e) => {
										setMaxPrice((e.target as HTMLInputElement).value);
									}}
									placeholder="Sin límite"
									min="0"
									className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
								/>
							</div>
						</div>

						{/* Ubicación */}
						<div>
							<label
								htmlFor="location"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Ubicación
							</label>
							<input
								type="text"
								id="location"
								value={location}
								onInput={(e) => {
									setLocation((e.target as HTMLInputElement).value);
								}}
								placeholder="Ciudad, Estado, Colonia..."
								className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>

						{/* Recámaras Mínimas */}
						<div>
							<label
								htmlFor="minBedrooms"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Recámaras Mínimas
							</label>
							<input
								type="number"
								id="minBedrooms"
								value={minBedrooms}
								onInput={(e) => {
									setMinBedrooms((e.target as HTMLInputElement).value);
								}}
								placeholder="0"
								min="0"
								max="20"
								className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>

						{/* Recámaras Máximas */}
						<div>
							<label
								htmlFor="maxBedrooms"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Recámaras Máximas
							</label>
							<input
								type="number"
								id="maxBedrooms"
								value={maxBedrooms}
								onInput={(e) => {
									setMaxBedrooms((e.target as HTMLInputElement).value);
								}}
								placeholder="Sin límite"
								min="0"
								max="20"
								className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>

						{/* Baños Mínimos */}
						<div>
							<label
								htmlFor="minBathrooms"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Baños Mínimos
							</label>
							<input
								type="number"
								id="minBathrooms"
								value={minBathrooms}
								onInput={(e) => {
									setMinBathrooms((e.target as HTMLInputElement).value);
								}}
								placeholder="0"
								min="0"
								max="20"
								className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>

						{/* Baños Máximos */}
						<div>
							<label
								htmlFor="maxBathrooms"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								Baños Máximos
							</label>
							<input
								type="number"
								id="maxBathrooms"
								value={maxBathrooms}
								onInput={(e) => {
									setMaxBathrooms((e.target as HTMLInputElement).value);
								}}
								placeholder="Sin límite"
								min="0"
								max="20"
								className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
							/>
						</div>
					</div>

					{/* Botones de acción */}
					<div className="mt-6 flex gap-3">
						<button
							type="button"
							onClick={handleApply}
							className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
						>
							Aplicar Filtros
						</button>
						{hasActiveFilters && (
							<button
								type="button"
								onClick={handleReset}
								className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
							>
								Limpiar
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

