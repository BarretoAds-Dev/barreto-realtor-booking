import { computed, signal } from '@preact/signals';
import type {
  EasyBrokerProperty,
  EasyBrokerSearchFilters,
} from '@/1-app-global-core/core/types/easybroker';

/**
 * Estado global de propiedades usando Preact Signals
 * Evita re-renders innecesarios y mantiene estado reactivo
 */
const propertiesState = signal<EasyBrokerProperty[]>([]);
const loadingState = signal<boolean>(false);
const errorState = signal<string | null>(null);
const filtersState = signal<EasyBrokerSearchFilters>({
  page: 1,
  limit: 100, // Cargar hasta 100 propiedades para paginar en el cliente
  search: {},
});
const searchQueryState = signal<string>('');
const selectedTypeState = signal<string>('todos');
const currentPageState = signal<number>(1);
const totalPagesState = signal<number>(1);
// Filtros avanzados
const advancedFiltersState = signal<{
	minPrice: number | null;
	maxPrice: number | null;
	minBedrooms: number | null;
	maxBedrooms: number | null;
	minBathrooms: number | null;
	maxBathrooms: number | null;
	location: string;
}>({
	minPrice: null,
	maxPrice: null,
	minBedrooms: null,
	maxBedrooms: null,
	minBathrooms: null,
	maxBathrooms: null,
	location: '',
});

/**
 * Computed: propiedades filtradas por tipo
 */
const filteredProperties = computed(() => {
  const type = selectedTypeState.value;
  if (type === 'todos') {
    return propertiesState.value;
  }
  return propertiesState.value.filter((prop) => {
    const propType = prop.property_type.toLowerCase();
    const typeMap: Record<string, string[]> = {
      casa: ['house', 'casa', 'villa', 'residencia'],
      departamento: ['apartment', 'departamento', 'loft', 'penthouse'],
      terreno: ['land', 'terreno', 'lote'],
      comercial: ['commercial', 'comercial', 'local', 'oficina'],
    };
    return typeMap[type]?.some((t) => propType.includes(t)) ?? false;
  });
});

/**
 * Computed: propiedades filtradas por búsqueda, filtros avanzados y paginadas
 */
const searchedProperties = computed(() => {
  const query = searchQueryState.value.toLowerCase().trim();
  const advancedFilters = advancedFiltersState.value;
  let filtered = filteredProperties.value;

  // Filtro por búsqueda de texto
  if (query) {
    filtered = filtered.filter((prop) => {
      const title = prop.title.toLowerCase();
      // location puede ser string o objeto
      const locationStr =
        typeof prop.location === 'string'
          ? prop.location.toLowerCase()
          : `${prop.location.city || ''} ${prop.location.state || ''} ${prop.location.neighborhood || ''} ${prop.location.address || ''}`.toLowerCase();
      const description = prop.description?.toLowerCase() || '';

      return (
        title.includes(query) ||
        locationStr.includes(query) ||
        description.includes(query)
      );
    });
  }

  // Aplicar filtros avanzados
  filtered = filtered.filter((prop) => {
    // Filtro por precio
    const price = prop.operations[0]?.amount;
    if (price !== undefined) {
      if (advancedFilters.minPrice !== null && price < advancedFilters.minPrice) {
        return false;
      }
      if (advancedFilters.maxPrice !== null && price > advancedFilters.maxPrice) {
        return false;
      }
    }

    // Filtro por ubicación
    if (advancedFilters.location.trim()) {
      const locationStr =
        typeof prop.location === 'string'
          ? prop.location.toLowerCase()
          : `${prop.location.city || ''} ${prop.location.state || ''} ${prop.location.neighborhood || ''} ${prop.location.address || ''}`.toLowerCase();
      if (!locationStr.includes(advancedFilters.location.toLowerCase())) {
        return false;
      }
    }

    // Filtro por recámaras
    const bedrooms = prop.features.bedrooms;
    if (bedrooms !== null && bedrooms !== undefined) {
      if (
        advancedFilters.minBedrooms !== null &&
        bedrooms < advancedFilters.minBedrooms
      ) {
        return false;
      }
      if (
        advancedFilters.maxBedrooms !== null &&
        bedrooms > advancedFilters.maxBedrooms
      ) {
        return false;
      }
    }

    // Filtro por baños
    const bathrooms = prop.features.bathrooms;
    if (bathrooms !== null && bathrooms !== undefined) {
      if (
        advancedFilters.minBathrooms !== null &&
        bathrooms < advancedFilters.minBathrooms
      ) {
        return false;
      }
      if (
        advancedFilters.maxBathrooms !== null &&
        bathrooms > advancedFilters.maxBathrooms
      ) {
        return false;
      }
    }

    return true;
  });

  // Calcular total de páginas
  const itemsPerPage = 6;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  totalPagesState.value = totalPages;

  // Aplicar paginación
  const currentPage = currentPageState.value;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginated = filtered.slice(startIndex, endIndex);

  // Debug: log para verificar paginación
  if (total > 0) {
    console.log(`📄 Paginación: ${total} propiedades totales, página ${currentPage} de ${totalPages}, mostrando ${paginated.length} propiedades`);
  }

  return paginated;
});

/**
 * Hook para gestionar propiedades de Easy Broker
 * Usa Signals para estado reactivo sin re-renders innecesarios
 */
export function useProperties() {
  const fetchProperties = async (): Promise<void> => {
    loadingState.value = true;
    errorState.value = null;

    try {
      const filters = filtersState.value;
      // Cargar todas las propiedades (sin límite) para paginar en el cliente
      const params = new URLSearchParams({
        page: '1',
        limit: '100', // Cargar hasta 100 propiedades para paginar en el cliente
      });

      // Agregar filtros de búsqueda
      if (filters.search?.statuses?.length) {
        filters.search.statuses.forEach((status) => {
          params.append('statuses[]', status);
        });
      }

      if (filters.search?.property_types?.length) {
        filters.search.property_types.forEach((type) => {
          params.append('property_types[]', type);
        });
      }

      // Agregar filtros avanzados
      if (filters.search?.min_price !== undefined) {
        params.append('min_price', filters.search.min_price.toString());
      }
      if (filters.search?.max_price !== undefined) {
        params.append('max_price', filters.search.max_price.toString());
      }
      if (filters.search?.min_bedrooms !== undefined) {
        params.append('min_bedrooms', filters.search.min_bedrooms.toString());
      }
      if (filters.search?.max_bedrooms !== undefined) {
        params.append('max_bedrooms', filters.search.max_bedrooms.toString());
      }
      if (filters.search?.min_bathrooms !== undefined) {
        params.append('min_bathrooms', filters.search.min_bathrooms.toString());
      }
      if (filters.search?.max_bathrooms !== undefined) {
        params.append('max_bathrooms', filters.search.max_bathrooms.toString());
      }
      if (filters.search?.locations?.length) {
        filters.search.locations.forEach((location) => {
          params.append('locations[]', location);
        });
      }

      // Intentar cargar de Easy Broker primero
      let easyBrokerProperties: EasyBrokerProperty[] = [];
      try {
        const easyBrokerResponse = await fetch(
          `/api/easybroker/properties?${params.toString()}`
        );

        if (easyBrokerResponse.ok) {
          const easyBrokerData = await easyBrokerResponse.json();
          easyBrokerProperties = easyBrokerData.content || [];
          console.log(
            `✅ Easy Broker: ${easyBrokerProperties.length} propiedades cargadas`
          );
        } else {
          const errorData = await easyBrokerResponse.json().catch(() => ({}));
          console.warn(
            '⚠️ Easy Broker API error:',
            errorData.error || easyBrokerResponse.statusText
          );
        }
      } catch (easyBrokerError) {
        console.warn('⚠️ Error al cargar de Easy Broker:', easyBrokerError);
        // Continuar aunque Easy Broker falle
      }

      // Cargar propiedades de Supabase también
      let supabaseProperties: EasyBrokerProperty[] = [];
      try {
        const supabaseResponse = await fetch('/api/properties');
        if (supabaseResponse.ok) {
          const supabaseData = await supabaseResponse.json();
          // Convertir propiedades de Supabase al formato EasyBroker
          supabaseProperties =
            supabaseData.properties?.map((prop: any) => ({
            public_id: prop.id,
            title: prop.title,
            title_image_full: null,
            title_image_thumb: null,
            location: {
              country: 'México',
              state: prop.address?.split(',')[2]?.trim() || '',
              city: prop.address?.split(',')[1]?.trim() || '',
              neighborhood: null,
              address: prop.address,
              postal_code: null,
              latitude: null,
              longitude: null,
            },
            operations: [
              {
                type: 'sale',
                amount: prop.price,
                currency: 'MXN',
                formatted_amount: `$${(prop.price / 1000000).toFixed(1)}M MXN`,
                commission: {
                  type: 'percentage',
                  value: 0,
                },
                unit: null,
              },
            ],
            property_type: prop.property_type || 'casa',
            status: prop.status || 'active',
            features: {
              bathrooms: prop.bathrooms,
              bedrooms: prop.bedrooms,
              parking_spaces: null,
              half_bathrooms: null,
              lot_size: null,
              construction_size: prop.area,
              floors: null,
            },
            images: [],
            description: prop.description,
            tags: prop.features
              ? prop.features.split(',').map((f: string) => f.trim())
              : [],
            show_prices: true,
            share_commission: false,
          })) || [];
          console.log(
            `✅ Supabase: ${supabaseProperties.length} propiedades cargadas`
          );
        }
      } catch (supabaseError) {
        console.warn('⚠️ Error al cargar de Supabase:', supabaseError);
        // Continuar aunque Supabase falle
      }

      // Combinar propiedades (Easy Broker primero, luego Supabase)
      const allProperties = [...easyBrokerProperties, ...supabaseProperties];
      propertiesState.value = allProperties;
      // Resetear paginación al cargar nuevas propiedades
      currentPageState.value = 1;
      console.log(
        `✅ Total: ${allProperties.length} propiedades cargadas (${easyBrokerProperties.length} Easy Broker + ${supabaseProperties.length} Supabase)`
      );
    } catch (err) {
      errorState.value =
        err instanceof Error ? err.message : 'Error desconocido';
      propertiesState.value = [];
    } finally {
      loadingState.value = false;
    }
  };

  const setSearchQuery = (query: string): void => {
    searchQueryState.value = query;
    resetPagination(); // Resetear paginación al buscar
  };

  const setSelectedType = (type: string): void => {
    selectedTypeState.value = type;
    resetPagination(); // Resetear paginación al cambiar tipo
  };

  const setFilters = (newFilters: Partial<EasyBrokerSearchFilters>): void => {
    filtersState.value = {
      ...filtersState.value,
      ...newFilters,
      search: {
        ...filtersState.value.search,
        ...newFilters.search,
      },
    };
  };

  const setAdvancedFilters = (filters: {
    minPrice: number | null;
    maxPrice: number | null;
    minBedrooms: number | null;
    maxBedrooms: number | null;
    minBathrooms: number | null;
    maxBathrooms: number | null;
    location: string;
  }): void => {
    advancedFiltersState.value = filters;
    resetPagination();
    // Actualizar filtros de API también
    setFilters({
      search: {
        ...filtersState.value.search,
        min_price: filters.minPrice ?? undefined,
        max_price: filters.maxPrice ?? undefined,
        min_bedrooms: filters.minBedrooms ?? undefined,
        max_bedrooms: filters.maxBedrooms ?? undefined,
        min_bathrooms: filters.minBathrooms ?? undefined,
        max_bathrooms: filters.maxBathrooms ?? undefined,
        locations: filters.location.trim()
          ? [filters.location.trim()]
          : undefined,
      },
    });
    // Recargar propiedades con nuevos filtros
    fetchProperties();
  };

  const resetAdvancedFilters = (): void => {
    advancedFiltersState.value = {
      minPrice: null,
      maxPrice: null,
      minBedrooms: null,
      maxBedrooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      location: '',
    };
    resetPagination();
    // Limpiar filtros de API
    setFilters({
      search: {
        ...filtersState.value.search,
        min_price: undefined,
        max_price: undefined,
        min_bedrooms: undefined,
        max_bedrooms: undefined,
        min_bathrooms: undefined,
        max_bathrooms: undefined,
        locations: undefined,
      },
    });
    // Recargar propiedades sin filtros
    fetchProperties();
  };

  const setCurrentPage = (page: number): void => {
    currentPageState.value = Math.max(1, Math.min(page, totalPagesState.value));
  };

  const goToNextPage = (): void => {
    if (currentPageState.value < totalPagesState.value) {
      currentPageState.value += 1;
    }
  };

  const goToPreviousPage = (): void => {
    if (currentPageState.value > 1) {
      currentPageState.value -= 1;
    }
  };

  // Resetear a página 1 cuando cambian los filtros
  const resetPagination = (): void => {
    currentPageState.value = 1;
  };

  return {
    // Signals reactivos
    properties: searchedProperties,
    loading: loadingState,
    error: errorState,
    filters: filtersState,
    searchQuery: searchQueryState,
    selectedType: selectedTypeState,
    currentPage: currentPageState,
    totalPages: totalPagesState,
    advancedFilters: advancedFiltersState,
    // Métodos
    fetchProperties,
    setSearchQuery,
    setSelectedType,
    setFilters,
    setAdvancedFilters,
    resetAdvancedFilters,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
  };
}
