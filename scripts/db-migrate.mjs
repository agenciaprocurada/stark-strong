/* Aplica um arquivo .sql no banco Supabase via conexão Postgres direta.
   Uso:  node scripts/db-migrate.mjs supabase/banners-tipo.sql
   Lê SUPABASE_URL e SUPABASE_DB_PASSWORD do .env. Idempotente se o SQL for. */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const root = process.cwd();
const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('Informe o arquivo .sql. Ex.: node scripts/db-migrate.mjs supabase/banners-tipo.sql');
  process.exit(2);
}

const env = Object.fromEntries(
  readFileSync(root + '/.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const pw = env.SUPABASE_DB_PASSWORD;
const sql = readFileSync(root + '/' + sqlPath, 'utf8');

// tenta o pooler (várias regiões) e a conexão direta
const candidates = [
  { name: 'pooler-sa-east-1', host: 'aws-0-sa-east-1.pooler.supabase.com', port: 6543, user: `postgres.${ref}` },
  { name: 'pooler-us-east-1', host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${ref}` },
  { name: 'direct', host: `db.${ref}.supabase.co`, port: 5432, user: 'postgres' },
];

for (const c of candidates) {
  const client = new pg.Client({
    host: c.host, port: c.port, user: c.user, password: pw,
    database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    console.log(`[conectado via ${c.name}]`);
    await client.query(sql);
    await client.end();
    console.log(`MIGRATION OK — ${sqlPath}`);
    process.exit(0);
  } catch (e) {
    console.log(`[falhou ${c.name}] ${e.code || ''} ${e.message}`);
    try { await client.end(); } catch {}
  }
}
console.log('NENHUMA CONEXAO FUNCIONOU');
process.exit(1);
