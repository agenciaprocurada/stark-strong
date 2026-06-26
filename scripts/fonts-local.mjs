// Baixa os woff2 (subset latin) do Google Fonts e gera um CSS @font-face local.
// Rode uma vez: node scripts/fonts-local.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'fonts');
const CSS_OUT = join(ROOT, 'src', 'styles', 'tokens', 'fonts.css');

const css = await readFile(process.argv[2] || '/tmp/gf.css', 'utf8');

// Quebra em blocos por comentário /* nome-do-subset */
const blocks = css.split(/\/\*\s*([\w-]+)\s*\*\//).slice(1);
const faces = [];
for (let i = 0; i < blocks.length; i += 2) {
  const subset = blocks[i].trim();
  if (subset !== 'latin') continue; // só latin cobre pt-BR
  const body = blocks[i + 1];
  const family = /font-family:\s*'([^']+)'/.exec(body)?.[1];
  const style = /font-style:\s*(\w+)/.exec(body)?.[1] || 'normal';
  const weight = /font-weight:\s*(\d+)/.exec(body)?.[1] || '400';
  const url = /src:\s*url\(([^)]+)\)/.exec(body)?.[1];
  if (!family || !url) continue;
  const slug = family.toLowerCase().replace(/\s+/g, '-');
  const file = `${slug}-${weight}-${style}.woff2`;
  faces.push({ family, style, weight, url, file });
}

await mkdir(OUT_DIR, { recursive: true });
for (const f of faces) {
  const res = await fetch(f.url);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, f.file), buf);
  console.log(`✓ ${f.file} (${(buf.length / 1024).toFixed(1)} KB)`);
}

const head = `/* Stark Strong — Webfonts (auto-geradas por scripts/fonts-local.mjs)
   Arquivos hospedados localmente em /public/fonts (subset latin).
   Títulos → League Spartan · Subtítulos → Montserrat · Corpo → Inter */\n\n`;
const out = head + faces.map((f) => `@font-face {
  font-family: '${f.family}';
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: swap;
  src: url('/fonts/${f.file}') format('woff2');
}`).join('\n\n') + '\n';

await writeFile(CSS_OUT, out);
console.log(`\n${faces.length} @font-face → ${CSS_OUT}`);
