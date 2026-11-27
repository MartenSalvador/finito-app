import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase/config';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('La imagen supera el límite de 5 MB.');
  }

  const safeFolder = folder === 'users' ? 'users' : 'puzzles';
  const cleanName = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${safeFolder}/${user.uid}/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}