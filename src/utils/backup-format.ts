/**
 * Kozé backup file format and its validation.
 *
 * A backup is a single JSON file holding every board plus the caregiver photos
 * (base64 JPEG). An imported file is UNTRUSTED input: it is fully validated and
 * rebuilt field by field (unknown fields dropped) before anything is written.
 *
 * Pure TypeScript, no React Native import, so it can be tested with Node.
 */
import { LABEL_MAX, SPEECH_MAX } from '@/constants/limits';
import type { Board, Boards, Tile, TileImage } from '@/store/boards';

export const BACKUP_FORMAT = 'koze-backup';
export const BACKUP_VERSION = 1;
export const ROOT_ID = 'home';

/** Generous caps: a real backup is far below, a hostile one is stopped early. */
const MAX_BOARDS = 500;
const MAX_TILES_PER_BOARD = 500;
const MAX_ID_LENGTH = 64;
const MAX_PHOTO_BASE64 = 3_000_000; // ~2.2 MB JPEG
const PHOTO_NAME_RE = /^[a-z0-9-]{1,40}\.jpg$/;
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  appVersion?: string;
  boards: Boards;
  /** file name → base64 JPEG */
  photos: Record<string, string>;
};

export type ParsedBackup = {
  boards: Boards;
  photos: Record<string, string>;
  exportedAt?: string;
  stats: { categories: number; tiles: number; photos: number };
};

/** Error with a message meant for the user (French). */
export class BackupError extends Error {}

const fail = (message: string): never => {
  throw new BackupError(message);
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;

function parseImage(raw: unknown, photos: Record<string, string>): TileImage {
  if (!isObject(raw)) return fail('Une image est invalide.');
  switch (raw.kind) {
    case 'arasaac':
      if (typeof raw.id !== 'number' || !Number.isInteger(raw.id) || raw.id <= 0) {
        return fail('Un pictogramme ARASAAC est invalide.');
      }
      return { kind: 'arasaac', id: raw.id };
    case 'photo':
      if (typeof raw.file !== 'string' || !PHOTO_NAME_RE.test(raw.file)) return fail('Une photo est invalide.');
      if (!(raw.file in photos)) return fail('Une photo est manquante dans le fichier.');
      return { kind: 'photo', file: raw.file };
    case 'text':
      if (typeof raw.color !== 'string' || !HEX_COLOR_RE.test(raw.color)) return fail('Une couleur est invalide.');
      return { kind: 'text', color: raw.color };
    default:
      return fail('Un type d’image est inconnu.');
  }
}

function parseTile(raw: unknown, photos: Record<string, string>): Tile {
  if (!isObject(raw) || !isId(raw.id)) return fail('Un pictogramme est invalide.');
  if (typeof raw.label !== 'string' || !raw.label.trim() || raw.label.length > LABEL_MAX) {
    return fail('Le texte d’un pictogramme est invalide.');
  }
  const tile: Tile = { id: raw.id, label: raw.label, image: parseImage(raw.image, photos) };
  if (raw.speech !== undefined) {
    if (typeof raw.speech !== 'string' || raw.speech.length > SPEECH_MAX) {
      return fail('La phrase d’un pictogramme est invalide.');
    }
    if (raw.speech.trim()) tile.speech = raw.speech;
  }
  if (raw.boardId !== undefined) {
    if (!isId(raw.boardId)) return fail('Une catégorie est invalide.');
    tile.boardId = raw.boardId;
  }
  return tile;
}

function parsePhotos(raw: unknown): Record<string, string> {
  if (raw === undefined) return {};
  if (!isObject(raw)) return fail('Les photos du fichier sont invalides.');
  const photos: Record<string, string> = {};
  for (const [name, data] of Object.entries(raw)) {
    if (!PHOTO_NAME_RE.test(name)) return fail('Un nom de photo est invalide.');
    if (typeof data !== 'string' || data.length > MAX_PHOTO_BASE64 || !BASE64_RE.test(data)) {
      return fail('Une photo du fichier est illisible.');
    }
    photos[name] = data;
  }
  return photos;
}

/** Validates a parsed JSON value and returns a clean copy. Throws BackupError. */
export function parseBackup(raw: unknown): ParsedBackup {
  if (!isObject(raw) || raw.format !== BACKUP_FORMAT) {
    return fail('Ce fichier n’est pas une sauvegarde Kozé.');
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return fail('Cette sauvegarde vient d’une version plus récente de Kozé. Mettez l’application à jour.');
  }
  if (!isObject(raw.boards)) return fail('La sauvegarde ne contient pas de tableaux.');

  const photos = parsePhotos(raw.photos);
  const entries = Object.entries(raw.boards);
  if (entries.length === 0 || entries.length > MAX_BOARDS) return fail('Le nombre de tableaux est invalide.');

  const boards: Boards = {};
  for (const [key, value] of entries) {
    if (!isObject(value) || !isId(value.id) || value.id !== key) return fail('Un tableau est invalide.');
    if (typeof value.title !== 'string' || value.title.length > LABEL_MAX) return fail('Un titre de tableau est invalide.');
    if (!Array.isArray(value.tiles) || value.tiles.length > MAX_TILES_PER_BOARD) {
      return fail('Un tableau contient trop de pictogrammes.');
    }
    const board: Board = { id: value.id, title: value.title, tiles: value.tiles.map((t) => parseTile(t, photos)) };
    if (value.parentId !== undefined) {
      if (!isId(value.parentId)) return fail('Un tableau est invalide.');
      board.parentId = value.parentId;
    }
    boards[key] = board;
  }

  if (!boards[ROOT_ID]) return fail('La sauvegarde ne contient pas de tableau d’accueil.');

  // Structure: every category tile points to an existing board, every board but
  // the root is opened by exactly one tile, and parent links match.
  const openedBy = new Map<string, string>();
  for (const board of Object.values(boards)) {
    for (const tile of board.tiles) {
      if (!tile.boardId) continue;
      if (!boards[tile.boardId] || tile.boardId === ROOT_ID) return fail('Une catégorie pointe vers un tableau absent.');
      if (openedBy.has(tile.boardId)) return fail('Une catégorie apparaît deux fois.');
      openedBy.set(tile.boardId, board.id);
    }
  }
  for (const board of Object.values(boards)) {
    if (board.id === ROOT_ID) {
      delete board.parentId;
      continue;
    }
    const parent = openedBy.get(board.id);
    if (!parent) return fail('Un tableau n’est rattaché à aucune catégorie.');
    board.parentId = parent;
  }
  // No cycles: walking up from any board must reach the root.
  for (const board of Object.values(boards)) {
    let current: Board | undefined = board;
    for (let steps = 0; current && current.id !== ROOT_ID; steps++) {
      if (steps > MAX_BOARDS) return fail('La structure des catégories est invalide.');
      current = current.parentId ? boards[current.parentId] : undefined;
    }
    if (!current) return fail('La structure des catégories est invalide.');
  }

  // Keep only photos actually used.
  const used = new Set<string>();
  for (const board of Object.values(boards)) {
    for (const tile of board.tiles) if (tile.image.kind === 'photo') used.add(tile.image.file);
  }
  const usedPhotos = Object.fromEntries(Object.entries(photos).filter(([name]) => used.has(name)));

  const allTiles = Object.values(boards).flatMap((b) => b.tiles);
  return {
    boards,
    photos: usedPhotos,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : undefined,
    stats: {
      categories: allTiles.filter((t) => t.boardId).length,
      tiles: allTiles.filter((t) => !t.boardId).length,
      photos: used.size,
    },
  };
}

export function buildBackup(boards: Boards, photos: Record<string, string>, appVersion?: string): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    boards,
    photos,
  };
}
