import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { DEFAULT_BOARDS, ROOT_BOARD_ID } from '@/data/default-boards';
import { deleteAllPhotos, deletePhoto } from '@/utils/photo';

export type TileImage =
  /** ARASAAC pictogram. */
  | { kind: 'arasaac'; id: number }
  /** Caregiver photo. `file` is a file NAME in the photos directory, never a full path. */
  | { kind: 'photo'; file: string }
  /** No image: the label is shown large on a colored background. */
  | { kind: 'text'; color: string };

export type Tile = {
  id: string;
  /** Short text shown on the tile. */
  label: string;
  /** Optional longer sentence spoken instead of the label. */
  speech?: string;
  image: TileImage;
  /** When set, the tile is a category: it opens this board. */
  boardId?: string;
};

export type Board = {
  id: string;
  title: string;
  /** Board holding the folder tile that opens this one. Undefined for the root. */
  parentId?: string;
  tiles: Tile[];
};

type Boards = Record<string, Board>;

export const LABEL_SOFT_LIMIT = 25;
export const LABEL_MAX = 40;
export const SPEECH_MAX = 150;
/** Root is depth 1. Deeper trees get hard to navigate for users. */
export const MAX_DEPTH = 3;

const STORAGE_KEY = 'koze.boards.v2';
const LEGACY_KEY_V1 = 'koze.boards.v1';

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** v1 tiles had a bare `pictoId` and boards had no parent link. */
function migrateV1(raw: string): Boards {
  type V1 = Record<string, { id: string; title: string; tiles: { id: string; label: string; pictoId: number; boardId?: string }[] }>;
  const old = JSON.parse(raw) as V1;
  const next: Boards = {};
  for (const board of Object.values(old)) {
    next[board.id] = {
      id: board.id,
      title: board.title,
      tiles: board.tiles.map(({ pictoId, ...t }) => ({ ...t, image: { kind: 'arasaac', id: pictoId } })),
    };
  }
  for (const board of Object.values(next)) {
    for (const tile of board.tiles) {
      if (tile.boardId && next[tile.boardId]) next[tile.boardId].parentId = board.id;
    }
  }
  return next;
}

/**
 * Everything lives on the device. No account, no server.
 * Synchronous kv-store reads keep the first render instant and offline-safe.
 */
function load(): Boards {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Boards;

    const legacy = Storage.getItemSync(LEGACY_KEY_V1);
    if (legacy) {
      const migrated = migrateV1(legacy);
      Storage.setItemSync(STORAGE_KEY, JSON.stringify(migrated));
      Storage.removeItemSync(LEGACY_KEY_V1);
      return migrated;
    }
  } catch {
    // Corrupt or unreadable storage: fall back to defaults rather than crash.
  }
  return DEFAULT_BOARDS;
}

let boards: Boards = load();
const listeners = new Set<() => void>();

function commit(next: Boards) {
  boards = next;
  Storage.setItemSync(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBoard(id: string): Board | undefined {
  return useSyncExternalStore(subscribe, () => boards[id]);
}

export type BoardOption = { id: string; title: string; depth: number; path: string };

function getBoardSnapshot() {
  return boards;
}

/**
 * Every board as a flat list in tree order (depth-first, following folder
 * tile order), for category pickers. `path` reads "Accueil › Besoins".
 */
export function useBoardOptions(): BoardOption[] {
  const all = useSyncExternalStore(subscribe, getBoardSnapshot);
  const options: BoardOption[] = [];
  const visit = (id: string, depth: number, parentPath: string) => {
    const board = all[id];
    if (!board || options.some((o) => o.id === id)) return;
    const path = parentPath ? `${parentPath} › ${board.title}` : board.title;
    options.push({ id, title: board.title, depth, path });
    for (const t of board.tiles) if (t.boardId) visit(t.boardId, depth + 1, path);
  };
  visit(ROOT_BOARD_ID, 0, '');
  return options;
}

export function getTile(boardId: string, tileId: string): Tile | undefined {
  return boards[boardId]?.tiles.find((t) => t.id === tileId);
}

export function boardDepth(boardId: string): number {
  let depth = 1;
  let current = boards[boardId];
  while (current?.parentId) {
    depth++;
    current = boards[current.parentId];
  }
  return depth;
}

export function canCreateCategory(boardId: string) {
  return boardDepth(boardId) < MAX_DEPTH;
}

/** All board ids in the subtree rooted at `boardId`, itself included. */
function subtree(boardId: string): string[] {
  const ids: string[] = [];
  const stack = [boardId];
  while (stack.length) {
    const id = stack.pop()!;
    const board = boards[id];
    if (!board || ids.includes(id)) continue;
    ids.push(id);
    for (const t of board.tiles) if (t.boardId) stack.push(t.boardId);
  }
  return ids;
}

/** Number of word tiles (not categories) that deleting this category would remove. */
export function countTilesInCategory(boardId: string): number {
  return subtree(boardId).reduce((n, id) => n + boards[id].tiles.filter((t) => !t.boardId).length, 0);
}

export function addTile(boardId: string, tile: Omit<Tile, 'id' | 'boardId'>) {
  const board = boards[boardId];
  if (!board) return;
  commit({ ...boards, [boardId]: { ...board, tiles: [...board.tiles, { ...tile, id: newId() }] } });
}

export function addCategory(parentId: string, tile: Omit<Tile, 'id' | 'boardId' | 'speech'>) {
  const parent = boards[parentId];
  if (!parent || !canCreateCategory(parentId)) return;
  const childId = newId();
  commit({
    ...boards,
    [childId]: { id: childId, title: tile.label, parentId, tiles: [] },
    [parentId]: { ...parent, tiles: [...parent.tiles, { ...tile, id: newId(), boardId: childId }] },
  });
}

export function updateTile(boardId: string, tileId: string, patch: Pick<Tile, 'label' | 'speech' | 'image'>) {
  const board = boards[boardId];
  const tile = board?.tiles.find((t) => t.id === tileId);
  if (!board || !tile) return;

  const next: Boards = {
    ...boards,
    [boardId]: { ...board, tiles: board.tiles.map((t) => (t.id === tileId ? { ...t, ...patch } : t)) },
  };
  // Keep the category title in sync with its folder tile.
  if (tile.boardId && next[tile.boardId]) {
    next[tile.boardId] = { ...next[tile.boardId], title: patch.label };
  }
  commit(next);

  if (tile.image.kind === 'photo' && (patch.image.kind !== 'photo' || patch.image.file !== tile.image.file)) {
    deletePhoto(tile.image.file);
  }
}

/** Moves a word tile to the end of another board. Categories are not movable (cycles, depth). */
export function moveTile(fromBoardId: string, tileId: string, toBoardId: string) {
  if (fromBoardId === toBoardId) return;
  const from = boards[fromBoardId];
  const to = boards[toBoardId];
  const tile = from?.tiles.find((t) => t.id === tileId);
  if (!from || !to || !tile || tile.boardId) return;
  commit({
    ...boards,
    [fromBoardId]: { ...from, tiles: from.tiles.filter((t) => t.id !== tileId) },
    [toBoardId]: { ...to, tiles: [...to.tiles, tile] },
  });
}

/** Removes a tile. A category is removed with its whole subtree and its photos. */
export function removeTile(boardId: string, tileId: string) {
  const board = boards[boardId];
  const tile = board?.tiles.find((t) => t.id === tileId);
  if (!board || !tile) return;

  const next: Boards = { ...boards, [boardId]: { ...board, tiles: board.tiles.filter((t) => t.id !== tileId) } };
  const orphanPhotos: string[] = tile.image.kind === 'photo' ? [tile.image.file] : [];

  if (tile.boardId) {
    for (const id of subtree(tile.boardId)) {
      for (const t of boards[id].tiles) if (t.image.kind === 'photo') orphanPhotos.push(t.image.file);
      delete next[id];
    }
  }
  commit(next);
  orphanPhotos.forEach(deletePhoto);
}

export function resetBoards() {
  commit(DEFAULT_BOARDS);
  deleteAllPhotos();
}

export { ROOT_BOARD_ID };
