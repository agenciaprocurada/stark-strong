-- Stark Strong — gestão de usuários e permissões do painel /admin
-- ===================================================================
-- Papéis:
--   admin  → acesso total ao painel (ignora a lista de permissões)
--   editor → só os menus marcados em "permissoes"
-- Permissões possíveis (chaves de menu): banners, produtos, categorias, usuarios
--
-- O bloqueio é REAL: as policies de escrita do catálogo passam a checar a
-- permissão do usuário (não é só esconder menu). Um editor sem a permissão
-- não consegue gravar, nem por fora do painel.
--
-- IMPORTANTE — para CRIAR usuários pelo /admin (cadastro client-side):
--   No Supabase → Authentication → Providers → Email, deixe:
--     • "Allow new users to sign up"  = LIGADO
--     • "Confirm email"               = DESLIGADO  (contas internas de confiança)
--   Sem isso, o cadastro pelo painel falha ou o usuário não consegue logar.
--   Excluir de vez um usuário (apagar de auth.users) continua sendo feito no
--   painel do Supabase; aqui o painel apenas DESATIVA (corta o acesso na hora).
--
-- Rode este arquivo no SQL Editor do Supabase depois de schema.sql, admin.sql
-- e banners.sql.

-- =========================================================
-- Tabela de perfis (1:1 com auth.users)
-- =========================================================
create table if not exists public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nome        text,
  papel       text not null default 'editor' check (papel in ('admin', 'editor')),
  permissoes  text[] not null default '{}',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Helpers (security definer → leem perfis sem cair na própria RLS,
-- evitando recursão nas policies)
-- =========================================================
create or replace function public.eh_admin()
  returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select papel = 'admin' from public.perfis where id = auth.uid() and ativo = true),
    false)
$$;

create or replace function public.tem_perm(chave text)
  returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((
    select papel = 'admin' or chave = any(permissoes)
    from public.perfis where id = auth.uid() and ativo = true
  ), false)
$$;

-- =========================================================
-- Guarda anti-escalonamento de privilégio
-- (admin pode tudo; um editor com permissão 'usuarios' gerencia apenas
--  outros editores comuns, nunca cria/edita admin nem se eleva)
-- =========================================================
create or replace function public.perfis_guard()
  returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  -- admin logado OU contexto backend (service_role / SQL direto, sem JWT de usuário)
  -- passam direto; a trava existe para impedir ESCALONAMENTO por editor autenticado.
  if public.eh_admin() or auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.papel = 'admin' then
      raise exception 'Apenas um admin pode criar ou definir outro administrador.';
    end if;
    if 'usuarios' = any(new.permissoes) then
      raise exception 'Apenas um admin pode conceder a permissão de usuários.';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.papel = 'admin' then
    raise exception 'Apenas um admin pode editar um administrador.';
  end if;
  if tg_op = 'DELETE' and old.papel = 'admin' then
    raise exception 'Apenas um admin pode remover um administrador.';
  end if;

  -- ninguém altera o próprio papel/permissões
  if tg_op = 'UPDATE' and new.id = auth.uid()
     and (new.papel is distinct from old.papel
          or new.permissoes is distinct from old.permissoes) then
    raise exception 'Você não pode alterar seu próprio papel ou permissões.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists trg_perfis_guard on public.perfis;
create trigger trg_perfis_guard
  before insert or update or delete on public.perfis
  for each row execute function public.perfis_guard();

-- =========================================================
-- RLS dos perfis
-- =========================================================
alter table public.perfis enable row level security;

-- leitura: o próprio perfil (para o painel saber o que liberar) ou quem gere usuários
drop policy if exists "perfis: leitura" on public.perfis;
create policy "perfis: leitura" on public.perfis
  for select to authenticated
  using (id = auth.uid() or public.tem_perm('usuarios'));

-- escrita: só quem tem a permissão 'usuarios' (a guarda acima impede escalonamento)
drop policy if exists "perfis: insere" on public.perfis;
create policy "perfis: insere" on public.perfis
  for insert to authenticated
  with check (public.tem_perm('usuarios'));

drop policy if exists "perfis: atualiza" on public.perfis;
create policy "perfis: atualiza" on public.perfis
  for update to authenticated
  using (public.tem_perm('usuarios'))
  with check (public.tem_perm('usuarios'));

drop policy if exists "perfis: remove" on public.perfis;
create policy "perfis: remove" on public.perfis
  for delete to authenticated
  using (public.tem_perm('usuarios'));

-- =========================================================
-- Catálogo: troca a escrita "qualquer autenticado" pela escrita POR PERMISSÃO
-- =========================================================

-- produtos
drop policy if exists "admin escreve produtos" on public.produtos;
drop policy if exists "produtos: escrita por permissao" on public.produtos;
create policy "produtos: escrita por permissao" on public.produtos
  for all to authenticated
  using (public.tem_perm('produtos'))
  with check (public.tem_perm('produtos'));

-- produto_imagens (ligadas à permissão de produtos)
drop policy if exists "admin escreve imagens" on public.produto_imagens;
drop policy if exists "imagens: escrita por permissao" on public.produto_imagens;
create policy "imagens: escrita por permissao" on public.produto_imagens
  for all to authenticated
  using (public.tem_perm('produtos'))
  with check (public.tem_perm('produtos'));

-- categorias
drop policy if exists "admin escreve categorias" on public.categorias;
drop policy if exists "categorias: escrita por permissao" on public.categorias;
create policy "categorias: escrita por permissao" on public.categorias
  for all to authenticated
  using (public.tem_perm('categorias'))
  with check (public.tem_perm('categorias'));

-- banners
drop policy if exists "admin escreve banners" on public.banners;
drop policy if exists "banners: escrita por permissao" on public.banners;
create policy "banners: escrita por permissao" on public.banners
  for all to authenticated
  using (public.tem_perm('banners'))
  with check (public.tem_perm('banners'));

-- =========================================================
-- Storage: uploads passam a exigir a permissão correspondente
-- =========================================================
drop policy if exists "admin escreve bucket produtos" on storage.objects;
drop policy if exists "bucket produtos: escrita por permissao" on storage.objects;
create policy "bucket produtos: escrita por permissao" on storage.objects
  for all to authenticated
  using (bucket_id = 'produtos' and public.tem_perm('produtos'))
  with check (bucket_id = 'produtos' and public.tem_perm('produtos'));

drop policy if exists "admin escreve bucket banners" on storage.objects;
drop policy if exists "bucket banners: escrita por permissao" on storage.objects;
create policy "bucket banners: escrita por permissao" on storage.objects
  for all to authenticated
  using (bucket_id = 'banners' and public.tem_perm('banners'))
  with check (bucket_id = 'banners' and public.tem_perm('banners'));

-- =========================================================
-- Seed — promove o usuário de teste a admin
-- (precisa que ele já exista em auth.users; ajuste o e-mail se necessário)
-- =========================================================
insert into public.perfis (id, email, nome, papel, permissoes, ativo)
select id, email, 'Administrador', 'admin', '{}', true
from auth.users
where email = 'admin@starkstrong.com.br'
on conflict (id) do update set papel = 'admin', ativo = true;
