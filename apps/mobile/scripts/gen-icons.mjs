/**
 * Génération des icônes PWA à partir des SVG sources (assets-src/).
 * Usage : node scripts/gen-icons.mjs — nécessite `sharp` (devDependency,
 * binaire précompilé distribué par npm, aucun compilateur requis).
 * Les PNG générés sont committés (public/icons) : le runtime n'a pas besoin
 * de sharp.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'assets-src');
const out = resolve(root, 'public/icons');

await mkdir(out, { recursive: true });

const icon = await readFile(resolve(src, 'icon.svg'));
const maskable = await readFile(resolve(src, 'icon-maskable.svg'));

const jobs = [
  { input: icon, file: 'icon-192.png', size: 192 },
  { input: icon, file: 'icon-512.png', size: 512 },
  { input: icon, file: 'apple-touch-icon.png', size: 180 },
  { input: maskable, file: 'icon-maskable-512.png', size: 512 },
];

for (const job of jobs) {
  const png = await sharp(job.input, { density: 300 })
    .resize(job.size, job.size)
    .png()
    .toBuffer();
  await writeFile(resolve(out, job.file), png);
  console.log(`✓ public/icons/${job.file} (${job.size}×${job.size}, ${png.length} octets)`);
}
