/** @jsxImportSource preact */
import { supabaseAuth } from '@/1-app-global-core/config';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface LogoutButtonProps {
  showChangeUser?: boolean;
  isCollapsed?: boolean;
}

export default function LogoutButton({
  showChangeUser = false,
  isCollapsed = false,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async (skipConfirm = false) => {
    if (!skipConfirm && !showChangeUser) {
      setShowConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabaseAuth.auth.signOut();

      // Limpiar tokens del localStorage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');

      // Si es "Cambiar de usuario", también limpiar el email guardado
      if (showChangeUser) {
        localStorage.removeItem('remembered_email');
      }

      if (error) {
        console.error('Error al cerrar sesión:', error);
        setIsLoading(false);
        return;
      }

      // Redirigir a login
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoading(false);
    }
  };

  const handleChangeUser = () => {
    handleLogout(true);
  };

  useEffect(() => {
    if (!showConfirm) {
      // Limpiar el modal si existe
      const existingModal = document.getElementById('logout-modal-root');
      if (existingModal) {
        existingModal.remove();
      }
      return;
    }

    // Crear contenedor para el modal directamente en el body
    const modalRoot = document.createElement('div');
    modalRoot.id = 'logout-modal-root';
    modalRoot.style.cssText =
      'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;';
    document.body.appendChild(modalRoot);

    // Renderizar el modal
    const ModalContent = () => (
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh;"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowConfirm(false);
          }
        }}
      >
        <div class="w-full max-w-md mx-4">
          <div class="bg-white rounded-xl border-2 border-gray-100 shadow-lg overflow-hidden">
            {/* Header */}
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">
                    Confirmar cierre de sesión
                  </h3>
                  <p class="text-xs text-gray-600">
                    Esta acción cerrará tu sesión actual
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div class="px-6 py-5">
              <p class="text-sm text-gray-600 mb-6">
                ¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar
                sesión nuevamente para acceder al sistema.
              </p>

              {/* Buttons */}
              <div class="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-150 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleLogout(true)}
                  disabled={isLoading}
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-150 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        class="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Cerrando...
                    </>
                  ) : (
                    <>
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Cerrar sesión
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    render(<ModalContent />, modalRoot);

    return () => {
      // Limpiar el modal al desmontar o cuando showConfirm cambie
      if (modalRoot.parentNode) {
        render(null, modalRoot);
        modalRoot.remove();
      }
    };
  }, [showConfirm, isLoading]);

  return (
    <>
      {showChangeUser ? (
        <button
          onClick={handleChangeUser}
          disabled={isLoading}
          class={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-gray-500 hover:bg-gray-50 shadow-md hover:shadow-lg disabled:opacity-50 ${
            isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'text-left'
          }`}
          title={isCollapsed ? 'Cambiar de usuario' : ''}
        >
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7h8m-8 0a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2m-6 0V5a2 2 0 012-2h4a2 2 0 012 2v2"
            />
          </svg>
          {!isCollapsed && (
            <span class="text-xs whitespace-nowrap font-normal">
              {isLoading ? 'Cambiando...' : 'Cambiar de usuario'}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          class={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-gray-500 hover:bg-gray-50 shadow-md hover:shadow-lg disabled:opacity-50 ${
            isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'text-left'
          }`}
          title={isCollapsed ? 'Cerrar sesión' : ''}
        >
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && (
            <span class="text-xs whitespace-nowrap font-normal">
              {isLoading ? 'Cerrando...' : 'Cerrar sesión'}
            </span>
          )}
        </button>
      )}
    </>
  );
}
