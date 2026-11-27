import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Photos are stored as small square JPEGs: ~30–60 KB each. */
const SIZE = 400;
const QUALITY = 0.7;

/**
 * Lives in Documents (never purged by the OS, unlike the cache).
 * Tiles store only the file NAME: the iOS container path changes on app updates.
 */
function photosDir() {
  const dir = new Directory(Paths.document, 'pictos');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

export function photoUri(file: string) {
  return new File(Paths.document, 'pictos', file).uri;
}

export type PickError = 'permission-denied';

/**
 * Opens the camera or the photo library, then center-crops to a square and compresses.
 * Returns a temporary uri (cache), or null if cancelled. Call `persistPhoto` on save.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('permission-denied' satisfies PickError);
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;

  const asset = result.assets[0];
  const side = Math.min(asset.width, asset.height);
  const context = ImageManipulator.manipulate(asset.uri);
  // The picker crop is square on iOS but only a hint on some Android devices.
  if (asset.width !== asset.height) {
    context.crop({
      originX: Math.floor((asset.width - side) / 2),
      originY: Math.floor((asset.height - side) / 2),
      width: side,
      height: side,
    });
  }
  context.resize({ width: Math.min(SIZE, side), height: null });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY });
  return saved.uri;
}

/** Moves a temporary photo into permanent storage and returns its file name. */
export function persistPhoto(tempUri: string): string {
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  new File(tempUri).moveSync(new File(photosDir(), name));
  return name;
}

export function deletePhoto(file: string) {
  try {
    const f = new File(Paths.document, 'pictos', file);
    if (f.exists) f.delete();
  } catch {
    // A missing file is not worth crashing over.
  }
}

export function deleteAllPhotos() {
  try {
    const dir = new Directory(Paths.document, 'pictos');
    if (dir.exists) dir.delete();
  } catch {
    // Ignore: worst case a few orphan files remain.
  }
}
