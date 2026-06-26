import { createClient } from '@supabase/supabase-js';

// Cliente público — chave anon, pode ir ao browser. Só enxerga o que a RLS libera (leitura do catálogo).
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);

// Cliente admin — service_role, NUNCA importar em código que vai ao browser.
// Use apenas em endpoints/SSR server-side.
export function supabaseAdmin() {
  const url = import.meta.env.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente — só disponível server-side.');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Tipos do catálogo ----
export type Categoria = {
  id: number;
  slug: string;
  nome: string;
  ordem: number;
};

export type ProdutoImagem = {
  id: number;
  produto_id: number;
  arquivo: string;
  ordem: number;
};

export type Produto = {
  id: number;
  ref: string | null;
  slug: string;
  nome: string;
  categoria_id: number;
  preco: string;
  especificacoes: string | null;
  descricao: string | null;
  imagem_principal: string | null;
  url_origem: string | null;
  ativo: boolean;
  created_at: string;
};

// Linha do título do banner: texto + destaque opcional em dourado.
export type BannerLinhaTitulo = { t: string; gold?: boolean };

export type Banner = {
  id: number;
  ordem: number;
  ativo: boolean;
  eyebrow: string | null;
  titulo: BannerLinhaTitulo[];
  lead: string | null;
  imagem: string | null;
  botao1_texto: string | null;
  botao1_link: string;
  botao2_texto: string | null;
  botao2_link: string;
  created_at: string;
};
