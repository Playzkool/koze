import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getBoardsSnapshot, replaceBoards } from '@/store/boards';
import { BackupError, buildBackup, type ParsedBackup, parseBackup } from '@/utils/backup-format';
import { readPhotoBase64, replaceAllPhotos } from '@/utils/photo';

export { BackupError, type ParsedBackup } from '@/utils/backup-format';

/** Refuse files above this size before even reading them. */
const MAX_FILE_BYTES = 200 * 1024 * 1024;

/** Writes a backup JSON file to the cache and opens the system share sheet. */
export async function exportBackup() {
  const boards = getBoardsSnapshot();
  const photos: Record<string, string> = {};
  for (const board of Object.values(boards)) {
    for (const tile of board.tiles) {
      if (tile.image.kind !== 'photo' || tile.image.file in photos) continue;
      const data = await readPhotoBase64(tile.image.file);
      // A photo missing on disk is skipped; import then rejects the backup, so fail now instead.
      if (data === null) throw new BackupError(`La photo du pictogramme « ${tile.label} » est introuvable.`);
      photos[tile.image.file] = data;
    }
  }

  const backup = buildBackup(boards, photos, Constants.expoConfig?.version);
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `koze-sauvegarde-${date}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupError('Le partage de fichiers n’est pas disponible sur cet appareil.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Enregistrer la sauvegarde Kozé',
  });
}

/** Lets the user pick a backup file and validates it. Returns null if cancelled. */
export async function pickBackup(): Promise<ParsedBackup | null> {
  // '*/*': some Android file managers report .json files as octet-stream.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_FILE_BYTES) throw new BackupError('Ce fichier est trop volumineux.');

  let raw: unknown;
  try {
    raw = JSON.parse(await new File(asset.uri).text());
  } catch {
    throw new BackupError('Ce fichier n’est pas une sauvegarde Kozé.');
  }
  return parseBackup(raw);
}

/** Replaces every board and photo with the backup content. */
export function applyBackup(backup: ParsedBackup) {
  // Photos first: if writing them fails, the current boards stay untouched.
  replaceAllPhotos(backup.photos);
  replaceBoards(backup.boards);
}
