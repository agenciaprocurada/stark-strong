-- Stark Strong — esquema da área de produtos
-- Catálogo público (somente leitura via anon). Escrita só com service_role.

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists public.categorias (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  nome       text not null,
  ordem      int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id               bigint generated always as identity primary key,
  ref              text,
  slug             text not null unique,
  nome             text not null,
  categoria_id     bigint not null references public.categorias(id) on delete restrict,
  preco            text not null default 'Consultar',
  especificacoes   text,
  descricao        text,
  imagem_principal text,                 -- caminho web, ex.: /produtos/arquivo.png
  url_origem       text,
  ativo            boolean not null default true,
  destaque         boolean not null default false,  -- aparece em "Produtos em destaque" na home
  created_at       timestamptz not null default now()
);

-- garante a coluna em bancos já existentes (idempotente)
alter table public.produtos add column if not exists destaque boolean not null default false;

create table if not exists public.produto_imagens (
  id         bigint generated always as identity primary key,
  produto_id bigint not null references public.produtos(id) on delete cascade,
  arquivo    text not null,              -- caminho web, ex.: /produtos/arquivo.png
  ordem      int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_produtos_categoria on public.produtos(categoria_id);
create index if not exists idx_produtos_ativo      on public.produtos(ativo);
create index if not exists idx_produtos_destaque   on public.produtos(destaque);
create index if not exists idx_imagens_produto     on public.produto_imagens(produto_id);

-- =========================================================
-- RLS — catálogo é público para leitura
-- =========================================================

alter table public.categorias       enable row level security;
alter table public.produtos         enable row level security;
alter table public.produto_imagens  enable row level security;

drop policy if exists "leitura publica categorias" on public.categorias;
create policy "leitura publica categorias" on public.categorias
  for select using (true);

drop policy if exists "leitura publica produtos" on public.produtos;
create policy "leitura publica produtos" on public.produtos
  for select using (true);

drop policy if exists "leitura publica imagens" on public.produto_imagens;
create policy "leitura publica imagens" on public.produto_imagens
  for select using (true);
