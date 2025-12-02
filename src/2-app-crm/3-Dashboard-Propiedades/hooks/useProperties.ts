import type {
  EasyBrokerProperty,
  EasyBrokerSearchFilters,
} from '@/1-app-global-core/types/easybroker';
import { computed, signal } from '@preact/signals';

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

  console.log('🔍 searchedProperties computed:', {
    query,
    locationFilter: advancedFilters.location,
    totalBeforeFilters: filtered.length,
  });

  // Filtro por búsqueda de texto
  if (query) {
    filtered = filtered.filter((prop) => {
      const title = prop.title.toLowerCase();
      // location puede ser string o objeto
      const locationStr =
        typeof prop.location === 'string'
          ? prop.location.toLowerCase()
          : `${prop.location.city || ''} ${prop.location.state || ''} ${
              prop.location.neighborhood || ''
            } ${prop.location.address || ''}`.toLowerCase();
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
      if (
        advancedFilters.minPrice !== null &&
        price < advancedFilters.minPrice
      ) {
        return false;
      }
      if (
        advancedFilters.maxPrice !== null &&
        price > advancedFilters.maxPrice
      ) {
        return false;
      }
    }

    // Filtro por ubicación (búsqueda más flexible)
    if (advancedFilters.location.trim()) {
      const searchLocation = advancedFilters.location.toLowerCase().trim();
      const locationStr =
        typeof prop.location === 'string'
          ? prop.location.toLowerCase()
          : `${prop.location.city || ''} ${prop.location.state || ''} ${
              prop.location.neighborhood || ''
            } ${prop.location.address || ''}`.toLowerCase();

      // Buscar si alguna palabra del filtro está en la ubicación
      const searchWords = searchLocation
        .split(/\s+/)
        .filter((word) => word.length > 2);
      const locationMatches =
        searchWords.length === 0
          ? locationStr.includes(searchLocation)
          : searchWords.some((word) => locationStr.includes(word));

      if (!locationMatches) {
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
  const itemsPerPage = 12; // Aumentar a 12 propiedades por página
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  totalPagesState.value = totalPages;

  // Aplicar paginación
  const currentPage = currentPageState.value;

  // Validar que la página actual no exceda el total (pero NO modificar dentro del computed)
  // Esto se manejará fuera del computed para evitar loops infinitos
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginated = filtered.slice(startIndex, endIndex);

  // Debug: log para verificar paginación
  if (total > 0) {
    console.log(
      `📄 Paginación computed: ${total} propiedades totales, página ${validPage} de ${totalPages}, mostrando ${paginated.length} propiedades (currentPageState: ${currentPage})`
    );
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

      // Función auxiliar para cargar una página de propiedades
      const fetchPage = async (
        page: number,
        limit: number = 50
      ): Promise<EasyBrokerProperty[]> => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
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
          params.append(
            'min_bathrooms',
            filters.search.min_bathrooms.toString()
          );
        }
        if (filters.search?.max_bathrooms !== undefined) {
          params.append(
            'max_bathrooms',
            filters.search.max_bathrooms.toString()
          );
        }
        if (filters.search?.locations?.length) {
          filters.search.locations.forEach((location) => {
            params.append('locations[]', location);
          });
        }

        try {
          const response = await fetch(
            `/api/easybroker/properties?${params.toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            return data.content || [];
          }
          return [];
        } catch (error) {
          console.warn(`⚠️ Error al cargar página ${page}:`, error);
          return [];
        }
      };

      // Cargar TODAS las propiedades de Easy Broker (múltiples requests si es necesario)
      let easyBrokerProperties: EasyBrokerProperty[] = [];
      let currentPage = 1;
      let hasMore = true;
      const limit = 50; // Máximo permitido por EasyBroker API

      console.log('🔄 Cargando todas las propiedades de Easy Broker...');

      while (hasMore) {
        const pageProperties = await fetchPage(currentPage, limit);
        if (pageProperties.length > 0) {
          easyBrokerProperties = [...easyBrokerProperties, ...pageProperties];
          console.log(
            `✅ Página ${currentPage}: ${pageProperties.length} propiedades (Total: ${easyBrokerProperties.length})`
          );

          // Si la página tiene menos propiedades que el límite, no hay más páginas
          if (pageProperties.length < limit) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(
        `✅ Easy Broker: ${easyBrokerProperties.length} propiedades cargadas en total`
      );

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
                  formatted_amount: `$${(prop.price / 1000000).toFixed(
                    1
                  )}M MXN`,
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
      const previousLength = propertiesState.value.length;
      propertiesState.value = allProperties;

      // NO resetear paginación al cargar nuevas propiedades - mantener la página actual
      // Solo resetear si es la primera carga (no había propiedades antes)
      if (previousLength === 0 && allProperties.length > 0) {
        console.log('🔄 Primera carga: reseteando a página 1');
        currentPageState.value = 1;
      } else {
        console.log('✅ Manteniendo página actual:', currentPageState.value);
      }
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
    const previousQuery = searchQueryState.value;
    searchQueryState.value = query;
    // Solo resetear paginación si la query realmente cambió (no es la misma)
    if (previousQuery !== query) {
      console.log('🔄 Query cambió, reseteando paginación:', {
        previousQuery,
        newQuery: query,
      });
      resetPagination(); // Resetear paginación al buscar
    } else {
      console.log(
        '⚠️ setSearchQuery llamado con la misma query, NO reseteando paginación'
      );
    }
  };

  const setSelectedType = (type: string): void => {
    const previousType = selectedTypeState.value;
    selectedTypeState.value = type;
    // Solo resetear paginación si el tipo realmente cambió
    if (previousType !== type) {
      console.log('🔄 Tipo cambió, reseteando paginación:', {
        previousType,
        newType: type,
      });
      resetPagination(); // Resetear paginación al cambiar tipo
    } else {
      console.log(
        '⚠️ setSelectedType llamado con el mismo tipo, NO reseteando paginación'
      );
    }
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
    console.log('🔍 setAdvancedFilters llamado con:', filters);
    advancedFiltersState.value = filters;
    resetPagination();
    // Actualizar filtros de API también (solo para filtros que la API soporta)
    setFilters({
      search: {
        ...filtersState.value.search,
        min_price: filters.minPrice ?? undefined,
        max_price: filters.maxPrice ?? undefined,
        min_bedrooms: filters.minBedrooms ?? undefined,
        max_bedrooms: filters.maxBedrooms ?? undefined,
        min_bathrooms: filters.minBathrooms ?? undefined,
        max_bathrooms: filters.maxBathrooms ?? undefined,
        // NO enviar locations a la API - el filtro de ubicación se aplica en el cliente
        // porque la API de EasyBroker requiere formato específico y el usuario puede buscar texto libre
      },
    });

    // Solo recargar desde la API si hay filtros que la API soporta (precio, recámaras, baños)
    // El filtro de ubicación se aplica en el cliente, no necesita recargar
    const hasApiFilters =
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.minBedrooms !== null ||
      filters.maxBedrooms !== null ||
      filters.minBathrooms !== null ||
      filters.maxBathrooms !== null;

    if (hasApiFilters) {
      console.log(
        '🔄 Recargando propiedades desde API con filtros de precio/recámaras/baños'
      );
      fetchProperties();
    } else {
      console.log(
        '✅ Filtros avanzados actualizados (solo ubicación), aplicando filtros en cliente'
      );
    }
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
    const maxPage = totalPagesState.value;
    const newPage = Math.max(1, Math.min(page, maxPage));

    console.log('🔢 setCurrentPage llamado:', {
      requestedPage: page,
      maxPage,
      currentPage: currentPageState.value,
      newPage,
    });

    if (newPage !== currentPageState.value) {
      currentPageState.value = newPage;
      console.log('✅ Página cambiada a:', newPage);
      // Scroll al inicio de la lista cuando cambias de página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('⚠️ Página no cambió (ya está en:', newPage, ')');
    }
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
    console.log('🔄 resetPagination llamado');
    currentPageState.value = 1;
  };

  // Función para corregir la página si excede el total
  // Se llama manualmente cuando es necesario, no automáticamente
  const correctPageIfNeeded = (): void => {
    const current = currentPageState.value;
    const total = totalPagesState.value;
    if (current > total && total > 0) {
      console.log(
        `⚠️ Corrigiendo página: ${current} > ${total}, ajustando a ${total}`
      );
      currentPageState.value = total;
    }
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
