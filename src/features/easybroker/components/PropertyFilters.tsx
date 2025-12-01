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
		</div>
	);
}

