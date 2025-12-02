import { supabaseAuth } from '../config';

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
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
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
export async function deleteAvatar(
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
