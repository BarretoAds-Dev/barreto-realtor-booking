/** @jsxImportSource preact */
import { useEffect } from 'preact/hooks';

interface ConfirmationPanelProps {
  appointmentData: {
    date: string;
    time: string;
  } | null;
}

export default function ConfirmationPanel({ appointmentData }: ConfirmationPanelProps) {
  useEffect(() => {
    console.log('🎯 ConfirmationPanel montado con datos:', appointmentData);

    // Handler para el botón de nueva cita
    const handleNewAppointmentClick = () => {
      window.dispatchEvent(new CustomEvent('new-appointment'));
    };

    const button = document.getElementById('new-appointment-btn');
    if (button) {
      button.addEventListener('click', handleNewAppointmentClick);
      return () => {
        button.removeEventListener('click', handleNewAppointmentClick);
      };
    }
  }, [appointmentData]);

  console.log('🔍 ConfirmationPanel renderizando con:', appointmentData);

  if (!appointmentData || !appointmentData.date || !appointmentData.time) {
    console.warn('⚠️ ConfirmationPanel: appointmentData inválido', appointmentData);
    return (
      <div class="max-w-md mx-auto text-center">
        <p class="text-gray-500">Cargando confirmación...</p>
      </div>
    );
  }

  return (
    <div class="max-w-md mx-auto text-center transition-all duration-500">
      <div class="mb-8">
        <div class="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-3">¡Cita confirmada!</h2>
        <p class="text-gray-500 mb-8">
          Tu cita ha sido programada exitosamente. Recibirás un correo de confirmación en breve con todos los detalles.
        </p>

        <div class="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <div class="flex items-center justify-center gap-3 mb-4">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fecha y hora</p>
          </div>
          <p class="text-xl font-bold text-gray-900">{appointmentData.date} a las {appointmentData.time}</p>
        </div>

        <button
          id="new-appointment-btn"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Reservar otra cita
        </button>
      </div>
    </div>
  );
}

