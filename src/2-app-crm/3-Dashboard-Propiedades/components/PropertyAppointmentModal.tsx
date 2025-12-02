/** @jsxImportSource preact */
import type { EasyBrokerProperty } from '@/1-app-global-core/types/easybroker';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import AppointmentFormCRM from '../../4-Dashboard-CitasyClientes/components/AppointmentFormCRM';
import CalendarCRM from '../../4-Dashboard-CitasyClientes/components/CalendarCRM';
import TimeSlotsCRM from '../../4-Dashboard-CitasyClientes/components/TimeSlotsCRM';

interface AvailableSlot {
  date: string;
  dayOfWeek: string;
  slots: Array<{
    time: string;
    available: boolean;
    capacity: number;
    booked: number;
    enabled?: boolean;
  }>;
  metadata?: {
    notes?: string;
    specialHours?: boolean;
  };
}

interface PropertyAppointmentModalProps {
  isOpen: boolean;
  property: EasyBrokerProperty | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3;

export function PropertyAppointmentModal({
  isOpen,
  property,
  onClose,
  onSuccess,
}: PropertyAppointmentModalProps): JSX.Element | null {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const [syncedPropertyId, setSyncedPropertyId] = useState<string | null>(null);

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadAvailability = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/appointments/available?start=${startDate}&end=${endDateStr}`
      );
      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar propiedad cuando se abre el modal
  useEffect(() => {
    if (isOpen && property) {
      loadAvailability();

      // Sincronizar propiedad con Supabase para obtener UUID
      const syncProperty = async (): Promise<void> => {
        // Si la propiedad ya tiene 'id' (propiedad de Supabase), usar ese directamente
        if (property && 'id' in property && typeof property.id === 'string') {
          setSyncedPropertyId(property.id);
          console.log(
            '✅ Usando propiedad existente de Supabase:',
            property.id
          );
          return;
        }

        // Si es una propiedad de Easy Broker, buscar o crear en Supabase
        if (property && property.public_id) {
          try {
            console.log(
              '🔄 Sincronizando propiedad de Easy Broker con Supabase...'
            );
            const propertyResponse = await fetch(
              '/api/properties/sync-easybroker',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  public_id: property.public_id,
                  title: property.title,
                  address:
                    typeof property.location === 'string'
                      ? property.location
                      : property.location?.address ||
                        property.location?.city ||
                        'Dirección no disponible',
                  price: property.operations[0]?.amount || 0,
                  property_type: property.property_type || 'casa',
                  bedrooms: property.features?.bedrooms || null,
                  bathrooms: property.features?.bathrooms || null,
                  area: property.features?.construction_size || null,
                  description: property.description || null,
                }),
              }
            );

            if (propertyResponse.ok) {
              const result = await propertyResponse.json();
              // El endpoint retorna { property: { id: '...' } } o { property: [{ id: '...' }] }
              const propertyId = Array.isArray(result.property)
                ? result.property[0]?.id
                : result.property?.id;

              if (propertyId) {
                setSyncedPropertyId(propertyId);
                console.log(
                  '✅ Propiedad sincronizada exitosamente:',
                  propertyId
                );
              } else {
                console.warn(
                  '⚠️ Propiedad sincronizada pero sin ID válido:',
                  result
                );
              }
            } else {
              const errorResult = await propertyResponse.json();
              console.warn('⚠️ Error al sincronizar propiedad:', errorResult);
            }
          } catch (error) {
            console.warn(
              '⚠️ No se pudo sincronizar la propiedad con Supabase:',
              error
            );
          }
        }
      };

      syncProperty();
    } else if (!isOpen) {
      // Limpiar estado cuando se cierra el modal
      setSyncedPropertyId(null);
    }
  }, [isOpen, property]);

  const slotsForSelectedDate =
    availableSlots.find(
      (slot) => selectedDate && slot.date === formatDateLocal(selectedDate)
    )?.slots || [];

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    setSelectedTime(null);
    setCurrentStep(2);
    loadAvailability();
  };

  const handleTimeSelect = (time: string): void => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handleFormSubmit = async (data: any): Promise<void> => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    // Usar el propertyId sincronizado (ya debería estar disponible)
    const propertyId = syncedPropertyId;

    if (propertyId) {
      console.log('✅ Usando propertyId sincronizado:', propertyId);
    } else {
      console.warn(
        '⚠️ No hay propertyId sincronizado, la cita se creará sin propiedad asociada'
      );
    }

    // Agregar información de la propiedad a los datos de la cita
    // Incluir public_id de Easy Broker en las notas para poder buscar la imagen después
    const notesWithProperty = property
      ? `${data.notes || ''}\n\nPropiedad: ${property.title}${
          property.location
            ? `\nDirección: ${
                typeof property.location === 'string'
                  ? property.location
                  : property.location.address || property.location.city || ''
              }`
            : ''
        }${
          property.public_id ? `\nEasy Broker ID: ${property.public_id}` : ''
        }${
          property.title_image_thumb || property.title_image_full
            ? `\nImagen: ${
                property.title_image_thumb || property.title_image_full
              }`
            : ''
        }`.trim()
      : data.notes;

    const appointmentData = {
      ...data,
      propertyId: propertyId,
      notes: notesWithProperty,
    };

    try {
      console.log('📤 Enviando datos de cita al servidor...');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error al crear cita:', result);
        setIsSubmitting(false);
        alert(result.error || result.details || 'Error al crear la cita');
        return;
      }

      console.log('✅ Cita creada exitosamente:', result);

      // Mostrar mensaje de éxito
      const propertyTitle = property?.title || 'la propiedad';
      const dateStr =
        selectedDate?.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) || data.date;
      const timeStr = selectedTime || data.time;

      setSuccessMessage(
        `¡Cita creada exitosamente para ${propertyTitle} el ${dateStr} a las ${timeStr}!`
      );

      // Recargar disponibilidad para actualizar los slots (sin bloquear si falla)
      loadAvailability().catch((error) => {
        console.warn(
          '⚠️ Error al recargar disponibilidad (no crítico):',
          error
        );
        // No mostrar error al usuario, solo loguear
      });

      // Esperar 2.5 segundos para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        // Notificar éxito y cerrar modal
        onSuccess();
        onClose();

        // Resetear estado
        setCurrentStep(1);
        setSelectedDate(null);
        setSelectedTime(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
      }, 2500);
    } catch (error) {
      console.error('❌ Error al crear cita:', error);
      setIsSubmitting(false);
      alert(
        'Error de conexión al crear la cita. Por favor verifica tu conexión e intenta nuevamente.'
      );
    }
  };

  const handleBackToCalendar = (): void => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    loadAvailability();
  };

  const handleBackToTime = (): void => {
    setCurrentStep(2);
    setSelectedTime(null);
  };

  useEffect(() => {
    if (!isOpen) {
      const existingModal = document.getElementById(
        'property-appointment-modal-root'
      );
      if (existingModal) {
        render(null, existingModal);
        existingModal.remove();
      }
      setModalRoot(null);
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      return;
    }

    let root = document.getElementById('property-appointment-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'property-appointment-modal-root';
      root.style.cssText =
        'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;';
      document.body.appendChild(root);
    }
    setModalRoot(root);

    return () => {
      if (root && root.parentNode) {
        render(null, root);
        root.remove();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!modalRoot || !isOpen || !property) return;

    const ModalContent = () => (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con imagen de propiedad */}
          <div className="relative">
            {/* Imagen de fondo */}
            {property.title_image_full && (
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={
                    property.title_image_full.includes('easybroker.com') ||
                    property.title_image_full.includes('ebimg')
                      ? `/api/easybroker/image-proxy?url=${encodeURIComponent(
                          property.title_image_full
                        )}`
                      : property.title_image_full
                  }
                  alt={property.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.warn(
                      '⚠️ Error al cargar imagen en modal:',
                      property.title_image_full
                    );
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>
            )}
            {/* Contenido del header */}
            <div
              className={`${
                property.title_image_full
                  ? 'absolute bottom-0 left-0 right-0'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              } px-6 py-5`}
            >
              <div className="flex items-center justify-between">
                <div className={property.title_image_full ? 'text-white' : ''}>
                  <h2 className="text-2xl font-bold">Agendar Cita</h2>
                  <p
                    className={`text-sm mt-1 ${
                      property.title_image_full
                        ? 'text-white/90'
                        : 'text-blue-100'
                    }`}
                  >
                    {property.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`transition-colors p-2 hover:bg-white/10 rounded-lg ${
                    property.title_image_full
                      ? 'text-white/80 hover:text-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="mb-6 rounded-xl bg-green-50 border-2 border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold text-lg">
                      ¡Cita creada exitosamente!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      {successMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <CalendarCRM
                availableSlots={availableSlots}
                onDateSelect={handleDateSelect}
                isLoading={isLoading}
              />
            )}
            {currentStep === 2 && selectedDate && (
              <TimeSlotsCRM
                selectedDate={selectedDate}
                slots={slotsForSelectedDate}
                onTimeSelect={handleTimeSelect}
                onBack={handleBackToCalendar}
              />
            )}
            {currentStep === 3 && selectedDate && selectedTime && (
              <AppointmentFormCRM
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBack={handleBackToTime}
                onSubmit={handleFormSubmit}
                preselectedProperty={
                  property
                    ? {
                        id: syncedPropertyId || '', // Usar UUID sincronizado, no public_id
                        title: property.title,
                        address:
                          typeof property.location === 'string'
                            ? property.location
                            : property.location?.address ||
                              property.location?.city ||
                              'Dirección no disponible',
                        price: property.operations[0]?.amount || 0,
                        property_type: property.property_type,
                        operations: property.operations,
                      }
                    : null
                }
                allowedOperationType={
                  property?.operations && property.operations.length > 0
                    ? (() => {
                        const opType =
                          property.operations[0].type.toLowerCase();
                        if (
                          opType.includes('rent') ||
                          opType.includes('renta')
                        ) {
                          return 'rentar';
                        }
                        if (
                          opType.includes('sale') ||
                          opType.includes('venta')
                        ) {
                          return 'comprar';
                        }
                        return null;
                      })()
                    : null
                }
              />
            )}
          </div>
        </div>
      </div>
    );

    render(<ModalContent />, modalRoot);
  }, [
    modalRoot,
    isOpen,
    property,
    currentStep,
    selectedDate,
    selectedTime,
    availableSlots,
    slotsForSelectedDate,
    isLoading,
    isSubmitting,
    successMessage,
    onClose,
    onSuccess,
  ]);

  return null;
}
