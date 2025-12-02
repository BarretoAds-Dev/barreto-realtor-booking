/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';

export interface ToastProps {
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  link?: string;
}

export function Toast({
  message,
  description,
  type = 'success',
  duration = 5000,
  onClose,
  link,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      text: 'text-green-900',
      desc: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      text: 'text-red-900',
      desc: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      text: 'text-blue-900',
      desc: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      text: 'text-amber-900',
      desc: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
  };

  const styles = typeStyles[type];

  const icons = {
    success: (
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
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
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
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
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  };

  return (
    <div
      class={`
        w-full
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
        ${styles.bg} ${styles.border}
        rounded-2xl shadow-2xl border-2
        backdrop-blur-sm
      `}
      style="animation: slideInRight 0.3s ease-out;"
    >
      <div class="p-5">
        <div class="flex items-start gap-4">
          {/* Icono */}
          <div
            class={`${styles.iconBg} ${styles.iconColor} rounded-xl p-3 flex-shrink-0 shadow-md ring-2 ring-white/50`}
          >
            {icons[type]}
          </div>

          {/* Contenido */}
          <div class="flex-1 min-w-0">
            <h3 class={`${styles.text} font-semibold text-base mb-1`}>
              {message}
            </h3>
            {description && (
              <p class={`${styles.desc} text-sm leading-relaxed mb-3`}>
                {description}
              </p>
            )}
            {link && (
              <div class="mb-3">
                <div class="group flex items-center gap-2 bg-white/70 hover:bg-white/90 rounded-lg p-2.5 border border-gray-200/80 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    // Mostrar feedback visual
                    const el = document.querySelector(`[data-link="${link}"]`);
                    if (el) {
                      el.classList.add('animate-pulse');
                      setTimeout(() => el.classList.remove('animate-pulse'), 500);
                    }
                  }}
                  title="Click para copiar"
                >
                  <svg
                    class="w-4 h-4 text-gray-500 flex-shrink-0 group-hover:text-gray-700 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <p class="text-xs text-gray-700 truncate font-mono flex-1 select-all" data-link={link}>
                    {link}
                  </p>
                  <svg
                    class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div class="flex items-center gap-2 mt-3">
              {link && (
                <button
                  onClick={() => {
                    window.open(link, '_blank');
                  }}
                  class={`
                    ${styles.button} text-white text-xs font-semibold
                    px-4 py-2 rounded-lg transition-all duration-200
                    shadow-sm hover:shadow-md hover:scale-105
                    flex items-center gap-1.5
                    active:scale-95
                  `}
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Abrir enlace
                </button>
              )}
              <button
                onClick={handleClose}
                class={`
                  ${styles.button} text-white text-xs font-semibold
                  px-4 py-2 rounded-lg transition-all duration-200
                  shadow-sm hover:shadow-md hover:scale-105
                  active:scale-95
                `}
              >
                Aceptar
              </button>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            class={`
              ${styles.iconColor} hover:${styles.iconBg}
              rounded-lg p-1 transition-colors duration-200
              flex-shrink-0
            `}
            aria-label="Cerrar"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      {duration > 0 && (
        <div class="h-1 bg-white/30 rounded-b-2xl overflow-hidden">
          <div
            class={`h-full ${styles.button} transition-all ease-linear`}
            style={`animation: shrink ${duration}ms linear forwards;`}
          />
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

