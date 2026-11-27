import { Directory, File, Paths } from 'expo-file-system';
import { AppState } from 'react-native';

import { BUNDLED_PICTOS } from '@/data/default-pictos';
import { getBoardsSnapshot, subscribe, type Boards } from '@/store/boards';
import { pictoUrl } from '@/utils/arasaac';

/**
 * Offline storage for ARASAAC pictograms.
 *
 * expo-image's disk cache is not enough: iOS evicts images unread for a week,
 * and both OSes may purge the cache directory. So:
 * - the default vocabulary is bundled with the app (src/data/default-pictos.ts);
 * - every other pictogram used on a board is downloaded to Documents/arasaac,
 *   which the OS never purges, and removed when no board uses it any more.
 */

const DIR_NAME = 'arasaac';
const CONCURRENCY = 4;

function dir() {
  return new Directory(Paths.document, DIR_NAME);
}

/** Ids already on disk. Loaded once, then kept in sync by `syncPictos`. */
let stored: Set<number> | null = null;

function storedIds(): Set<number> {
  if (stored) return stored;
  stored = new Set();
  try {
    const d = dir();
    if (d.exists) {
      for (const entry of d.list()) {
        const match = entry instanceof File ? /^(\d+)\.png$/.exec(entry.name) : null;
        if (match) stored.add(Number(match[1]));
      }
    }
  } catch {
    // Unreadable directory: everything falls back to the network.
  }
  return stored;
}

/** Image source for a pictogram: bundled asset, then local file, then network. */
export function pictoSource(id: number): number | string {
  const bundled = BUNDLED_PICTOS[id];
  if (bundled !== undefined) return bundled;
  if (storedIds().has(id)) return new File(dir(), `${id}.png`).uri;
  return pictoUrl(id);
}

function usedIds(boards: Readonly<Boards>): Set<number> {
  const ids = new Set<number>();
  for (const board of Object.values(boards)) {
    for (const tile of board.tiles) if (tile.image.kind === 'arasaac') ids.add(tile.image.id);
  }
  return ids;
}

let running: Promise<void> | null = null;
let rerun = false;

/**
 * Downloads the pictograms used on boards that are neither bundled nor stored,
 * and deletes stored ones no board uses any more. Safe to call often: calls
 * made while a sync runs are folded into one follow-up run. Offline, failed
 * downloads are simply retried on the next sync.
 */
export function syncPictos(): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }
  running = (async () => {
    do {
      rerun = false;
      await syncOnce();
    } while (rerun);
  })().finally(() => {
    running = null;
  });
  return running;
}

async function syncOnce() {
  const used = usedIds(getBoardsSnapshot());
  const have = storedIds();
  const missing = [...used].filter((id) => BUNDLED_PICTOS[id] === undefined && !have.has(id));

  if (missing.length > 0) {
    const d = dir();
    d.create({ idempotent: true, intermediates: true });
    const queue = [...missing];
    const worker = async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
        try {
          await File.downloadFileAsync(pictoUrl(id), new File(d, `${id}.png`), { idempotent: true });
          have.add(id);
        } catch {
          // Offline or ARASAAC unavailable: retried on the next sync.
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  for (const id of [...have]) {
    if (used.has(id)) continue;
    try {
      const f = new File(dir(), `${id}.png`);
      if (f.exists) f.delete();
      have.delete(id);
    } catch {
      // Keep the id: worst case an unused file stays on disk.
    }
  }
}

/**
 * Syncs now, after every board change (debounced), and whenever the app comes
 * back to the foreground (retries downloads that failed offline).
 * Returns a cleanup function.
 */
export function startPictoSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  syncPictos();
  const unsubscribe = subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(syncPictos, 1000);
  });
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncPictos();
  });
  return () => {
    clearTimeout(timer);
    unsubscribe();
    appState.remove();
  };
}
