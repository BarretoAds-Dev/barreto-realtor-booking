/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';

interface PropertyFiltersProps {
	selectedType: string;
	searchQuery: string;
	onTypeChange: (type: string) => void;
	onSearchChange: (query: string) => void;
}

const PROPERTY_TYPES = [
	{ value: 'todos', label: 'Todos' },
	{ value: 'casa', label: 'Casa' },
	{ value: 'departamento', label: 'Departamento' },
	{ value: 'terreno', label: 'Terreno' },
	{ value: 'comercial', label: 'Comercial' },
] as const;

/**
 * Componente de filtros para propiedades
 * Incluye filtros por tipo y búsqueda por texto
 */
export function PropertyFilters({
	selectedType,
	searchQuery,
	onTypeChange,
	onSearchChange,
}: PropertyFiltersProps): JSX.Element {
	const [searchInput, setSearchInput] = useState(searchQuery);

	// Sincronizar búsqueda con debounce
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			onSearchChange(searchInput);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchInput, onSearchChange]);

	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			{/* Filtros por tipo */}
			<div className="flex flex-wrap gap-2">
				{PROPERTY_TYPES.map((type) => (
					<button
						key={type.value}
						type="button"
						onClick={() => onTypeChange(type.value)}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
							selectedType === type.value
								? 'bg-gray-900 text-white shadow-md hover:bg-gray-800'
								: 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
						}`}
					>
						{type.label}
					</button>
				))}
			</div>

			{/* Buscador */}
			<div className="relative flex-1 sm:max-w-md">
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
					value={searchInput}
					onInput={(e) => {
						setSearchInput((e.target as HTMLInputElement).value);
					}}
					placeholder="Buscar por título, zona o dirección..."
					className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-sm transition-all duration-200 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20"
				/>
			</div>
		</div>
	);
}

