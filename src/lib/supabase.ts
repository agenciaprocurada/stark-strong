import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
export const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Cliente público — chave anon, pode ir ao browser. Só enxerga o que a RLS libera (leitura do catálogo).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Cliente isolado só para CADASTRAR usuário (signUp) sem derrubar a sessão do admin.
// storageKey próprio + persistSession:false → não toca na sessão principal.
export function supabaseSignupClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-signup-tmp' },
  });
}

// Cliente admin — service_role, NUNCA importar em código que vai ao browser.
// Use apenas em endpoints/SSR server-side.
export function supabaseAdmin() {
  const url = import.meta.env.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente — só disponível server-side.');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Tipos de usuário/permissão ----
export type Papel = 'admin' | 'editor';
export type PermKey = 'banners' | 'produtos' | 'categorias' | 'usuarios' | 'config' | 'orcamentos';

export type Perfil = {
  id: string;
  email: string;
  nome: string | null;
  papel: Papel;
  permissoes: PermKey[];
  ativo: boolean;
  created_at: string;
};

// ---- Configurações do site (singleton, id=1) ----
export type Config = {
  id: number;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  end_rua: string | null;
  end_numero: string | null;
  end_cidade: string | null;
  end_estado: string | null;
  end_cep: string | null;
  horario: string | null;
  instagram: string | null;
  youtube: string | null;
  whatsapp_url: string | null;   // link completo do WhatsApp (rede social)
  updated_at: string;
};

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

// ---- Orçamentos (CRM) ----
export type OrcamentoStatus = 'novo' | 'encaminhado' | 'enviado';
export type OrcamentoEventoTipo = 'criado' | 'status' | 'nota';

export type OrcamentoItem = {
  id: number;
  orcamento_id: number;
  produto_ref: string | null;
  nome: string;
  categoria: string | null;
  img: string | null;
  qty: number;
};

export type OrcamentoEvento = {
  id: number;
  orcamento_id: number;
  tipo: OrcamentoEventoTipo;
  descricao: string;
  autor: string | null;
  created_at: string;
};

export type Orcamento = {
  id: number;
  email: string;
  nome: string | null;
  academia: string | null;
  telefone: string | null;
  observacoes: string | null;
  status: OrcamentoStatus;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

// Linha do título do banner: texto + destaque opcional em dourado.
export type BannerLinhaTitulo = { t: string; gold?: boolean };

// Dois tipos de banner: 'editavel' (texto + foto, o clássico) e 'imagem' (peça pronta).
export type BannerTipo = 'editavel' | 'imagem';
export type BannerLargura = 'full' | 'limitado';

export type Banner = {
  id: number;
  ordem: number;
  ativo: boolean;
  tipo: BannerTipo;
  eyebrow: string | null;
  titulo: BannerLinhaTitulo[];
  lead: string | null;
  imagem: string | null;          // editável: foto de fundo · imagem: arte desktop
  imagem_mobile: string | null;   // imagem: arte mobile
  cor_fundo: string;              // imagem: cor de fundo (hex)
  largura: BannerLargura;         // imagem: 'full' (estica no desktop) | 'limitado' (tamanho real, centralizado)
  link: string | null;            // imagem: clique opcional
  botao1_texto: string | null;
  botao1_link: string;
  botao2_texto: string | null;
  botao2_link: string;
  created_at: string;
};
