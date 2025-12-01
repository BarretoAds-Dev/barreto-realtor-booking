/** @jsxImportSource preact */
import type { EasyBrokerProperty } from '../../../core/types/easybroker';
import Button from '../../../shared/ui/atoms/Button';

interface PropertyCardProps {
  property: EasyBrokerProperty;
  onClick?: (property: EasyBrokerProperty) => void;
  onScheduleAppointment?: (property: EasyBrokerProperty) => void;
  onDownloadSheet?: (property: EasyBrokerProperty) => void;
}

/**
 * Card de propiedad siguiendo el diseño de la imagen
 * Muestra imagen, precio, ubicación y características
 */
/**
 * Obtiene la URL de la imagen usando el proxy si es necesario
 */
function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Si la imagen es de Easy Broker, usar el proxy para evitar CORS
  if (imageUrl.includes('easybroker.com') || imageUrl.includes('ebimg')) {
    return `/api/easybroker/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  return imageUrl;
}

export function PropertyCard({
  property,
  onClick,
  onScheduleAppointment,
  onDownloadSheet,
}: PropertyCardProps) {
  const mainImageUrl = property.title_image_full || property.images[0]?.url;
  const mainImage = getImageUrl(mainImageUrl);
  const price = property.operations[0];
  const propertyTypeLabel = getPropertyTypeLabel(property.property_type);

  const handleClick = (): void => {
    onClick?.(property);
  };

  const handleScheduleAppointment = (e: Event): void => {
    e.stopPropagation();
    onScheduleAppointment?.(property);
  };

  const handleDownloadSheet = (e: Event): void => {
    e.stopPropagation();
    onDownloadSheet?.(property);
  };

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* Imagen con placeholder si no hay */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {mainImage ? (
          <img
            src={mainImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              console.warn('⚠️ Error al cargar imagen:', mainImage);
              // Intentar usar la imagen thumb como fallback
              if (
                property.title_image_thumb &&
                property.title_image_thumb !== mainImageUrl
              ) {
                const thumbUrl = getImageUrl(property.title_image_thumb);
                if (thumbUrl) {
                  (e.target as HTMLImageElement).src = thumbUrl;
                }
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Tag de tipo de propiedad */}
        {propertyTypeLabel && (
          <div className="absolute right-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
            {propertyTypeLabel}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        {/* Título */}
        <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
          {property.title}
        </h3>

        {/* Precio */}
        {price && (
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">
              {price.formatted_amount}
            </span>
            {price.unit && (
              <span className="ml-1 text-sm text-gray-500 font-normal">
                / {price.unit}
              </span>
            )}
            {!price.unit && price.currency && (
              <span className="ml-1 text-sm text-gray-500 font-normal">
                {price.currency}
              </span>
            )}
          </div>
        )}

        {/* Dirección - Siempre visible */}
        <div className="mb-4 flex min-h-[2.5rem] items-start gap-1.5 text-sm text-gray-700">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-2 flex-1 text-sm leading-snug">
            {formatLocation(property.location)}
          </span>
        </div>

        {/* Características: Recámaras, Baños, Estacionamientos, m² - Siempre visible */}
        <div className="mb-4 min-h-[4rem] grid grid-cols-4 gap-2 border-t border-gray-200 pt-3">
          {/* Recámaras - Siempre visible */}
          <div className="flex flex-col items-center gap-1">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-bold text-gray-900">
              {property.features.bedrooms ?? '-'}
            </span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">
              {property.features.bedrooms === 1
                ? 'Recámara'
                : property.features.bedrooms
                ? 'Recámaras'
                : 'Recámaras'}
            </span>
          </div>
          {/* Baños - Siempre visible */}
          <div className="flex flex-col items-center gap-1">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2.5 1a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V1zM2.5 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V7zM2.5 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zM8.5 1a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V1zM8.5 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V7zM8.5 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zM14.5 1a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V1zM14.5 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V7zM14.5 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
            </svg>
            <span className="text-xs font-bold text-gray-900">
              {property.features.bathrooms ?? '-'}
            </span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">
              {property.features.bathrooms === 1
                ? 'Baño'
                : property.features.bathrooms
                ? 'Baños'
                : 'Baños'}
            </span>
          </div>
          {/* Estacionamientos - Siempre visible */}
          <div className="flex flex-col items-center gap-1">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
            <span className="text-xs font-bold text-gray-900">
              {property.features.parking_spaces ?? '-'}
            </span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">
              {property.features.parking_spaces === 1
                ? 'Estacionamiento'
                : property.features.parking_spaces
                ? 'Estacionamientos'
                : 'Estacionamientos'}
            </span>
          </div>
          {/* Área (m²) - Siempre visible */}
          <div className="flex flex-col items-center gap-1">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 011 1v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v2a1 1 0 01-1-1H4a1 1 0 00-1 1v8h12v-2a1 1 0 011-1h2a1 1 0 011 1v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-bold text-gray-900">
              {property.features.construction_size ?? property.features.lot_size ?? '-'}
            </span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">m²</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-auto flex gap-1.5 pt-3 border-t border-gray-200">
          {onScheduleAppointment && (
            <Button
              type="button"
              onClick={handleScheduleAppointment}
              variant="primary"
              size="sm"
              fullWidth
              uppercase={false}
              className="text-xs px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white h-7"
            >
              <svg
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Crear Cita
            </Button>
          )}
          {onDownloadSheet && (
            <Button
              type="button"
              onClick={handleDownloadSheet}
              variant="primary"
              size="sm"
              uppercase={false}
              className="text-xs px-2 py-1 bg-gray-900 hover:bg-gray-800 text-white h-7"
            >
              <svg
                className="h-3 w-3 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ficha
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Formatea la ubicación de la propiedad
 * EasyBroker devuelve location como STRING, no como objeto
 */
function formatLocation(location: EasyBrokerProperty['location']): string {
  // Si location es un string (lo que devuelve EasyBroker normalmente)
  if (typeof location === 'string' && location.trim() !== '') {
    return location.trim();
  }

  // Si location es un objeto (estructura antigua o fallback)
  if (typeof location === 'object' && location !== null) {
    const parts: string[] = [];

    if ('address' in location && location.address) {
      parts.push(String(location.address));
    }
    if ('neighborhood' in location && location.neighborhood) {
      parts.push(String(location.neighborhood));
    }
    if ('city' in location && location.city) {
      parts.push(String(location.city));
    }
    if ('state' in location && location.state && location.state !== location.city) {
      parts.push(String(location.state));
    }

    return parts.length > 0 ? parts.join(', ') : 'Ubicación no disponible';
  }

  // Fallback
  return 'Ubicación no disponible';
}

/**
 * Obtiene la etiqueta en español del tipo de propiedad
 */
function getPropertyTypeLabel(propertyType: string): string {
  const type = propertyType.toLowerCase();
  const typeMap: Record<string, string> = {
    house: 'Casa',
    casa: 'Casa',
    villa: 'Casa',
    residencia: 'Casa',
    apartment: 'Departamento',
    departamento: 'Departamento',
    loft: 'Departamento',
    penthouse: 'Departamento',
    land: 'Terreno',
    terreno: 'Terreno',
    lote: 'Terreno',
    commercial: 'Comercial',
    comercial: 'Comercial',
    local: 'Comercial',
    oficina: 'Comercial',
  };

  for (const [key, label] of Object.entries(typeMap)) {
    if (type.includes(key)) {
      return label;
    }
  }

  return propertyType;
}
