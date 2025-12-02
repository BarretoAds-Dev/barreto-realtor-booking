/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  BUDGET_OPTIONS_COMPRAR,
  BUDGET_OPTIONS_RENTAR,
} from '@/1-app-global-core/core/config/constants';
import AppointmentFormFields from '@/1-app-global-core/shared/components/AppointmentFormFields';
import { useAppointmentForm } from '@/1-app-global-core/shared/hooks/useAppointmentForm';
import { Button, ErrorMessage, FormField, Input } from '@/1-app-global-core/shared/ui';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  property_type: string;
  imageUrl?: string | null;
  public_id?: string;
  operations?: Array<{ type: string; amount: number }>;
}

interface AppointmentFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedProperty?: {
    id: string;
    title: string;
    location?: string;
    address?: string;
    price?: number;
    image?: string;
  } | null;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

// Componente para selector de propiedades agrupadas por colonia
function PropertySelector({
  properties,
  selectedPropertyId,
  onPropertyChange,
  isLoading,
}: {
  properties: Property[];
  selectedPropertyId: string;
  onPropertyChange: (id: string) => void;
  isLoading: boolean;
}) {
  // Agrupar propiedades por colonia
  const groupedProperties = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    const other: Property[] = [];

    properties.forEach((prop) => {
      const addressParts = prop.address.split(',').map((p) => p.trim());
      let colonia = '';

      if (addressParts.length >= 2) {
        if (/\d/.test(addressParts[0])) {
          colonia = addressParts[1] || addressParts[0];
        } else {
          colonia = addressParts[0];
        }
      } else {
        colonia = prop.address;
      }

      colonia = colonia.replace(/^(Col\.|Colonia)\s*/i, '').trim();

      if (colonia && colonia.length > 0) {
        if (!groups[colonia]) {
          groups[colonia] = [];
        }
        groups[colonia].push(prop);
      } else {
        other.push(prop);
      }
    });

    const sortedGroups = Object.keys(groups).sort();
    return { groups, sortedGroups, other };
  }, [properties]);

  if (isLoading) {
    return (
      <select
        id="propertyId"
        name="propertyId"
        disabled
        class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
      >
        <option>Cargando propiedades...</option>
      </select>
    );
  }

  return (
    <select
      id="propertyId"
      name="propertyId"
      value={selectedPropertyId}
      onChange={(e) => onPropertyChange((e.target as HTMLSelectElement).value)}
      class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-900"
    >
      <option value="">Seleccionar propiedad (opcional)</option>
      {groupedProperties.sortedGroups.map((colonia) => (
        <optgroup key={colonia} label={`📍 ${colonia}`}>
          {groupedProperties.groups[colonia].map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.title} -{' '}
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(prop.price)}
            </option>
          ))}
        </optgroup>
      ))}
      {groupedProperties.other.length > 0 && (
        <optgroup label="📍 Otras ubicaciones">
          {groupedProperties.other.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.title} -{' '}
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(prop.price)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export default function AppointmentForm({
  selectedDate,
  selectedTime,
  selectedProperty: preselectedProperty,
  onBack,
  onSubmit,
}: AppointmentFormProps) {
  const {
    operationType,
    resourceType,
    creditoPreaprobado,
    isSubmitting,
    setIsSubmitting,
    errors,
    setErrors,
    touched,
    setTouched,
    handleBlur,
    handleRadioChange,
    handleSelectChange,
    validateForm,
  } = useAppointmentForm({
    selectedDate,
    selectedTime,
    formId: 'appointmentForm',
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    preselectedProperty?.id || ''
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Cargar propiedades disponibles
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      try {
        const [easyBrokerRes, supabaseRes] = await Promise.all([
          fetch('/api/easybroker/properties?limit=100').catch(() => null),
          fetch('/api/properties').catch(() => null),
        ]);

        const allProperties: Property[] = [];

        if (easyBrokerRes?.ok) {
          const easyBrokerData = await easyBrokerRes.json();
          if (easyBrokerData.content) {
            easyBrokerData.content.forEach((prop: any) => {
              const price =
                prop.operations?.[0]?.amount ||
                prop.price?.amount ||
                prop.price ||
                0;
              allProperties.push({
                id: prop.public_id || prop.id,
                title: prop.title,
                address:
                  typeof prop.location === 'string'
                    ? prop.location
                    : prop.location?.address ||
                      prop.location?.city ||
                      prop.address ||
                      'Dirección no disponible',
                price: price,
                property_type: prop.property_type || 'casa',
                imageUrl:
                  prop.title_image_thumb ||
                  prop.title_image_full ||
                  prop.images?.[0]?.url ||
                  null,
                public_id: prop.public_id,
                operations: prop.operations || [],
              });
            });
          }
        }

        if (supabaseRes?.ok) {
          const supabaseData = await supabaseRes.json();
          if (supabaseData.properties) {
            supabaseData.properties.forEach((prop: any) => {
              allProperties.push({
                id: prop.id,
                title: prop.title,
                address: prop.address,
                price: prop.price,
                property_type: prop.property_type || 'casa',
                imageUrl: null,
                public_id: prop.features?.easybroker_public_id || null,
              });
            });
          }
        }

        setProperties(allProperties);
      } catch (error) {
        console.error('Error al cargar propiedades:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  // Obtener precio de la propiedad seleccionada
  const currentSelectedProperty =
    preselectedProperty || properties.find((p) => p.id === selectedPropertyId);
  const propertyPrice: number = currentSelectedProperty
    ? preselectedProperty
      ? preselectedProperty.price || 0
      : (currentSelectedProperty as Property).price || 0
    : 0;

  // Determinar el tipo de operación permitido basado en la propiedad seleccionada
  const getAllowedOperationType = (): 'rentar' | 'comprar' | null => {
    if (!currentSelectedProperty) return null;

    // Si es una propiedad preseleccionada, no tenemos operations, así que permitimos ambas
    if (preselectedProperty) return null;

    const property = currentSelectedProperty as Property;
    if (property.operations && property.operations.length > 0) {
      const operationType = property.operations[0].type.toLowerCase();
      if (operationType.includes('rent') || operationType.includes('renta')) {
        return 'rentar';
      }
      if (operationType.includes('sale') || operationType.includes('venta')) {
        return 'comprar';
      }
    }
    return null;
  };

  const allowedOperationType = getAllowedOperationType();

  // Actualizar operationType automáticamente cuando se selecciona una propiedad
  useEffect(() => {
    if (allowedOperationType && operationType !== allowedOperationType) {
      // Limpiar el error inmediatamente antes de actualizar
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.operationType;
        return newErrors;
      });

      // Actualizar el estado usando handleRadioChange
      handleRadioChange('operationType', allowedOperationType);

      // Actualizar el radio button en el DOM para sincronización
      setTimeout(() => {
        const form = document.getElementById(
          'appointmentForm'
        ) as HTMLFormElement;
        if (form) {
          // Desmarcar todos los radios primero
          const allRadios = form.querySelectorAll(
            'input[name="operationType"]'
          ) as NodeListOf<HTMLInputElement>;
          allRadios.forEach((radio) => {
            radio.checked = false;
          });

          // Marcar el radio correcto
          const targetRadio = form.querySelector(
            `input[name="operationType"][value="${allowedOperationType}"]`
          ) as HTMLInputElement;
          if (targetRadio) {
            targetRadio.checked = true;
            // Disparar evento change para que Preact lo detecte
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }, 0);
    }
  }, [allowedOperationType, selectedPropertyId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = await validateForm();
    if (!validation.success) {
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📤 Enviando cita a la API:', validation.data);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();
      console.log('📥 Respuesta de la API:', {
        status: response.status,
        result,
      });

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result);
        setErrors({
          general: result.details || result.error || 'Error al crear la cita',
        });
        setIsSubmitting(false);
        return;
      }

      // Verificar que la cita se creó correctamente
      if (!result.appointment || !result.appointment.id) {
        console.error('❌ La cita no se creó correctamente:', result);
        setErrors({
          general:
            'Error: La cita no se creó correctamente. Por favor intenta nuevamente.',
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Cita creada exitosamente, llamando a onSubmit');
      onSubmit({
        ...validation.data,
        appointmentId: result.appointment.id,
      });
      setIsSubmitting(false);
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setErrors({
        general:
          'Error de conexión. Por favor verifica tu conexión e intenta nuevamente.',
      });
      setIsSubmitting(false);
    }
  };

  if (!selectedDate || !selectedTime) return null;

  const dateStr = selectedDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div class="max-w-xl mx-auto transition-all duration-500">
      <div class="text-center mb-6">
        <button
          onClick={onBack}
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors font-semibold uppercase tracking-wide"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Cambiar hora
        </button>
        <h2 class="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Información de contacto
        </h2>
        <p class="text-gray-600 text-sm">
          Completa los datos para confirmar la cita
        </p>
      </div>

      {/* Resumen de selección */}
      <div class="bg-gray-100 p-4 mb-6 border border-gray-200 rounded-lg">
        {/* Fecha y hora */}
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Fecha seleccionada</p>
            <p class="text-sm font-semibold text-gray-900">
              {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 mb-1">Hora seleccionada</p>
            <p class="text-sm font-bold text-gray-900">{selectedTime}</p>
          </div>
        </div>

        {/* Propiedad de interés (si existe) */}
        {currentSelectedProperty && (
          <div class="border-t border-gray-200 pt-4 mt-4">
            <p class="text-xs text-gray-500 mb-2">Propiedad de interés</p>
            <div class="flex items-center gap-3">
              {/* Imagen de la propiedad */}
              {(() => {
                const img = preselectedProperty
                  ? preselectedProperty.image
                  : (currentSelectedProperty as Property)?.imageUrl;
                return img;
              })() && (
                <img
                  src={(() => {
                    const img = preselectedProperty
                      ? preselectedProperty.image
                      : (currentSelectedProperty as Property)?.imageUrl;
                    if (!img) return '';
                    return img.includes('easybroker.com') ||
                      img.includes('ebimg') ||
                      img.includes('cloudfront')
                      ? `/api/easybroker/image-proxy?url=${encodeURIComponent(
                          img
                        )}`
                      : img;
                  })()}
                  alt={currentSelectedProperty.title}
                  class="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {currentSelectedProperty.title}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {'address' in currentSelectedProperty
                    ? currentSelectedProperty.address
                    : currentSelectedProperty.location ||
                      currentSelectedProperty.address ||
                      ''}
                </p>
                {propertyPrice > 0 && (
                  <p class="text-xs font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    }).format(propertyPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <form id="appointmentForm" onSubmit={handleSubmit} class="space-y-5">
        <ErrorMessage
          errors={errors}
          general={errors.general}
          variant="light"
        />

        {/* Selector de Propiedad (Opcional) - Solo mostrar si no hay propiedad preseleccionada */}
        {!preselectedProperty && (
          <FormField label="Propiedad de interés" optional variant="light">
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={(id) => {
                setSelectedPropertyId(id);
                // Limpiar errores cuando se cambia la propiedad
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.operationType;
                  return newErrors;
                });
              }}
              isLoading={isLoadingProperties}
            />
          </FormField>
        )}

        {/* Mostrar propiedad preseleccionada */}
        {preselectedProperty && (
          <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Propiedad seleccionada
            </label>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-gray-900">
                {preselectedProperty.title}
              </p>
              <p class="text-xs text-gray-600">
                {preselectedProperty.location ||
                  preselectedProperty.address ||
                  ''}
              </p>
              {preselectedProperty.price && preselectedProperty.price > 0 && (
                <p class="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  }).format(preselectedProperty.price)}
                </p>
              )}
            </div>
          </div>
        )}

        <FormField
          label="Nombre completo"
          required
          error={errors.name}
          touched={touched.name}
          variant="light"
        >
          <Input
            name="name"
            type="text"
            placeholder="Ej: Juan Pérez"
            required
            onBlur={() => handleBlur('name')}
            error={errors.name}
            touched={touched.name}
            variant="light"
          />
        </FormField>

        <FormField
          label="Correo electrónico"
          required
          error={errors.email}
          touched={touched.email}
          variant="light"
        >
          <Input
            name="email"
            type="email"
            placeholder="Ej: juan@ejemplo.com"
            required
            onBlur={() => handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            variant="light"
          />
        </FormField>

        <FormField
          label="Teléfono"
          optional
          error={errors.phone}
          touched={touched.phone}
          variant="light"
        >
          <Input
            name="phone"
            type="tel"
            placeholder="Ej: +34 600 000 000"
            onBlur={() => handleBlur('phone')}
            error={errors.phone}
            touched={touched.phone}
            variant="light"
          />
        </FormField>

        <AppointmentFormFields
          operationType={operationType}
          resourceType={resourceType}
          creditoPreaprobado={creditoPreaprobado}
          errors={errors}
          touched={touched}
          onBlur={handleBlur}
          onOperationTypeChange={(value) =>
            handleRadioChange('operationType', value)
          }
          onResourceTypeChange={(value) =>
            handleSelectChange('resourceType', value)
          }
          onCreditoPreaprobadoChange={(value) =>
            handleSelectChange('creditoPreaprobado', value)
          }
          propertyPrice={propertyPrice}
          variant="light"
          allowedOperationType={allowedOperationType}
          onBudgetChange={(fieldName, value) => {
            // Validar presupuesto en tiempo real
            if (!value) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
              });
              return;
            }

            // Usar el propertyPrice del estado
            if (propertyPrice > 0) {
              // Obtener min del rango
              const options =
                fieldName === 'budgetRentar'
                  ? BUDGET_OPTIONS_RENTAR
                  : BUDGET_OPTIONS_COMPRAR;
              const option = options.find((opt) => opt.value === value);
              const minBudget = option?.min || 0;

              if (minBudget > 0 && minBudget < propertyPrice) {
                const formattedPrice = new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(propertyPrice);

                setErrors((prev) => ({
                  ...prev,
                  [fieldName]: `El rango seleccionado es menor al precio de la propiedad (${formattedPrice}). Por favor selecciona un rango adecuado.`,
                }));
                setTouched((prev: Record<string, boolean>) => ({
                  ...prev,
                  [fieldName]: true,
                }));
              } else {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[fieldName];
                  return newErrors;
                });
              }
            }
          }}
        />

        <FormField label="Notas adicionales" optional variant="light">
          <textarea
            name="notes"
            rows={4}
            class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-900 placeholder-gray-400"
            placeholder="Cuéntanos sobre el motivo de tu cita..."
          ></textarea>
        </FormField>

        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
          size="lg"
        >
          Confirmar cita
        </Button>
      </form>
    </div>
  );
}
