-- Stark Strong — banners: tipo "imagem" (desktop + mobile, cor de fundo, largura, link)
-- Migration idempotente. Rode no SQL Editor do Supabase depois de banners.sql.
-- Os banners existentes continuam como 'editavel' (comportamento atual, sem mudança).

alter table public.banners
  add column if not exists tipo          text    not null default 'editavel',  -- 'editavel' | 'imagem'
  add column if not exists imagem_mobile text,                                  -- imagem do banner-imagem no mobile
  add column if not exists cor_fundo     text    not null default '#0a0a0a',    -- fundo do banner-imagem
  add column if not exists largura       text    not null default 'full',       -- 'full' | 'limitado'
  add column if not exists link          text;                                  -- clique opcional do banner-imagem

-- trava os valores aceitos em tipo/largura
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'banners_tipo_chk') then
    alter table public.banners add constraint banners_tipo_chk check (tipo in ('editavel', 'imagem'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'banners_largura_chk') then
    alter table public.banners add constraint banners_largura_chk check (largura in ('full', 'limitado'));
  end if;
end $$;
