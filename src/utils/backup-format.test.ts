/// <reference types="node" />
/**
 * Backup validation tests. Run with `npm run test:unit` (node:test via tsx).
 * An imported backup is untrusted input: these cases guard the checks against
 * regressions, including path traversal through photo names.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_BOARDS } from '@/data/default-boards';
import { BackupError, buildBackup, parseBackup } from '@/utils/backup-format';

// A JSON round trip gives a plain, mutable copy, like a file read from disk.
const base = (): any => JSON.parse(JSON.stringify(buildBackup(DEFAULT_BOARDS, {}, '1.0.0')));

const rejects = (raw: unknown) => assert.throws(() => parseBackup(raw), BackupError);

describe('parseBackup', () => {
  it('accepts the default boards', () => {
    const r = parseBackup(base());
    assert.equal(r.stats.tiles, 32);
    assert.equal(r.stats.categories, 3);
    assert.equal(r.stats.photos, 0);
  });

  it('keeps used photos, drops unused ones and unknown fields', () => {
    const b = base();
    b.boards.home.tiles.push({ id: 'p1', label: 'Maman', image: { kind: 'photo', file: 'abc-123.jpg' }, extra: 1 });
    b.photos = { 'abc-123.jpg': 'QUJD', 'unused-1.jpg': 'QUJD' };
    const r = parseBackup(b);
    assert.deepEqual(Object.keys(r.photos), ['abc-123.jpg']);
    assert.ok(!('extra' in r.boards.home.tiles.at(-1)!));
  });

  it('rebuilds parent links from the category tiles', () => {
    const b = base();
    b.boards.besoins.parentId = 'emotions';
    assert.equal(parseBackup(b).boards.besoins.parentId, 'home');
  });

  it('rejects files that are not Kozé backups', () => {
    rejects('hello');
    rejects({ ...base(), format: 'other' });
  });

  it('rejects backups from a newer version', () => rejects({ ...base(), version: 99 }));

  it('rejects a backup without the home board', () => {
    const b = base();
    delete b.boards.home;
    rejects(b);
  });

  it('rejects path traversal in photo names', () => {
    const b = base();
    b.boards.home.tiles.push({ id: 'x', label: 'x', image: { kind: 'photo', file: '../../etc/passwd' } });
    rejects(b);
    const k = base();
    k.photos = { '../evil.jpg': 'QUJD' };
    rejects(k);
  });

  it('rejects missing or unreadable photos', () => {
    const b = base();
    b.boards.home.tiles.push({ id: 'x', label: 'x', image: { kind: 'photo', file: 'nope-1.jpg' } });
    rejects(b);
    const c = base();
    c.photos = { 'a-1.jpg': 'not base64!!' };
    rejects(c);
  });

  it('rejects broken category structures', () => {
    const dangling = base();
    dangling.boards.home.tiles.push({ id: 'x', label: 'x', image: { kind: 'arasaac', id: 1 }, boardId: 'ghost' });
    rejects(dangling);
    const orphan = base();
    orphan.boards.lost = { id: 'lost', title: 'Lost', tiles: [] };
    rejects(orphan);
    const twice = base();
    twice.boards.besoins.tiles.push({ id: 'c', label: 'loop', image: { kind: 'arasaac', id: 1 }, boardId: 'besoins' });
    rejects(twice);
  });

  it('rejects invalid fields', () => {
    const label = base();
    label.boards.home.tiles[0].label = 'x'.repeat(200);
    rejects(label);
    const color = base();
    color.boards.home.tiles[0].image = { kind: 'text', color: 'red; drop' };
    rejects(color);
    const key = base();
    key.boards.home.id = 'other';
    rejects(key);
  });
});
