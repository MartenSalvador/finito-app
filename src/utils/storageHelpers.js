import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase/config';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

async function compressImageFile(file) {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Este navegador no permite reducir la imagen automáticamente.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No pudimos procesar la imagen.');
    }

    let scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    let quality = 0.86;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('No pudimos procesar la imagen.'));
            }
          },
          'image/jpeg',
          quality
        );
      });

      if (blob.size <= MAX_FILE_SIZE_BYTES) {
        const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
        return new File([blob], `${baseName}.jpg`, {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
      }

      if (quality > 0.5) {
        quality -= 0.12;
      } else {
        scale *= 0.8;
        quality = 0.82;
      }
    }
  } finally {
    bitmap.close?.();
  }

  throw new Error('No pudimos reducir la imagen al límite de 5 MB.');
}

export async function uploadImageFile(file, folder = 'puzzles') {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Tenés que iniciar sesión para subir imágenes.');
  }
  if (!file) {
    throw new Error('No se seleccionó ningún archivo.');
  }
  if (!file.type?.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.');
  }
  const safeFolder = ['users', 'completedPuzzles'].includes(folder)
    ? folder
    : 'puzzles';
  let uploadFile = file;
  if (file.size > MAX_FILE_SIZE_BYTES && safeFolder === 'completedPuzzles') {
    uploadFile = await compressImageFile(file);
  }
  if (uploadFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('La imagen supera el límite de 5 MB.');
  }

  const cleanName = (uploadFile.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${safeFolder}/${user.uid}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, uploadFile, { contentType: uploadFile.type });
  return getDownloadURL(storageRef);
}