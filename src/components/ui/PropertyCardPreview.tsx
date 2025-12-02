/** @jsxImportSource preact */
import type { EasyBrokerProperty } from '@/1-app-global-core/types/easybroker';

interface PropertyCardPreviewProps {
  property: EasyBrokerProperty;
}

export function PropertyCardPreview({ property }: PropertyCardPreviewProps) {
  // Obtener la primera operación (renta o venta)
  const operation = property.operations?.[0];
  const price = operation?.formatted_amount || operation?.amount?.toLocaleString('es-MX', {
    style: 'currency',
    currency: operation?.currency || 'MXN',
  }) || 'Precio no disponible';

  // Obtener ubicación
  const location = typeof property.location === 'string'
    ? property.location
    : property.location?.neighborhood || property.location?.address || 'Ubicación no disponible';

  // Obtener imagen
  const imageUrl = property.title_image_full || property.title_image_thumb || property.images?.[0]?.url || null;

  return (
    <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6 animate-fadeIn">
      <div class="flex flex-col sm:flex-row">
        {/* Imagen */}
        {imageUrl ? (
          <div class="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={property.title}
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute top-3 left-3">
              <span class="bg-gray-900/80 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                {property.property_type}
              </span>
            </div>
          </div>
        ) : (
          <div class="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg
              class="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <div class="absolute top-3 left-3">
              <span class="bg-gray-900/80 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                {property.property_type}
              </span>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div class="flex-1 p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {property.title}
              </h3>
              <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <svg
                  class="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Características */}
          {property.features && (
            <div class="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
              {property.features.bedrooms > 0 && (
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>{property.features.bedrooms} Recámaras</span>
                </div>
              )}
              {property.features.bathrooms > 0 && (
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                  <span>{property.features.bathrooms} Baños</span>
                </div>
              )}
              {property.features.parking_spaces > 0 && (
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{property.features.parking_spaces} Estacionamientos</span>
                </div>
              )}
              {property.features.construction_size > 0 && (
                <div class="flex items-center gap-1.5">
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  <span>{property.features.construction_size} m²</span>
                </div>
              )}
            </div>
          )}

          {/* Precio */}
          <div class="flex items-center justify-between pt-3 border-t border-gray-200">
            <div>
              <p class="text-xs text-gray-500 mb-1">Precio</p>
              <p class="text-2xl font-bold text-gray-900">{price}</p>
            </div>
            {operation?.type && (
              <span class="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                {operation.type === 'sale' ? 'Venta' : operation.type === 'rent' ? 'Renta' : operation.type}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

