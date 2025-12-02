import { useEffect, useState } from 'preact/hooks';
import type { EasyBrokerProperty } from '@/1-app-global-core/core/types/easybroker';

interface PropertiesListProps {
  initialProperties?: EasyBrokerProperty[];
  onPropertyClick?: (property: EasyBrokerProperty) => void;
}

/**
 * Componente para mostrar lista de propiedades de Easy Broker
 * Usa client:visible para carga lazy (Islands Architecture)
 */
export function PropertiesList({
  initialProperties = [],
  onPropertyClick,
}: PropertiesListProps) {
  const [properties, setProperties] =
    useState<EasyBrokerProperty[]>(initialProperties);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/easybroker/properties?limit=20');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener propiedades');
      }

      setProperties(data.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProperties.length === 0) {
      fetchProperties();
    }
  }, []);

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-500">Cargando propiedades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchProperties}
          className="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-text-500">
        No se encontraron propiedades
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <article
          key={property.public_id}
          className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-all duration-200 hover:shadow-lg"
          onClick={() => onPropertyClick?.(property)}
        >
          {property.title_image_full && (
            <div className="relative h-48 w-full overflow-hidden bg-gray-200">
              <img
                src={property.title_image_full}
                alt={property.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="mb-2 text-lg font-bold text-text-900 line-clamp-2">
              {property.title}
            </h3>
            <div className="mb-2 text-sm text-text-500">
              {property.location.city}, {property.location.state}
            </div>
            {property.operations.length > 0 && (
              <div className="mb-2">
                <span className="text-lg font-semibold text-primary-600">
                  {property.operations[0]?.formatted_amount}
                </span>
                {property.operations[0]?.unit && (
                  <span className="text-sm text-text-500">
                    {' '}
                    / {property.operations[0].unit}
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-4 text-sm text-text-500">
              {property.features.bedrooms && (
                <span>
                  {property.features.bedrooms}{' '}
                  {property.features.bedrooms === 1 ? 'recámara' : 'recámaras'}
                </span>
              )}
              {property.features.bathrooms && (
                <span>
                  {property.features.bathrooms}{' '}
                  {property.features.bathrooms === 1 ? 'baño' : 'baños'}
                </span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
