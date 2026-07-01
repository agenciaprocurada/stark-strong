-- Stark Strong — orçamentos enviados pelo site (CRM no /admin)
-- ===================================================================
-- Fluxo:
--   • O cliente monta a lista na loja (localStorage) e envia em /orcamento.
--     Como o site é estático e ninguém faz login, o envio entra por uma
--     FUNÇÃO (security definer): o anônimo só chama enviar_orcamento(...),
--     não lê nem escreve direto nas tabelas. Atômico e sem brecha de leitura.
--   • No /admin a aba "Orçamentos" é um kanban: novos | encaminhados | enviados.
--   • Cada orçamento tem histórico de passos (orcamento_eventos) e um campo
--     livre de notas internas (orcamentos.notas) — estilo CRM.
--   • Organizado por e-mail: a busca no admin agrupa por e-mail do solicitante.
--
-- Depende de usuarios.sql (usa a função public.tem_perm).
-- Aplicar:  node scripts/db-migrate.mjs supabase/orcamentos.sql
-- Idempotente.

-- =========================================================
-- Tabelas
-- =========================================================
create table if not exists public.orcamentos (
  id          bigint generated always as identity primary key,
  email       text not null,
  nome        text,
  academia    text,
  telefone    text,
  observacoes text,                      -- mensagem do cliente no envio
  status      text not null default 'novo'
              check (status in ('novo', 'encaminhado', 'enviado')),
  notas       text,                      -- notas internas (CRM, só admin)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_orcamentos_email  on public.orcamentos (lower(email));
create index if not exists idx_orcamentos_status on public.orcamentos (status);
create index if not exists idx_orcamentos_data   on public.orcamentos (created_at desc);

create table if not exists public.orcamento_itens (
  id           bigint generated always as identity primary key,
  orcamento_id bigint not null references public.orcamentos(id) on delete cascade,
  produto_ref  text,                     -- id/slug do produto na loja (snapshot)
  nome         text not null,
  categoria    text,
  img          text,
  qty          int not null default 1 check (qty > 0)
);
create index if not exists idx_orcamento_itens_oc on public.orcamento_itens (orcamento_id);

create table if not exists public.orcamento_eventos (
  id           bigint generated always as identity primary key,
  orcamento_id bigint not null references public.orcamentos(id) on delete cascade,
  tipo         text not null default 'nota'    -- 'criado' | 'status' | 'nota'
               check (tipo in ('criado', 'status', 'nota')),
  descricao    text not null,
  autor        text,                           -- e-mail de quem registrou
  created_at   timestamptz not null default now()
);
create index if not exists idx_orcamento_eventos_oc on public.orcamento_eventos (orcamento_id, created_at);

-- =========================================================
-- RLS — tabelas fechadas: leitura/edição só quem tem a permissão.
-- O cliente anônimo NÃO escreve direto (entra pela função abaixo).
-- =========================================================
alter table public.orcamentos        enable row level security;
alter table public.orcamento_itens   enable row level security;
alter table public.orcamento_eventos enable row level security;

-- orcamentos
drop policy if exists "orcamentos: leitura"  on public.orcamentos;
create policy "orcamentos: leitura" on public.orcamentos
  for select to authenticated using (public.tem_perm('orcamentos'));

drop policy if exists "orcamentos: atualiza" on public.orcamentos;
create policy "orcamentos: atualiza" on public.orcamentos
  for update to authenticated
  using (public.tem_perm('orcamentos')) with check (public.tem_perm('orcamentos'));

drop policy if exists "orcamentos: remove" on public.orcamentos;
create policy "orcamentos: remove" on public.orcamentos
  for delete to authenticated using (public.tem_perm('orcamentos'));

-- orcamento_itens
drop policy if exists "itens: leitura" on public.orcamento_itens;
create policy "itens: leitura" on public.orcamento_itens
  for select to authenticated using (public.tem_perm('orcamentos'));

drop policy if exists "itens: remove" on public.orcamento_itens;
create policy "itens: remove" on public.orcamento_itens
  for delete to authenticated using (public.tem_perm('orcamentos'));

-- orcamento_eventos (o evento 'criado' nasce do trigger; admin registra os demais)
drop policy if exists "eventos: leitura" on public.orcamento_eventos;
create policy "eventos: leitura" on public.orcamento_eventos
  for select to authenticated using (public.tem_perm('orcamentos'));

drop policy if exists "eventos: insere" on public.orcamento_eventos;
create policy "eventos: insere" on public.orcamento_eventos
  for insert to authenticated with check (public.tem_perm('orcamentos'));

-- =========================================================
-- Trigger — toda criação de orçamento gera o 1º passo do histórico
-- =========================================================
create or replace function public.orcamento_evento_criado()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.orcamento_eventos (orcamento_id, tipo, descricao, autor)
  values (new.id, 'criado', 'Orçamento recebido pelo site', new.email);
  return new;
end $$;

drop trigger if exists trg_orcamento_criado on public.orcamentos;
create trigger trg_orcamento_criado
  after insert on public.orcamentos
  for each row execute function public.orcamento_evento_criado();

-- =========================================================
-- Função de envio público (o cliente do site chama via RPC com a chave anon).
-- security definer → roda como dono, ignora a RLS e grava cabeçalho + itens
-- numa transação só. Valida e-mail e itens. Devolve o id do orçamento.
-- =========================================================
create or replace function public.enviar_orcamento(
  p_email       text,
  p_nome        text,
  p_academia    text,
  p_telefone    text,
  p_observacoes text,
  p_itens       jsonb
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id   bigint;
  v_item jsonb;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'E-mail é obrigatório.';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione ao menos um item ao orçamento.';
  end if;

  insert into public.orcamentos (email, nome, academia, telefone, observacoes)
  values (
    lower(trim(p_email)),
    nullif(trim(coalesce(p_nome, '')), ''),
    nullif(trim(coalesce(p_academia, '')), ''),
    nullif(trim(coalesce(p_telefone, '')), ''),
    nullif(trim(coalesce(p_observacoes, '')), '')
  )
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into public.orcamento_itens (orcamento_id, produto_ref, nome, categoria, img, qty)
    values (
      v_id,
      nullif(v_item->>'id', ''),
      coalesce(nullif(trim(v_item->>'name'), ''), 'Item'),
      nullif(v_item->>'category', ''),
      nullif(v_item->>'img', ''),
      greatest(1, coalesce((v_item->>'qty')::int, 1))
    );
  end loop;

  return v_id;
end $$;

-- só o envio é exposto ao anônimo; tudo mais exige login + permissão
revoke all on function public.enviar_orcamento(text, text, text, text, text, jsonb) from public;
grant execute on function public.enviar_orcamento(text, text, text, text, text, jsonb) to anon, authenticated;
