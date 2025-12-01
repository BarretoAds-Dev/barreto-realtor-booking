import { computed, signal } from '@preact/signals';
import type {
  EasyBrokerProperty,
  EasyBrokerSearchFilters,
} from '../../../core/types/easybroker';

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
 * Computed: propiedades filtradas por búsqueda y paginadas
 */
const searchedProperties = computed(() => {
  const query = searchQueryState.value.toLowerCase().trim();
  let filtered = filteredProperties.value;

  if (query) {
    filtered = filteredProperties.value.filter((prop) => {
      const title = prop.title.toLowerCase();
      const address = prop.location.address?.toLowerCase() || '';
      const city = prop.location.city.toLowerCase();
      const neighborhood = prop.location.neighborhood?.toLowerCase() || '';
      const description = prop.description?.toLowerCase() || '';

      return (
        title.includes(query) ||
        address.includes(query) ||
        city.includes(query) ||
        neighborhood.includes(query) ||
        description.includes(query)
      );
    });
  }

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
    // Métodos
    fetchProperties,
    setSearchQuery,
    setSelectedType,
    setFilters,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
  };
}
