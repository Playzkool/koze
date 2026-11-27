import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { DEFAULT_BOARDS } from '@/data/default-boards';

export type Tile = {
  id: string;
  label: string;
  /** ARASAAC pictogram id. */
  pictoId: number;
  /** When set, the tile opens this board instead of adding a word. */
  boardId?: string;
};

export type Board = {
  id: string;
  title: string;
  tiles: Tile[];
};

type Boards = Record<string, Board>;

const STORAGE_KEY = 'koze.boards.v1';

/**
 * Everything lives on the device. No account, no server.
 * Synchronous kv-store reads keep the first render instant and offline-safe.
 */
function load(): Boards {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Boards;
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

export function addTile(boardId: string, tile: Omit<Tile, 'id'>) {
  const board = boards[boardId];
  if (!board) return;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  commit({ ...boards, [boardId]: { ...board, tiles: [...board.tiles, { ...tile, id }] } });
}

export function removeTile(boardId: string, tileId: string) {
  const board = boards[boardId];
  if (!board) return;
  commit({ ...boards, [boardId]: { ...board, tiles: board.tiles.filter((t) => t.id !== tileId) } });
}

export function resetBoards() {
  commit(DEFAULT_BOARDS);
}
