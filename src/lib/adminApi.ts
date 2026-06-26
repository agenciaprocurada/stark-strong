/* Stark Strong — camada de escrita/leitura do painel /admin (client-side).
   Usa o cliente anon (supabase). Após o login, o token de sessão acompanha
   cada request e as policies RLS de "authenticated" liberam a escrita. */
import { supabase } from './supabase';
import type { Produto, Categoria, ProdutoImagem, Banner, BannerLinhaTitulo } from './supabase';

export type { Produto, Categoria, ProdutoImagem, Banner, BannerLinhaTitulo };

/* ---------- helpers ---------- */
export function slugify(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acentos
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/* ---------- contadores (dashboard) ---------- */
export async function getCounts() {
  const [prodAll, prodAtivos, prodDestaque, cats, bannersAtivos] = await Promise.all([
    supabase.from('produtos').select('id', { count: 'exact', head: true }),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('destaque', true),
    supabase.from('categorias').select('id', { count: 'exact', head: true }),
    supabase.from('banners').select('id', { count: 'exact', head: true }).eq('ativo', true),
  ]);
  return {
    produtos: prodAll.count ?? 0,
    ativos: prodAtivos.count ?? 0,
    destaques: prodDestaque.count ?? 0,
    categorias: cats.count ?? 0,
    banners: bannersAtivos.count ?? 0,
  };
}

/* ---------- categorias ---------- */
export async function listCategorias(): Promise<Categoria[]> {
  return check(await supabase.from('categorias').select('*').order('ordem').order('nome')) ?? [];
}

export async function createCategoria(data: { nome: string; slug?: string; ordem?: number }) {
  const slug = data.slug?.trim() || slugify(data.nome);
  return check(await supabase.from('categorias').insert({ nome: data.nome.trim(), slug, ordem: data.ordem ?? 0 }).select().single());
}

export async function updateCategoria(id: number, data: Partial<Pick<Categoria, 'nome' | 'slug' | 'ordem'>>) {
  return check(await supabase.from('categorias').update(data).eq('id', id).select().single());
}

export async function deleteCategoria(id: number) {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------- produtos ---------- */
export type ProdutoRow = Produto & { categorias: { nome: string } | null };

export async function listProdutos(): Promise<ProdutoRow[]> {
  return check(await supabase.from('produtos').select('*, categorias(nome)').order('id', { ascending: false })) ?? [];
}

export async function getProduto(id: number): Promise<Produto> {
  return check(await supabase.from('produtos').select('*').eq('id', id).single());
}

export type ProdutoInput = {
  nome: string;
  slug?: string;
  ref?: string | null;
  categoria_id: number;
  preco?: string;
  especificacoes?: string | null;
  descricao?: string | null;
  imagem_principal?: string | null;
  ativo?: boolean;
  destaque?: boolean;
};

export async function createProduto(input: ProdutoInput): Promise<Produto> {
  const slug = input.slug?.trim() || slugify(input.nome);
  return check(await supabase.from('produtos').insert({ ...input, slug, preco: input.preco || 'Consultar' }).select().single());
}

export async function updateProduto(id: number, input: Partial<ProdutoInput>): Promise<Produto> {
  return check(await supabase.from('produtos').update(input).eq('id', id).select().single());
}

export async function deleteProduto(id: number) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------- imagens do produto ---------- */
export async function listImagens(produtoId: number): Promise<ProdutoImagem[]> {
  return check(await supabase.from('produto_imagens').select('*').eq('produto_id', produtoId).order('ordem')) ?? [];
}

export async function addImagem(produtoId: number, arquivo: string, ordem: number) {
  return check(await supabase.from('produto_imagens').insert({ produto_id: produtoId, arquivo, ordem }).select().single());
}

export async function removeImagem(id: number) {
  const { error } = await supabase.from('produto_imagens').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Sobe um arquivo para um bucket público e devolve a URL pública. */
export async function uploadImagem(file: File, bucket = 'produtos'): Promise<string> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${slugify(file.name.replace(/\.[^.]+$/, '')) || 'img'}-${stamp()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- banners (carrossel da home) ---------- */
export async function listBanners(): Promise<Banner[]> {
  return check(await supabase.from('banners').select('*').order('ordem').order('id')) ?? [];
}

export async function getBanner(id: number): Promise<Banner> {
  return check(await supabase.from('banners').select('*').eq('id', id).single());
}

export type BannerInput = {
  ordem?: number;
  ativo?: boolean;
  eyebrow?: string | null;
  titulo: BannerLinhaTitulo[];
  lead?: string | null;
  imagem?: string | null;
  botao1_texto?: string | null;
  botao1_link?: string;
  botao2_texto?: string | null;
  botao2_link?: string;
};

export async function createBanner(input: BannerInput): Promise<Banner> {
  return check(await supabase.from('banners').insert(input).select().single());
}

export async function updateBanner(id: number, input: Partial<BannerInput>): Promise<Banner> {
  return check(await supabase.from('banners').update(input).eq('id', id).select().single());
}

export async function deleteBanner(id: number) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* id curto e único o suficiente para nome de arquivo, sem depender de Date global */
function stamp(): string {
  return Math.random().toString(36).slice(2, 9);
}
