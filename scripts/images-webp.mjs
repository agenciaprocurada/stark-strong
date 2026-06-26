// Gera .webp ao lado de cada imagem (png/jpg/jpeg) em public/produtos e public/assets.
// Redimensiona para largura máxima de exibição e comprime para ficar leve.
// Rode: node scripts/images-webp.mjs
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['public/produtos', 'public/assets', 'public/assets/partners'];
const MAX_W = 1280;       // largura máxima de exibição (retina coberto p/ cards)
const TARGET = 100 * 1024; // alvo: abaixo de 100 KB
const SRC_RE = /\.(png|jpe?g)$/i;

// Gera webp tentando ficar < 100KB: baixa a qualidade e, no limite, a largura.
async function encode(src, out) {
  const steps = [
    [1280, 78], [1280, 70], [1180, 66], [1080, 62], [1080, 56], [980, 52],
  ];
  let size = Infinity;
  for (const [w, q] of steps) {
    await sharp(src).resize({ width: w, withoutEnlargement: true })
      .webp({ quality: q, effort: 5 }).toFile(out);
    size = (await stat(out)).size;
    if (size <= TARGET) break;
  }
  return size;
}

async function walk(dir) {
  let files = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) continue; // partners é tratado como dir próprio na lista
    if (SRC_RE.test(name)) files.push(full);
  }
  return files;
}

let totalIn = 0, totalOut = 0, over = [];
for (const rel of DIRS) {
  const dir = join(ROOT, rel);
  let files;
  try { files = await walk(dir); } catch { continue; }
  for (const src of files) {
    const out = src.replace(SRC_RE, '.webp');
    const inSize = (await stat(src)).size;
    const outSize = await encode(src, out);
    totalIn += inSize; totalOut += outSize;
    if (outSize > 100 * 1024) over.push([out, outSize]);
  }
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
console.log(`\nEntrada: ${mb(totalIn)}  →  webp: ${mb(totalOut)}  (-${Math.round((1 - totalOut / totalIn) * 100)}%)`);
console.log(`Acima de 100KB: ${over.length}`);
for (const [f, s] of over.sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${(s / 1024).toFixed(0)} KB  ${f.replace(ROOT, '')}`);
}
