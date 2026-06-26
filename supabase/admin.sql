-- Stark Strong — permissões de ESCRITA para o painel /admin
-- O catálogo é público para leitura (ver schema.sql). Aqui liberamos
-- insert/update/delete apenas para usuários AUTENTICADOS (Supabase Auth).
-- Como o cadastro (signup) fica fechado, só o usuário admin criado no
-- painel consegue logar e, portanto, escrever.
--
-- Rode este arquivo no SQL Editor do Supabase depois do schema.sql.

-- =========================================================
-- Escrita nas tabelas do catálogo (somente authenticated)
-- =========================================================

-- categorias
drop policy if exists "admin escreve categorias" on public.categorias;
create policy "admin escreve categorias" on public.categorias
  for all
  to authenticated
  using (true)
  with check (true);

-- produtos
drop policy if exists "admin escreve produtos" on public.produtos;
create policy "admin escreve produtos" on public.produtos
  for all
  to authenticated
  using (true)
  with check (true);

-- produto_imagens
drop policy if exists "admin escreve imagens" on public.produto_imagens;
create policy "admin escreve imagens" on public.produto_imagens
  for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- Storage — bucket de imagens de produtos
-- Uploads novos vão para este bucket; a URL pública é salva em
-- produtos.imagem_principal / produto_imagens.arquivo.
-- (As imagens antigas continuam em /public/produtos no repo.)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- leitura pública das imagens do bucket
drop policy if exists "leitura publica bucket produtos" on storage.objects;
create policy "leitura publica bucket produtos" on storage.objects
  for select
  using (bucket_id = 'produtos');

-- upload/edição/remoção só para autenticados
drop policy if exists "admin escreve bucket produtos" on storage.objects;
create policy "admin escreve bucket produtos" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'produtos')
  with check (bucket_id = 'produtos');
