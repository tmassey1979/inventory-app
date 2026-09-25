import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTOS_DIR = `${FileSystem.documentDirectory}inventory_photos/`;
const LABELS_DIR = `${FileSystem.documentDirectory}shipping_labels/`;

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
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
  await ensureDir(PHOTOS_DIR);
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

export async function saveShippingLabel(
  sourceUri: string,
  inventoryNumber: number
): Promise<string> {
  await ensureDir(LABELS_DIR);
  const filename = `label_${inventoryNumber.toString().padStart(4, '0')}_${Date.now()}.jpg`;
  const destUri = `${LABELS_DIR}${filename}`;
  try {
    const optimized = await optimizeImage(sourceUri);
    await FileSystem.copyAsync({ from: optimized, to: destUri });
    if (optimized !== sourceUri) {
      try {
        await FileSystem.deleteAsync(optimized, { idempotent: true });
      } catch {
        // ignore
      }
    }
  } catch {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  }
  return destUri;
}

export async function deleteShippingLabel(uri: string | null): Promise<void> {
  if (!uri) return;
  await deleteInventoryPhoto(uri);
}

export async function readAsBase64(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

export async function writeBase64File(
  base64: string,
  destUri: string
): Promise<string> {
  const dir = destUri.substring(0, destUri.lastIndexOf('/') + 1);
  await ensureDir(dir);
  await FileSystem.writeAsStringAsync(destUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return destUri;
}
