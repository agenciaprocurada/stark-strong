// Aplica o schema e popula categorias/produtos/imagens a partir do CSV.
// Uso: node scripts/seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// ---- env ----
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const REF = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const PW = env.SUPABASE_DB_PASSWORD;

// ---- CSV ----
function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip */ }
      else cur += c;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

let raw = fs.readFileSync(path.join(root, '_uploads/produtos/starkstrong-produtos.csv'), 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const rows = parseCSV(raw);
const hdr = rows[0];
const col = (name) => hdr.indexOf(name);
const C = {
  cat: col('Categoria'), ref: col('REF'), nome: col('Nome do Produto'),
  url: col('URL do Produto'), preco: col('Preço'), espec: col('Especificações'),
  desc: col('Descrição'), arq: col('Nome dos Arquivos'),
};
const data = rows.slice(1).filter((r) => r.length > 1 && (r[C.nome] || '').trim());

// ---- imagens: agrupar por chave-base (remove -fotoN e extensão) ----
const imgFiles = fs.readdirSync(path.join(root, '_uploads/produtos')).filter((f) => /\.(png|jpe?g)$/i.test(f));
const baseKey = (f) => f.replace(/\.(png|jpe?g)$/i, '').replace(/-foto\d+$/i, '');
const fotoNum = (f) => { const m = f.match(/-foto(\d+)\./i); return m ? +m[1] : 0; };
const groups = {};
for (const f of imgFiles) (groups[baseKey(f)] ||= []).push(f);
for (const k in groups) groups[k].sort((a, b) => fotoNum(a) - fotoNum(b)); // sem -foto (0) primeiro

// ---- helpers ----
const slugify = (s) => s.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Destaques iniciais (até o cadastro de produtos assumir esse controle).
const FEATURED = new Set(['9020', '9001', '9038', '9002', '9015', '9112', '9234', '9082']);
const CAT_ORDER = ['Equipamentos para musculação', 'Cardio', 'Bancos', 'Suportes', 'Pesos', 'Barras', 'Acessórios'];

// montar categorias únicas preservando ordem desejada
const catNames = [...new Set(data.map((r) => (r[C.cat] || '').trim()))];
catNames.sort((a, b) => {
  const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

// montar produtos com slug único e galeria de imagens
const usedSlug = new Set();
const produtos = data.map((r) => {
  const nome = (r[C.nome] || '').trim();
  const ref = (r[C.ref] || '').trim();
  let slug = (r[C.url] || '').split('/').pop().replace(/-+$/, '') || slugify(nome);
  if (usedSlug.has(slug)) slug = `${slug}-${ref}`.replace(/-+$/, '');
  usedSlug.add(slug);

  // o CSV pode listar varias fotos separadas por " | "
  const csvFiles = (r[C.arq] || '').split('|').map((s) => s.trim()).filter(Boolean);
  let gallery = csvFiles.filter((f) => imgFiles.includes(f));
  if (gallery.length === 0 && csvFiles[0]) gallery = groups[baseKey(csvFiles[0])] || [];
  const imgs = gallery.map((f) => `/produtos/${f}`);

  return {
    ref, slug, nome,
    categoria: (r[C.cat] || '').trim(),
    preco: (r[C.preco] || 'Consultar').trim() || 'Consultar',
    espec: (r[C.espec] || '').trim() || null,
    desc: (r[C.desc] || '').trim() || null,
    imagem_principal: imgs[0] || null,
    url_origem: (r[C.url] || '').trim() || null,
    imagens: imgs,
  };
});

// ---- DB ----
const { Client } = pg;
const client = new Client({
  host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres',
  password: PW, database: 'postgres', ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  await client.connect();
  console.log('conectado ao Postgres');

  // schema
  const schema = fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8');
  await client.query(schema);
  console.log('schema aplicado');

  // limpa para reseed idempotente
  await client.query('truncate public.produto_imagens, public.produtos, public.categorias restart identity cascade');

  // categorias
  const catId = {};
  for (let i = 0; i < catNames.length; i++) {
    const nome = catNames[i];
    const { rows: [c] } = await client.query(
      'insert into public.categorias (slug, nome, ordem) values ($1,$2,$3) returning id',
      [slugify(nome), nome, i],
    );
    catId[nome] = c.id;
  }
  console.log('categorias inseridas:', catNames.length);

  // produtos + imagens
  let nImg = 0;
  for (const p of produtos) {
    const { rows: [prod] } = await client.query(
      `insert into public.produtos
        (ref, slug, nome, categoria_id, preco, especificacoes, descricao, imagem_principal, url_origem, destaque)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [p.ref, p.slug, p.nome, catId[p.categoria], p.preco, p.espec, p.desc, p.imagem_principal, p.url_origem, FEATURED.has(p.ref)],
    );
    for (let i = 0; i < p.imagens.length; i++) {
      await client.query(
        'insert into public.produto_imagens (produto_id, arquivo, ordem) values ($1,$2,$3)',
        [prod.id, p.imagens[i], i],
      );
      nImg++;
    }
  }
  console.log('produtos inseridos:', produtos.length, '| imagens:', nImg);

  // verificação
  const { rows: [v] } = await client.query(`
    select
      (select count(*) from public.categorias) as categorias,
      (select count(*) from public.produtos) as produtos,
      (select count(*) from public.produto_imagens) as imagens,
      (select count(*) from public.produtos where imagem_principal is null) as sem_imagem,
      (select count(*) from public.produtos where destaque) as destaques
  `);
  console.log('VERIFICAÇÃO:', v);

  await client.end();
}

main().catch((e) => { console.error('ERRO:', e); process.exit(1); });
