/**
 * Servicio de Seguridad (Security Service)
 *
 * Unifica la validación de contraseñas (HIBP) y el almacenamiento seguro (Storage)
 * en un solo servicio cohesivo para simplificar el código y mejorar el mantenimiento.
 *
 * @example
 * ```ts
 * import { SecurityService } from '@/1-app-global-core/services';
 *
 * // Validar contraseña
 * const { valid } = await SecurityService.validatePassword(password);
 *
 * // Subir avatar
 * const { url } = await SecurityService.uploadAvatar(file, userId);
 * ```
 */

import { supabaseAuth } from '../config';

// ============================================================================
// Password Validation (HIBP)
// ============================================================================

const MIN_PASSWORD_LENGTH = 8; // Ajustar a 12+ para política más estricta

/**
 * Convierte un ArrayBuffer a string hexadecimal
 */
function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calcula el hash SHA-1 de un string y lo retorna en hexadecimal
 */
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return toHex(hashBuffer).toUpperCase();
}

/**
 * Verifica si una contraseña ha sido comprometida usando HIBP k-Anonymity API
 *
 * @param password - La contraseña a verificar
 * @returns true si la contraseña está comprometida, false si es segura
 * @throws Error si el servicio HIBP no está disponible
 */
async function isPasswordPwned(password: string): Promise<boolean> {
  // k-Anonymity: enviamos solo los primeros 5 caracteres del SHA-1
  // y comparamos los sufijos localmente
  const sha1 = await sha1Hex(password);
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const hibpUrl = `https://api.pwnedpasswords.com/range/${prefix}`;

  try {
    const res = await fetch(hibpUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'inmocrm-hibp-check/1.0',
      },
    });

    if (!res.ok) {
      // En caso de fallo del servicio upstream, fall-safe:
      // tratar como potencialmente comprometida para evitar crear cuentas con seguridad desconocida
      console.error('❌ HIBP lookup failed:', res.status, res.statusText);
      throw new Error('HIBP service unavailable');
    }

    const text = await res.text();
    // La respuesta es líneas de: Suffix:Count
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const [remoteSuffix] = line.split(':');
      if (!remoteSuffix) continue;

      // Comparar sufijos (case-insensitive)
      if (remoteSuffix.trim().toUpperCase() === suffix) {
        return true; // Contraseña comprometida
      }
    }

    return false; // Contraseña segura
  } catch (error) {
    console.error('❌ Error en verificación HIBP:', error);
    throw error;
  }
}

/**
 * Valida la longitud mínima de una contraseña
 */
function validatePasswordLength(password: string): {
  valid: boolean;
  error?: string;
} {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    };
  }
  return { valid: true };
}

/**
 * Valida una contraseña completa (longitud + HIBP)
 *
 * @param password - La contraseña a validar
 * @returns Objeto con resultado de validación
 */
async function validatePassword(password: string): Promise<{
  valid: boolean;
  error?: string;
  pwned?: boolean;
}> {
  // Validar longitud primero
  const lengthValidation = validatePasswordLength(password);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }

  // Verificar contra HIBP
  try {
    const pwned = await isPasswordPwned(password);
    if (pwned) {
      return {
        valid: false,
        error:
          'Esta contraseña ha aparecido en una filtración de datos conocida. Por favor, elige una contraseña diferente.',
        pwned: true,
      };
    }

    return { valid: true };
  } catch (error) {
    // Si HIBP no está disponible, retornar error de servicio
    return {
      valid: false,
      error:
        'No se pudo validar la seguridad de la contraseña. Por favor, intenta nuevamente más tarde.',
    };
  }
}

// ============================================================================
// Storage Management
// ============================================================================

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UploadResult {
  success: boolean;
  url: string | null;
  error: string | null;
}

/**
 * Sube una imagen de perfil a Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario
 * @returns Resultado de la subida con URL pública o error
 */
async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        url: null,
        error:
          'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.',
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        url: null,
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
      };
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabaseAuth.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Reemplazar si ya existe
      });

    if (error) {
      console.error('Error al subir imagen:', error);
      return {
        success: false,
        url: null,
        error: error.message || 'Error al subir la imagen',
      };
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAuth.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        url: null,
        error: 'No se pudo obtener la URL pública de la imagen',
      };
    }

    return {
      success: true,
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Error inesperado al subir avatar:', error);
    return {
      success: false,
      url: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al subir la imagen',
    };
  }
}

/**
 * Elimina una imagen de perfil de Supabase Storage
 * @param filePath - URL pública o ruta del archivo a eliminar
 * @returns Resultado de la eliminación
 */
async function deleteAvatar(
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Extraer la ruta relativa del path completo
    // La URL pública de Supabase tiene el formato:
    // https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/[filename]
    let relativePath: string;

    if (filePath.includes('/storage/v1/object/public/')) {
      // Es una URL pública completa
      const urlParts = filePath.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        relativePath = urlParts[1];
      } else {
        return {
          success: false,
          error: 'Formato de URL inválido',
        };
      }
    } else if (filePath.includes(`${AVATAR_BUCKET}/`)) {
      // Ya es una ruta relativa que incluye el bucket
      relativePath = filePath.split(`${AVATAR_BUCKET}/`)[1];
    } else {
      // Asumir que es una ruta relativa directa
      relativePath = filePath;
    }

    const { error } = await supabaseAuth.storage
      .from(AVATAR_BUCKET)
      .remove([relativePath]);

    if (error) {
      console.error('Error al eliminar imagen:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar la imagen',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Error inesperado al eliminar avatar:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al eliminar la imagen',
    };
  }
}

// ============================================================================
// Public API - SecurityService
// ============================================================================

/**
 * Servicio unificado de seguridad
 * Combina funcionalidades de validación de contraseñas y almacenamiento seguro
 */
export const SecurityService = {
  // Password Validation
  validatePassword,
  validatePasswordLength,
  isPasswordPwned,

  // Storage Management
  uploadAvatar,
  deleteAvatar,
} as const;

// ============================================================================
// Legacy Exports (para compatibilidad)
// ============================================================================

/**
 * @deprecated Usar SecurityService.validatePassword en su lugar
 * Mantenido para compatibilidad hacia atrás
 */
export { validatePassword };

/**
 * @deprecated Usar SecurityService.uploadAvatar en su lugar
 * Mantenido para compatibilidad hacia atrás
 */
export { deleteAvatar, uploadAvatar };
