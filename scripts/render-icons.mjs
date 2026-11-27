#!/usr/bin/env node
/**
 * Renders the icon SVG sources (assets/source/*.svg) to the PNG files the app
 * config uses, with headless Chrome (no extra dependency).
 *
 *   npm run icons:render
 *
 * Set CHROME_PATH if Chrome is not in /Applications.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const outputs = [
  { src: 'icon.svg', out: 'assets/images/icon.png', w: 1024, h: 1024 },
  { src: 'icon.svg', out: 'assets/images/favicon.png', w: 48, h: 48 },
  { src: 'android-foreground.svg', out: 'assets/images/android-icon-foreground.png', w: 1024, h: 1024 },
  { src: 'android-monochrome.svg', out: 'assets/images/android-icon-monochrome.png', w: 1024, h: 1024 },
  { src: 'splash-icon.svg', out: 'assets/images/splash-icon.png', w: 840, h: 652 },
];

const tmp = mkdtempSync(join(tmpdir(), 'koze-icons-'));
try {
  for (const { src, out, w, h } of outputs) {
    const page = join(tmp, 'page.html');
    const svgUrl = pathToFileURL(join(root, 'assets/source', src)).href;
    writeFileSync(
      page,
      `<!doctype html><html><body style="margin:0;background:transparent">` +
        `<img src="${svgUrl}" style="display:block;width:${w}px;height:${h}px"></body></html>`,
    );
    execFileSync(chrome, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      '--allow-file-access-from-files',
      `--window-size=${w},${h}`,
      `--screenshot=${join(root, out)}`,
      pathToFileURL(page).href,
    ], { stdio: 'ignore' });
    console.log(`${out} (${w}×${h})`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
