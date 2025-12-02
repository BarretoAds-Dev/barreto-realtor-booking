/** @jsxImportSource preact */
import { supabaseAuth } from '@/1-app-global-core/config';
import { deleteAvatar, uploadAvatar } from '@/1-app-global-core/services';
import { Button } from '@/components';
import { useEffect, useRef, useState } from 'preact/hooks';

interface AdminSettingsProps {
  // Props si es necesario
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function AdminSettings({}: AdminSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Estados para el formulario de perfil
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
  });

  // Estados para la imagen de perfil
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  // Estados para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState({
    profile: false,
    password: false,
    businessHours: false,
    slots: false,
    general: false,
  });

  // Estados para las configuraciones del sistema
  const [businessHours, setBusinessHours] = useState({
    monday: { open: '09:00', close: '18:00', enabled: true },
    tuesday: { open: '09:00', close: '18:00', enabled: true },
    wednesday: { open: '09:00', close: '18:00', enabled: true },
    thursday: { open: '09:00', close: '18:00', enabled: true },
    friday: { open: '09:00', close: '18:00', enabled: true },
    saturday: { open: '09:00', close: '14:00', enabled: true },
    sunday: { open: '', close: '', enabled: false },
  });

  const [slotSettings, setSlotSettings] = useState({
    slotDuration: 30,
    bufferTime: 0,
  });

  const [generalSettings, setGeneralSettings] = useState({
    appointmentAdvanceHours: 24,
    maxAppointmentsPerSlot: 1,
  });

  // Cargar perfil del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const {
          data: { user },
          error,
        } = await supabaseAuth.auth.getUser();

        if (error) throw error;

        if (user) {
          const avatarUrl = user.user_metadata?.avatar_url || null;
          const profile: UserProfile = {
            id: user.id,
            email: user.email || '',
            full_name:
              user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: avatarUrl,
          };

          setUserProfile(profile);
          setProfileForm({
            full_name: profile.full_name || '',
            email: profile.email,
            avatar_url: avatarUrl || '',
          });
          setAvatarPreview(avatarUrl);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        setSaveMessage({
          type: 'error',
          text: 'Error al cargar la información del usuario',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  // Guardar perfil del usuario
  const handleSaveProfile = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const {
        data: { user },
        error: getUserError,
      } = await supabaseAuth.auth.getUser();
      if (getUserError) throw getUserError;
      if (!user) throw new Error('Usuario no encontrado');

      // Actualizar email si cambió
      if (profileForm.email !== user.email) {
        const { error: emailError } = await supabaseAuth.auth.updateUser({
          email: profileForm.email,
        });
        if (emailError) throw emailError;
      }

      // Actualizar metadata (nombre y avatar)
      const updateData: Record<string, unknown> = {
        full_name: profileForm.full_name,
        name: profileForm.full_name,
      };

      if (profileForm.avatar_url) {
        updateData.avatar_url = profileForm.avatar_url;
      }

      const { error: metadataError } = await supabaseAuth.auth.updateUser({
        data: updateData,
      });
      if (metadataError) throw metadataError;

      setSaveMessage({
        type: 'success',
        text: 'Perfil actualizado exitosamente',
      });
      setTimeout(() => setSaveMessage(null), 3000);

      // Recargar perfil
      const {
        data: { user: updatedUser },
      } = await supabaseAuth.auth.getUser();
      if (updatedUser) {
        const avatarUrl = updatedUser.user_metadata?.avatar_url || null;
        setUserProfile({
          id: updatedUser.id,
          email: updatedUser.email || '',
          full_name:
            updatedUser.user_metadata?.full_name ||
            updatedUser.user_metadata?.name ||
            null,
          avatar_url: avatarUrl,
        });
        setAvatarPreview(avatarUrl);
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || 'Error al actualizar el perfil',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    setPasswordErrors({});
    setIsLoading(true);
    setSaveMessage(null);

    // Validaciones
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordErrors({
        newPassword: 'La contraseña debe tener al menos 6 caracteres',
      });
      setIsLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      setIsLoading(false);
      return;
    }

    try {
      // Actualizar contraseña
      const { error } = await supabaseAuth.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setSaveMessage({
        type: 'success',
        text: 'Contraseña actualizada exitosamente',
      });
      setTimeout(() => setSaveMessage(null), 3000);

      // Limpiar formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || 'Error al cambiar la contraseña',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      // Aquí iría la lógica para guardar configuraciones del sistema en Supabase
      // Por ahora simulamos el guardado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveMessage({
        type: 'success',
        text: 'Configuración guardada exitosamente',
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Error al guardar la configuración',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDayHours = (
    day: string,
    field: 'open' | 'close' | 'enabled',
    value: string | boolean
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  // Obtener iniciales del usuario
  const getUserInitials = (): string => {
    if (!userProfile?.full_name) {
      return userProfile?.email?.charAt(0).toUpperCase() || 'U';
    }
    const names = userProfile.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (
        names[0].charAt(0) + names[names.length - 1].charAt(0)
      ).toUpperCase();
    }
    return userProfile.full_name.charAt(0).toUpperCase();
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSaveMessage({
        type: 'error',
        text: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.',
      });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        text: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
      });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Manejar subida de avatar
  const handleAvatarUpload = async () => {
    const fileInput = fileInputRef.current;
    const file = fileInput?.files?.[0];

    if (!file) {
      setSaveMessage({
        type: 'error',
        text: 'Por favor selecciona una imagen',
      });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    if (!userProfile) {
      setSaveMessage({
        type: 'error',
        text: 'Usuario no encontrado',
      });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }

    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      // Eliminar avatar anterior si existe
      if (userProfile.avatar_url) {
        await deleteAvatar(userProfile.avatar_url);
      }

      // Subir nuevo avatar
      const result = await uploadAvatar(file, userProfile.id);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Error al subir la imagen');
      }

      // Actualizar perfil con nueva URL
      setProfileForm({
        ...profileForm,
        avatar_url: result.url,
      });

      // Guardar en metadata del usuario
      const { error: updateError } = await supabaseAuth.auth.updateUser({
        data: {
          avatar_url: result.url,
        },
      });

      if (updateError) throw updateError;

      setSaveMessage({
        type: 'success',
        text: 'Imagen de perfil actualizada exitosamente',
      });
      setTimeout(() => setSaveMessage(null), 3000);

      // Actualizar estado del perfil
      setUserProfile({
        ...userProfile,
        avatar_url: result.url,
      });
    } catch (error) {
      console.error('Error al subir avatar:', error);
      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error al subir la imagen de perfil',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
      // Limpiar input
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Manejar eliminación de avatar
  const handleAvatarRemove = async () => {
    if (!userProfile?.avatar_url) return;

    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      await deleteAvatar(userProfile.avatar_url);

      // Actualizar perfil
      const { error: updateError } = await supabaseAuth.auth.updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (updateError) throw updateError;

      setProfileForm({
        ...profileForm,
        avatar_url: '',
      });
      setAvatarPreview(null);

      setUserProfile({
        ...userProfile,
        avatar_url: null,
      });

      setSaveMessage({
        type: 'success',
        text: 'Imagen de perfil eliminada exitosamente',
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error al eliminar avatar:', error);
      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Error al eliminar la imagen de perfil',
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  if (isLoadingProfile) {
    return (
      <div class="w-full lg:max-w-7xl lg:mx-auto flex items-center justify-center py-12">
        <div class="text-center">
          <svg
            class="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4"
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
          <p class="text-gray-500 text-sm">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="w-full lg:max-w-7xl lg:mx-auto">
      {/* Header */}
      <div class="mb-4 sm:mb-5 md:mb-6">
        <h1 class="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-1.5">
          Configuración del Sistema
        </h1>
        <p class="text-gray-500 text-xs sm:text-sm md:text-base">
          Administra tu perfil y los ajustes generales del sistema.
        </p>
      </div>

      {/* Mensaje de guardado */}
      {saveMessage && (
        <div
          class={`mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 rounded-lg border-l-4 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-400 text-green-700'
              : 'bg-red-50 border-red-400 text-red-700'
          }`}
        >
          <div class="flex items-center">
            <svg
              class={`w-5 h-5 mr-2 ${
                saveMessage.type === 'success'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {saveMessage.type === 'success' ? (
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <p class="text-sm sm:text-base">{saveMessage.text}</p>
          </div>
        </div>
      )}

      <div class="space-y-4 sm:space-y-5 md:space-y-6">
        {/* Sección: Información del Perfil */}
        <div class="bg-white rounded-xl border-2 border-indigo-100 shadow-sm">
          <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-indigo-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-white"
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
                  </svg>
                </div>
                <div class="flex-1">
                  <h2 class="text-base sm:text-lg font-bold text-indigo-900">
                    Información del Perfil
                  </h2>
                  <p class="text-xs sm:text-sm text-indigo-700">
                    Actualiza tu información personal
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setExpandedSections({
                    ...expandedSections,
                    profile: !expandedSections.profile,
                  })
                }
                class="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={expandedSections.profile ? 'Contraer' : 'Expandir'}
              >
                <svg
                  class={`w-5 h-5 transition-transform duration-200 ${
                    expandedSections.profile ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {expandedSections.profile && (
            <div class="p-4 sm:p-5 md:p-6">
              <div class="space-y-4">
                {/* Avatar Upload Section - Estilo mejorado tipo card */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    Foto de Perfil
                  </label>

                  {/* Profile Card */}
                  <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 sm:p-6 border-2 border-indigo-200 shadow-sm">
                    <div class="flex items-start gap-4 sm:gap-6">
                      {/* Avatar con botón Preview superpuesto */}
                      <div class="flex-shrink-0 relative">
                        <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-indigo-500 border-4 border-white shadow-lg">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              class="w-full h-full object-cover"
                            />
                          ) : (
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600">
                              <span class="text-2xl sm:text-3xl font-bold text-white">
                                {getUserInitials()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Botón Preview superpuesto */}
                        {avatarPreview && avatarPreview.includes('data:') && (
                          <button
                            onClick={() => {
                              // Abrir preview en modal o nueva ventana
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`
																	<html>
																		<head><title>Preview</title></head>
																		<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a1a;">
																			<img src="${avatarPreview}" style="max-width:90vw;max-height:90vh;border-radius:8px;" />
																		</body>
																	</html>
																`);
                              }
                            }}
                            class="absolute bottom-0 left-0 bg-gray-800/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-tl-lg rounded-br-lg hover:bg-gray-900/90 transition-all duration-150 shadow-md border border-gray-700/50"
                            title="Ver preview completo"
                          >
                            Preview
                          </button>
                        )}
                      </div>

                      {/* Información del usuario */}
                      <div class="flex-1 min-w-0">
                        <div class="mb-1">
                          <h3 class="text-base sm:text-lg font-bold text-gray-900 truncate">
                            {userProfile?.full_name || 'Usuario'}
                          </h3>
                        </div>
                        <div class="mb-4">
                          <p class="text-sm text-indigo-600 font-medium">
                            {userProfile?.email || 'Sin email'}
                          </p>
                        </div>

                        {/* Controles de upload */}
                        <div class="flex flex-col sm:flex-row gap-2 flex-wrap">
                          <label class="cursor-pointer inline-flex">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleFileSelect}
                              class="hidden"
                            />
                            <span class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-all duration-150 shadow-sm hover:shadow">
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                              </svg>
                              Cambiar Foto
                            </span>
                          </label>

                          {avatarPreview && avatarPreview.includes('data:') && (
                            <>
                              <Button
                                onClick={handleAvatarUpload}
                                disabled={isUploadingAvatar}
                                loading={isUploadingAvatar}
                                variant="primary"
                                size="sm"
                                uppercase={false}
                                className="gap-2 font-normal"
                              >
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Guardar
                              </Button>

                              <Button
                                onClick={() => {
                                  setAvatarPreview(
                                    userProfile?.avatar_url || null
                                  );
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                uppercase={false}
                                className="gap-2 font-normal"
                              >
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                Cancelar
                              </Button>
                            </>
                          )}

                          {userProfile?.avatar_url &&
                            !avatarPreview?.includes('data:') && (
                              <Button
                                onClick={handleAvatarRemove}
                                disabled={isUploadingAvatar}
                                variant="danger"
                                size="sm"
                                uppercase={false}
                                className="gap-2 font-normal"
                              >
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Eliminar
                              </Button>
                            )}
                        </div>

                        <p class="mt-2 text-xs text-gray-600">
                          Formatos permitidos: JPEG, PNG, WebP. Tamaño máximo:
                          5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name: (e.target as HTMLInputElement).value,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        email: (e.target as HTMLInputElement).value,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="tu@email.com"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Si cambias tu email, recibirás un correo de confirmación en
                    la nueva dirección.
                  </p>
                </div>
                <div class="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    loading={isLoading}
                    variant="primary"
                    size="sm"
                    uppercase={false}
                    className="gap-2 font-normal"
                  >
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección: Cambio de Contraseña */}
        <div class="bg-white rounded-xl border-2 border-amber-100 shadow-sm">
          <div class="bg-gradient-to-r from-amber-50 to-amber-100 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-amber-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h2 class="text-base sm:text-lg font-bold text-amber-900">
                    Seguridad
                  </h2>
                  <p class="text-xs sm:text-sm text-amber-700">
                    Cambia tu contraseña
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setExpandedSections({
                    ...expandedSections,
                    password: !expandedSections.password,
                  })
                }
                class="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={expandedSections.password ? 'Contraer' : 'Expandir'}
              >
                <svg
                  class={`w-5 h-5 transition-transform duration-200 ${
                    expandedSections.password ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {expandedSections.password && (
            <div class="p-4 sm:p-5 md:p-6">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                class="mb-4 px-3 py-1.5 text-xs font-medium text-amber-700 bg-white hover:bg-amber-50 border border-amber-300 rounded-md transition-all duration-150"
              >
                {showPasswordForm
                  ? 'Ocultar Formulario'
                  : 'Mostrar Formulario de Contraseña'}
              </button>
              {showPasswordForm && (
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: (e.target as HTMLInputElement).value,
                        });
                        setPasswordErrors({
                          ...passwordErrors,
                          newPassword: '',
                        });
                      }}
                      class={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        passwordErrors.newPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {passwordErrors.newPassword && (
                      <p class="mt-1 text-xs text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: (e.target as HTMLInputElement).value,
                        });
                        setPasswordErrors({
                          ...passwordErrors,
                          confirmPassword: '',
                        });
                      }}
                      class={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        passwordErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                      }`}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    {passwordErrors.confirmPassword && (
                      <p class="mt-1 text-xs text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div class="flex justify-end pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      loading={isLoading}
                      variant="primary"
                      size="sm"
                      uppercase={false}
                      className="gap-2 font-normal"
                    >
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Actualizar Contraseña
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección: Horarios de Negocio */}
        <div class="bg-white rounded-xl border-2 border-blue-100 shadow-sm">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-blue-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h2 class="text-base sm:text-lg font-bold text-blue-900">
                    Horarios de Negocio
                  </h2>
                  <p class="text-xs sm:text-sm text-blue-700">
                    Define los horarios disponibles para citas
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setExpandedSections({
                    ...expandedSections,
                    businessHours: !expandedSections.businessHours,
                  })
                }
                class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={
                  expandedSections.businessHours ? 'Contraer' : 'Expandir'
                }
              >
                <svg
                  class={`w-5 h-5 transition-transform duration-200 ${
                    expandedSections.businessHours ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {expandedSections.businessHours && (
            <div class="p-4 sm:p-5 md:p-6">
              <div class="space-y-3 sm:space-y-4">
                {days.map((day) => {
                  const dayData =
                    businessHours[day.key as keyof typeof businessHours];
                  return (
                    <div
                      key={day.key}
                      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div class="flex items-center gap-2 sm:w-32 flex-shrink-0">
                        <input
                          type="checkbox"
                          id={`day-${day.key}`}
                          checked={dayData.enabled}
                          onChange={(e) =>
                            updateDayHours(
                              day.key,
                              'enabled',
                              (e.target as HTMLInputElement).checked
                            )
                          }
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          for={`day-${day.key}`}
                          class="text-sm sm:text-base font-medium text-gray-700 cursor-pointer"
                        >
                          {day.label}
                        </label>
                      </div>
                      {dayData.enabled && (
                        <div class="flex items-center gap-2 sm:gap-3 flex-1">
                          <div class="flex-1">
                            <label class="block text-xs text-gray-600 mb-1">
                              Apertura
                            </label>
                            <input
                              type="time"
                              value={dayData.open}
                              onChange={(e) =>
                                updateDayHours(
                                  day.key,
                                  'open',
                                  (e.target as HTMLInputElement).value
                                )
                              }
                              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div class="flex-1">
                            <label class="block text-xs text-gray-600 mb-1">
                              Cierre
                            </label>
                            <input
                              type="time"
                              value={dayData.close}
                              onChange={(e) =>
                                updateDayHours(
                                  day.key,
                                  'close',
                                  (e.target as HTMLInputElement).value
                                )
                              }
                              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sección: Configuración de Slots */}
        <div class="bg-white rounded-xl border-2 border-green-100 shadow-sm">
          <div class="bg-gradient-to-r from-green-50 to-green-100 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-green-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h2 class="text-base sm:text-lg font-bold text-green-900">
                    Configuración de Slots
                  </h2>
                  <p class="text-xs sm:text-sm text-green-700">
                    Ajusta la duración y tiempo entre citas
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setExpandedSections({
                    ...expandedSections,
                    slots: !expandedSections.slots,
                  })
                }
                class="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={expandedSections.slots ? 'Contraer' : 'Expandir'}
              >
                <svg
                  class={`w-5 h-5 transition-transform duration-200 ${
                    expandedSections.slots ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {expandedSections.slots && (
            <div class="p-4 sm:p-5 md:p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Duración del Slot (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={slotSettings.slotDuration}
                    onChange={(e) =>
                      setSlotSettings({
                        ...slotSettings,
                        slotDuration:
                          parseInt((e.target as HTMLInputElement).value) || 30,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Mínimo: 15 min, Máximo: 120 min
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Buffer (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={slotSettings.bufferTime}
                    onChange={(e) =>
                      setSlotSettings({
                        ...slotSettings,
                        bufferTime:
                          parseInt((e.target as HTMLInputElement).value) || 0,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p class="mt-1 text-xs text-gray-500">Tiempo entre citas</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección: Configuración General */}
        <div class="bg-white rounded-xl border-2 border-purple-100 shadow-sm">
          <div class="bg-gradient-to-r from-purple-50 to-purple-100 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-purple-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h2 class="text-base sm:text-lg font-bold text-purple-900">
                    Configuración General
                  </h2>
                  <p class="text-xs sm:text-sm text-purple-700">
                    Ajustes generales del sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setExpandedSections({
                    ...expandedSections,
                    general: !expandedSections.general,
                  })
                }
                class="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-md transition-all duration-150 flex-shrink-0"
                aria-label={expandedSections.general ? 'Contraer' : 'Expandir'}
              >
                <svg
                  class={`w-5 h-5 transition-transform duration-200 ${
                    expandedSections.general ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          {expandedSections.general && (
            <div class="p-4 sm:p-5 md:p-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación Mínima (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={generalSettings.appointmentAdvanceHours}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        appointmentAdvanceHours:
                          parseInt((e.target as HTMLInputElement).value) || 24,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Tiempo mínimo para agendar una cita
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Citas por Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={generalSettings.maxAppointmentsPerSlot}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        maxAppointmentsPerSlot:
                          parseInt((e.target as HTMLInputElement).value) || 1,
                      })
                    }
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p class="mt-1 text-xs text-gray-500">
                    Cantidad máxima de citas simultáneas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Guardar Configuración del Sistema */}
        {(expandedSections.businessHours ||
          expandedSections.slots ||
          expandedSections.general) && (
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="md"
              uppercase={false}
              className="gap-2 font-normal"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5"
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
              Guardar Configuración
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
