/** @jsxImportSource preact */
import type {
  AppointmentConfig,
  AppointmentStep,
  AvailableSlot,
} from '@/1-app-global-core/types/appointment';
import AppointmentFormCRM from '@/2-app-crm/4-Dashboard-CitasyClientes/components/AppointmentFormCRM';
import CalendarCRM from '@/2-app-crm/4-Dashboard-CitasyClientes/components/CalendarCRM';
import TimeSlotsCRM from '@/2-app-crm/4-Dashboard-CitasyClientes/components/TimeSlotsCRM';
import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import AppointmentForm from './ui-bookingpublic/AppointmentForm';
import Calendar from './ui-bookingpublic/Calendar';
import ConfirmationPanel from './ui-bookingpublic/ConfirmationPanel';
import ProgressIndicator from './ui-bookingpublic/ProgressIndicator';
import TimeSlots from './ui-bookingpublic/TimeSlots';

type Step = AppointmentStep;

interface BookingPublicProps {
  availableSlots: AvailableSlot[];
  config: AppointmentConfig;
  // Props para modal
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  // Props para CRM
  preselectedProperty?: {
    id: string;
    title: string;
    address: string;
    price: number;
    property_type: string;
    operations?: Array<{ type: string; amount: number }>;
  } | null;
  allowedOperationType?: 'rentar' | 'comprar' | null;
  // Determinar si usar formulario CRM o público
  useCRMForm?: boolean;
  // Determinar si mostrar confirmación (solo para público)
  showConfirmation?: boolean;
}

export default function BookingPublic({
  availableSlots: initialAvailableSlots,
  config,
  isModal = false,
  isOpen = true,
  onClose,
  onSuccess,
  preselectedProperty,
  allowedOperationType,
  useCRMForm = false,
  showConfirmation = true,
}: BookingPublicProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>(
    initialAvailableSlots
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  // Encontrar slots para la fecha seleccionada
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dayData = availableSlots.find((slot) => slot.date === selectedDate);
    return dayData?.slots || [];
  }, [selectedDate, availableSlots]);

  // Función helper para formatear fecha en hora local (sin conversión UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función helper para crear Date desde string YYYY-MM-DD en hora local
  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Función optimizada para refrescar disponibilidad
  const refreshAvailability = async () => {
    if (isRefreshing) return; // Evitar llamadas simultáneas

    setIsRefreshing(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/appointments/available?start=${startDate}&end=${endDateStr}`
      );
      if (response.ok) {
        const refreshedSlots = await response.json();
        setAvailableSlots(refreshedSlots);
      }
    } catch (error) {
      console.warn('Error al refrescar disponibilidad:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateSelect = async (date: Date) => {
    const dateStr = formatDateLocal(date);
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setCurrentStep(2);
    // Refrescar disponibilidad cuando se selecciona una fecha (solo si no está refrescando)
    if (!isRefreshing) {
      refreshAvailability();
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  const handleFormSubmit = async (data: any) => {
    console.log('📝 handleFormSubmit recibió:', data);

    if (isModal && useCRMForm) {
      // Para modal CRM: refrescar disponibilidad y cerrar
      await refreshAvailability();
      if (onSuccess) onSuccess();
      if (onClose) onClose();

      // Resetear estado
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      return;
    }

    // Para público: mostrar confirmación
    if (showConfirmation) {
      // Formatear la fecha para mostrarla de manera legible
      const formattedDate = data.date
        ? (() => {
            const date = new Date(data.date + 'T00:00:00');
            return date.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          })()
        : data.date;

      // Formatear la hora (remover segundos si existen)
      const formattedTime = data.time
        ? data.time.split(':').slice(0, 2).join(':')
        : data.time;

      const confirmationData = {
        date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
        time: formattedTime,
      };

      console.log('✅ Datos de confirmación formateados:', confirmationData);

      setAppointmentData(confirmationData);

      // Ir al paso 4 (Confirmación) para mostrar el mensaje de éxito
      console.log('🚀 Cambiando a paso 4');
      setCurrentStep(4);
    }

    // Refrescar disponibilidad DESPUÉS de 3 segundos (dar tiempo a la DB)
    setTimeout(async () => {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];

        const response = await fetch(
          `/api/appointments/available?start=${startDate}&end=${endDateStr}`
        );
        if (response.ok) {
          const refreshedSlots = await response.json();
          setAvailableSlots(refreshedSlots);
        }
      } catch (error) {
        // Silenciar errores
      } finally {
        setIsRefreshing(false);
      }
    }, 3000);
  };

  const handleBackToCalendar = async () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    // Refrescar disponibilidad cuando se vuelve al calendario (solo si no está refrescando)
    if (!isRefreshing) {
      refreshAvailability();
    }
  };

  const handleBackToTime = () => {
    setCurrentStep(2);
    setSelectedTime(null);
  };

  const handleNewAppointment = async () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setAppointmentData(null);
    // Refrescar disponibilidad después de crear una cita (solo si no está refrescando)
    if (!isRefreshing) {
      refreshAvailability();
    }
  };

  // Escuchar evento personalizado del botón de nueva cita (desde ConfirmationPanel)
  useEffect(() => {
    if (!showConfirmation) return;

    const handleNewAppointmentEvent = () => {
      handleNewAppointment();
    };

    window.addEventListener('new-appointment', handleNewAppointmentEvent);
    return () => {
      window.removeEventListener('new-appointment', handleNewAppointmentEvent);
    };
  }, [showConfirmation]);

  // Manejar el portal del modal
  useEffect(() => {
    if (!isModal) return;

    if (!isOpen) {
      const existingModal = document.getElementById(
        'booking-public-modal-root'
      );
      if (existingModal) {
        render(null, existingModal);
        existingModal.remove();
      }
      setModalRoot(null);
      // Resetear estado al cerrar
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      return;
    }

    let root = document.getElementById('booking-public-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'booking-public-modal-root';
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
  }, [isModal, isOpen]);

  // Renderizar contenido
  const renderContent = () => {
    const maxSteps = showConfirmation ? 4 : 3;
    const CalendarComponent = useCRMForm ? CalendarCRM : Calendar;
    const TimeSlotsComponent = useCRMForm ? TimeSlotsCRM : TimeSlots;

    return (
      <>
        {!isModal && <ProgressIndicator currentStep={currentStep} />}

        {isModal && (
          <div class="mb-8 max-w-2xl mx-auto">
            <div class="flex items-center justify-between relative">
              <div class="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
                <div
                  class="h-full bg-gray-900 transition-all duration-500 ease-out"
                  style={`width: ${
                    ((currentStep - 1) / (maxSteps - 1)) * 100
                  }%`}
                ></div>
              </div>

              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} class="flex flex-col items-center flex-1">
                  <div
                    class={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 ${
                      currentStep >= stepNum
                        ? 'bg-gray-900 text-white border-gray-900 scale-110'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {currentStep > stepNum ? (
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      stepNum.toString()
                    )}
                  </div>
                  <span
                    class={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                      currentStep >= stepNum ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {stepNum === 1
                      ? 'Fecha'
                      : stepNum === 2
                      ? 'Hora'
                      : 'Información'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          class={
            isModal
              ? ''
              : 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
          }
        >
          <div class={isModal ? '' : 'p-6 md:p-8 lg:p-10'}>
            {currentStep === 1 && (
              <CalendarComponent
                availableSlots={availableSlots}
                onDateSelect={handleDateSelect}
                selectedDate={
                  selectedDate ? parseDateLocal(selectedDate) : null
                }
              />
            )}

            {currentStep === 2 && (
              <>
                {successMessage && !isModal && (
                  <div class="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div class="flex items-center gap-3">
                      <svg
                        class="w-6 h-6 text-green-600 flex-shrink-0"
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
                      <div class="flex-1">
                        <p class="text-green-800 text-sm font-semibold">
                          {successMessage}
                        </p>
                        <p class="text-green-700 text-xs mt-1">
                          El horario seleccionado ahora aparece como ocupado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <TimeSlotsComponent
                  selectedDate={
                    selectedDate ? parseDateLocal(selectedDate) : null
                  }
                  selectedTime={selectedTime}
                  slots={slotsForSelectedDate}
                  onTimeSelect={handleTimeSelect}
                  onBack={handleBackToCalendar}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                {useCRMForm ? (
                  <AppointmentFormCRM
                    selectedDate={
                      selectedDate ? parseDateLocal(selectedDate) : null
                    }
                    selectedTime={selectedTime}
                    preselectedProperty={preselectedProperty}
                    allowedOperationType={allowedOperationType}
                    onBack={handleBackToTime}
                    onSubmit={handleFormSubmit}
                  />
                ) : (
                  <AppointmentForm
                    selectedDate={
                      selectedDate ? parseDateLocal(selectedDate) : null
                    }
                    selectedTime={selectedTime}
                    selectedProperty={selectedProperty}
                    onBack={handleBackToTime}
                    onSubmit={handleFormSubmit}
                  />
                )}
              </>
            )}

            {currentStep === 4 && showConfirmation && (
              <ConfirmationPanel appointmentData={appointmentData} />
            )}
          </div>
        </div>
      </>
    );
  };

  // Renderizar modal en portal
  useEffect(() => {
    if (!isModal || !modalRoot || !isOpen) {
      if (modalRoot) {
        render(null, modalRoot);
      }
      return;
    }

    const ModalContent = () => (
      <div
        class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && currentStep === 1) {
            if (onClose) onClose();
          }
        }}
      >
        <div
          class="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con botón cerrar */}
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <h2 class="text-xl font-semibold text-gray-900">
              Crear Nueva Cita
            </h2>
            <button
              onClick={onClose}
              class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-md"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Contenido con scroll */}
          <div class="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
            {renderContent()}
          </div>
        </div>
      </div>
    );

    render(<ModalContent />, modalRoot);

    return () => {
      if (modalRoot) {
        render(null, modalRoot);
      }
    };
  }, [
    isModal,
    modalRoot,
    isOpen,
    currentStep,
    selectedDate,
    selectedTime,
    availableSlots,
    slotsForSelectedDate,
  ]);

  // Si es modal, no renderizar nada directamente
  if (isModal) {
    return null;
  }

  // Renderizado normal (público)
  return renderContent();
}
