-- Stark Strong — configurações do site (contato, localização, horário).
-- Tabela singleton (uma linha, id=1) com variáveis replicadas pelo site inteiro.
-- Leitura pública (o site lê no build); escrita só autenticada. Idempotente.

create table if not exists public.configuracoes (
  id          int  primary key default 1,
  telefone    text,
  whatsapp    text,
  email       text,
  end_rua     text,
  end_numero  text,
  end_cidade  text,
  end_estado  text,
  end_cep     text,
  horario     text,
  updated_at  timestamptz not null default now(),
  constraint configuracoes_singleton check (id = 1)
);

-- RLS — leitura pública, escrita autenticada (mesmo padrão dos banners)
alter table public.configuracoes enable row level security;

drop policy if exists "leitura publica config" on public.configuracoes;
create policy "leitura publica config" on public.configuracoes
  for select using (true);

drop policy if exists "admin escreve config" on public.configuracoes;
create policy "admin escreve config" on public.configuracoes
  for all to authenticated using (true) with check (true);

-- Seed da linha única com os dados reais (só se ainda não existir)
insert into public.configuracoes (id, telefone, whatsapp, email, end_rua, end_numero, end_cidade, end_estado, end_cep, horario)
values (
  1,
  '(45) 9 9926-5525',
  '(45) 9 9926-5525',
  'vendas@starkstrong.com.br',
  'Rua Lagoa Ibirapuera',
  '777',
  'Cascavel',
  'PR',
  '85817830',
  'Segunda a sexta das 09:00 às 17:30'
)
on conflict (id) do nothing;
