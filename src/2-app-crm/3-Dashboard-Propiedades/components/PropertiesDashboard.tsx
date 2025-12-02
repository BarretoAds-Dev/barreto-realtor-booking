/** @jsxImportSource preact */
import { easybrokerConfig } from '@/1-app-global-core/core/config';
import type { EasyBrokerProperty } from '@/1-app-global-core/core/types/easybroker';
import { getEasyBrokerPropertyUrl } from '@/1-app-global-core/core/utils/easybroker-url';
import type { JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { useProperties } from '../hooks/useProperties';
import { AdvancedFilters } from './AdvancedFilters';
import { CreatePropertyModal } from './CreatePropertyModal';
import { PropertyAppointmentModal } from './PropertyAppointmentModal';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';

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
    advancedFilters,
    fetchProperties,
    setSearchQuery,
    setSelectedType,
    setAdvancedFilters,
    resetAdvancedFilters,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
  } = useProperties();

  // Cargar propiedades al montar
  useEffect(() => {
    fetchProperties();
  }, []);

  // Corregir página si excede el total cuando cambia totalPages
  useEffect(() => {
    const current = currentPage.value;
    const total = totalPages.value;
    if (current > total && total > 0 && current !== 1) {
      console.log(`⚠️ Corrigiendo página en componente: ${current} > ${total}`);
      setCurrentPage(total);
    }
  }, [totalPages.value, currentPage.value]);

  // Handler estable para evitar re-renders en el hijo
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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

        {/* Filtros Básicos (Tipo de Propiedad) */}
        <PropertyFilters
          selectedType={selectedType.value}
          searchQuery={searchQuery.value}
          onTypeChange={setSelectedType}
          onSearchChange={handleSearchChange}
        />

        {/* Filtros Avanzados (con Search Protegido) */}
        <AdvancedFilters
          initialFilters={{
            minPrice: advancedFilters.value.minPrice,
            maxPrice: advancedFilters.value.maxPrice,
            minBedrooms: advancedFilters.value.minBedrooms,
            maxBedrooms: advancedFilters.value.maxBedrooms,
            minBathrooms: advancedFilters.value.minBathrooms,
            maxBathrooms: advancedFilters.value.maxBathrooms,
            location: advancedFilters.value.location,
            searchQuery: searchQuery.value, // Pasamos el valor actual del signal
          }}
          onFiltersChange={setAdvancedFilters}
          onSearchChange={handleSearchChange} // Usamos el callback estable
          onReset={resetAdvancedFilters}
        />

        {/* Contenido / Grid */}
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
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {properties.value.map((property) => (
                <PropertyCard
                  key={property.public_id}
                  property={property}
                  onClick={onPropertyClick}
                  onScheduleAppointment={(prop) => {
                    setSelectedPropertyForAppointment(prop);
                    setShowAppointmentModal(true);
                  }}
                  onGetAppointmentLink={async (prop) => {
                    try {
                      const baseUrl = window.location.origin;
                      const appointmentLink = `${baseUrl}/citas?propertyId=${prop.public_id}`;

                      // Intentar copiar al portapapeles
                      try {
                        await navigator.clipboard.writeText(appointmentLink);
                        alert('✅ Link de cita copiado al portapapeles:\n' + appointmentLink);
                      } catch (clipboardError) {
                        // Fallback: mostrar el link en un prompt
                        prompt('Link de cita (copia este link):', appointmentLink);
                      }
                    } catch (error) {
                      console.error('Error al generar link de cita:', error);
                      alert('No se pudo generar el link de cita.');
                    }
                  }}
                  onDownloadSheet={async (prop) => {
                    try {
                      if (!prop.public_url && !prop.slug) {
                        try {
                          const response = await fetch(
                            `/api/easybroker/properties/${prop.public_id}`
                          );
                          if (response.ok) {
                            const data = await response.json();
                            if (data.property?.public_url) {
                              window.open(data.property.public_url, '_blank');
                              return;
                            }
                          }
                        } catch (e) {
                          console.warn('⚠️ Error API URL:', e);
                        }
                      }
                      const easyBrokerUrl = getEasyBrokerPropertyUrl(
                        prop,
                        easybrokerConfig.agencySlug
                      );
                      window.open(easyBrokerUrl, '_blank');
                    } catch (error) {
                      alert('No se pudo abrir la ficha de la propiedad.');
                    }
                  }}
                />
              ))}
            </div>

            {/* Paginación Simplificada */}
            {totalPages.value > 1 && (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600">
                  Página {currentPage.value} de {totalPages.value}
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage.value === 1}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage.value === totalPages.value}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreatePropertyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchProperties();
          setShowCreateModal(false);
        }}
      />

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
        }}
      />
    </div>
  );
}
