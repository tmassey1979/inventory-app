import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTOS_DIR = `${FileSystem.documentDirectory}inventory_photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

async function optimizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

export async function saveInventoryPhoto(
  sourceUri: string,
  inventoryNumber: number
): Promise<string> {
  await ensurePhotosDir();
  const optimizedUri = await optimizeImage(sourceUri);
  const filename = `inv_${inventoryNumber.toString().padStart(4, '0')}_${Date.now()}.jpg`;
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: optimizedUri, to: destUri });
  if (optimizedUri !== sourceUri && optimizedUri !== destUri) {
    try {
      await FileSystem.deleteAsync(optimizedUri, { idempotent: true });
    } catch {
      // ignore
    }
  }
  return destUri;
}

export async function replaceInventoryPhoto(
  sourceUri: string,
  inventoryNumber: number,
  oldPhotoUri: string | null
): Promise<string> {
  const newUri = await saveInventoryPhoto(sourceUri, inventoryNumber);
  if (oldPhotoUri && oldPhotoUri !== newUri) {
    try {
      await deleteInventoryPhoto(oldPhotoUri);
    } catch (e) {
      console.warn('Failed to delete old photo after replace:', e);
    }
  }
  return newUri;
}

export async function deleteInventoryPhoto(photoUri: string): Promise<void> {
  if (!photoUri) return;
  try {
    const info = await FileSystem.getInfoAsync(photoUri);
    if (info.exists) {
      await FileSystem.deleteAsync(photoUri, { idempotent: true });
    }
  } catch (e) {
    console.warn('deleteInventoryPhoto error (ignored):', e);
  }
}

export async function photoExists(photoUri: string | null): Promise<boolean> {
  if (!photoUri) return false;
  try {
    const info = await FileSystem.getInfoAsync(photoUri);
    return info.exists;
  } catch {
    return false;
  }
}
