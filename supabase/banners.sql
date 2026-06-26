-- Stark Strong — banners do carrossel da home (gestão via /admin)
-- Leitura pública (a home lê no build). Escrita só para usuários autenticados.
-- Rode no SQL Editor do Supabase depois de schema.sql e admin.sql.

-- =========================================================
-- Tabela
-- =========================================================
create table if not exists public.banners (
  id             bigint generated always as identity primary key,
  ordem          int  not null default 0,
  ativo          boolean not null default true,
  eyebrow        text,                         -- texto pequeno acima do título
  titulo         jsonb not null default '[]',  -- linhas: [{ "t": "TEXTO", "gold": true }]
  lead           text,                         -- subtítulo (oculto no mobile)
  imagem         text,                         -- caminho web (/assets/..) ou URL do storage
  botao1_texto   text,                         -- CTA primário
  botao1_link    text not null default '/produtos',
  botao2_texto   text,                         -- CTA secundário
  botao2_link    text not null default '/produtos',
  created_at     timestamptz not null default now()
);

create index if not exists idx_banners_ordem on public.banners(ordem);
create index if not exists idx_banners_ativo on public.banners(ativo);

-- =========================================================
-- RLS — leitura pública, escrita autenticada
-- =========================================================
alter table public.banners enable row level security;

drop policy if exists "leitura publica banners" on public.banners;
create policy "leitura publica banners" on public.banners
  for select using (true);

drop policy if exists "admin escreve banners" on public.banners;
create policy "admin escreve banners" on public.banners
  for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- Storage — bucket das imagens de banner
-- =========================================================
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "leitura publica bucket banners" on storage.objects;
create policy "leitura publica bucket banners" on storage.objects
  for select using (bucket_id = 'banners');

drop policy if exists "admin escreve bucket banners" on storage.objects;
create policy "admin escreve bucket banners" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'banners')
  with check (bucket_id = 'banners');

-- =========================================================
-- Seed — os 3 banners atuais da home (só se a tabela estiver vazia)
-- =========================================================
insert into public.banners (ordem, ativo, eyebrow, titulo, lead, imagem, botao1_texto, botao1_link, botao2_texto, botao2_link)
select * from (values
  (0, true, 'Linha profissional 2025',
   '[{"t":"A LINHA QUE"},{"t":"TRANSFORMA","gold":true},{"t":"ACADEMIAS"}]'::jsonb,
   'Biomecânica precisa, aço estrutural e acabamento premium. Os equipamentos que viram referência de performance.',
   '/assets/photo-machine-hero.png', 'Solicitar orçamento', '/produtos', 'Linha completa', '/produtos'),
  (1, true, 'Tecnologia Stark Strong',
   '[{"t":"BIOMECÂNICA","gold":true},{"t":"QUE SE SENTE"},{"t":"NA PRIMEIRA SÉRIE"}]'::jsonb,
   'Guias lineares, ângulos de 45° e curvas de resistência projetadas para resultado real — do iniciante ao avançado.',
   '/assets/photo-machine-rack.png', 'Conheça a tecnologia', '/produtos', 'Falar com especialista', '/produtos'),
  (2, true, 'Solução end-to-end',
   '[{"t":"DO PROJETO"},{"t":"À INSTALAÇÃO","gold":true},{"t":"DA SUA ACADEMIA"}]'::jsonb,
   'Monte sua academia com a Stark Strong: projeto, fabricação, logística e instalação, com suporte próximo.',
   '/assets/photo-gym-dark.png', 'Montar orçamento', '/produtos', 'Como funciona', '/produtos')
) as v(ordem, ativo, eyebrow, titulo, lead, imagem, botao1_texto, botao1_link, botao2_texto, botao2_link)
where not exists (select 1 from public.banners);
