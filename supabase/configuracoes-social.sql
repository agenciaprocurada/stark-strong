-- Stark Strong — redes sociais nas configurações do site.
-- Adiciona instagram, youtube e whatsapp_url (link completo). Idempotente.
-- Rode depois de configuracoes.sql.

alter table public.configuracoes
  add column if not exists instagram    text,
  add column if not exists youtube      text,
  add column if not exists whatsapp_url text;  -- link completo do WhatsApp (mensagem pré-pronta)

-- valores reais (coalesce: não sobrescreve edição futura feita pelo admin)
update public.configuracoes set
  instagram    = coalesce(instagram,    'https://www.instagram.com/starkstrong.br/'),
  youtube      = coalesce(youtube,      'https://www.youtube.com/@STARKSTRONG'),
  whatsapp_url = coalesce(whatsapp_url, 'https://api.whatsapp.com/send/?phone=5545991036748&text=Ol%C3%A1%21+Vim+pela+loja+online+e+gostaria+de+atendimento.&type=phone_number&app_absent=0')
where id = 1;
