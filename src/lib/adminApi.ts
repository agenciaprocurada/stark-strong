/* Stark Strong — camada de escrita/leitura do painel /admin (client-side).
   Usa o cliente anon (supabase). Após o login, o token de sessão acompanha
   cada request e as policies RLS de "authenticated" liberam a escrita. */
import { supabase, supabaseSignupClient } from './supabase';
import type { Produto, Categoria, ProdutoImagem, Banner, BannerLinhaTitulo, BannerTipo, BannerLargura, Perfil, Papel, PermKey, Config, Orcamento, OrcamentoItem, OrcamentoEvento, OrcamentoStatus } from './supabase';

export type { Produto, Categoria, ProdutoImagem, Banner, BannerLinhaTitulo, BannerTipo, BannerLargura, Perfil, Papel, PermKey, Config, Orcamento, OrcamentoItem, OrcamentoEvento, OrcamentoStatus };

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

/** Próxima ordem (maior atual + 1) — banner novo vai pro fim da lista. */
export async function getNextBannerOrdem(): Promise<number> {
  const { data, error } = await supabase.from('banners').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.ordem ?? -1) + 1;
}

export type BannerInput = {
  ordem?: number;
  ativo?: boolean;
  tipo?: BannerTipo;
  eyebrow?: string | null;
  titulo: BannerLinhaTitulo[];
  lead?: string | null;
  imagem?: string | null;
  imagem_mobile?: string | null;
  cor_fundo?: string;
  largura?: BannerLargura;
  link?: string | null;
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

/** Persiste a nova ordem (drag-and-drop). Recebe os ids já na ordem desejada. */
export async function reorderBanners(idsInOrder: number[]): Promise<void> {
  await Promise.all(
    idsInOrder.map((id, i) =>
      supabase.from('banners').update({ ordem: i }).eq('id', id).then(({ error }) => {
        if (error) throw new Error(error.message);
      }),
    ),
  );
}

/* ---------- usuários (perfis) ---------- */
export async function listPerfis(): Promise<Perfil[]> {
  return check(await supabase.from('perfis').select('*').order('created_at', { ascending: true })) ?? [];
}

export type NovoUsuario = {
  email: string;
  password: string;
  nome?: string | null;
  papel: Papel;
  permissoes: PermKey[];
};

/** Cria o login (signUp em cliente isolado) e grava o perfil com a sessão do admin. */
export async function createUsuario(input: NovoUsuario): Promise<void> {
  const tmp = supabaseSignupClient();
  const { data, error } = await tmp.auth.signUp({ email: input.email.trim(), password: input.password });
  if (error) throw new Error(traduzCadastroErro(error.message));
  const uid = data.user?.id;
  if (!uid) throw new Error('Não foi possível criar o login (verifique se o cadastro está liberado no Supabase).');

  const permissoes = input.papel === 'admin' ? [] : input.permissoes;
  const { error: e2 } = await supabase.from('perfis').insert({
    id: uid,
    email: input.email.trim(),
    nome: input.nome?.trim() || null,
    papel: input.papel,
    permissoes,
    ativo: true,
  });
  if (e2) throw new Error(e2.message);
}

export async function updatePerfil(
  id: string,
  data: Partial<Pick<Perfil, 'nome' | 'papel' | 'permissoes' | 'ativo'>>,
): Promise<Perfil> {
  const patch = { ...data };
  if (patch.papel === 'admin') patch.permissoes = [];
  return check(await supabase.from('perfis').update(patch).eq('id', id).select().single());
}

/* ---------- configurações do site (singleton id=1) ---------- */
export type ConfigInput = Partial<Pick<Config,
  'telefone' | 'whatsapp' | 'email' | 'end_rua' | 'end_numero' | 'end_cidade' | 'end_estado' | 'end_cep' | 'horario'
  | 'instagram' | 'youtube' | 'whatsapp_url'>>;

export async function getConfig(): Promise<Config> {
  return check(await supabase.from('configuracoes').select('*').eq('id', 1).single());
}

export async function updateConfig(input: ConfigInput): Promise<Config> {
  return check(await supabase.from('configuracoes').update({ ...input, updated_at: new Date().toISOString() }).eq('id', 1).select().single());
}

/* ---------- orçamentos (CRM) ---------- */
export type OrcamentoRow = Orcamento & { itens_count: number };
export type OrcamentoDetalhe = Orcamento & { itens: OrcamentoItem[]; eventos: OrcamentoEvento[] };

const STATUS_DESC: Record<OrcamentoStatus, string> = {
  novo: 'Novo',
  encaminhado: 'Encaminhado',
  enviado: 'Enviado',
};

async function meuEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/** Lista todos os orçamentos (mais novos primeiro) com a contagem de itens. */
export async function listOrcamentos(): Promise<OrcamentoRow[]> {
  const rows = check(
    await supabase
      .from('orcamentos')
      .select('*, orcamento_itens(count)')
      .order('created_at', { ascending: false }),
  ) as (Orcamento & { orcamento_itens: { count: number }[] })[];
  return (rows ?? []).map(({ orcamento_itens, ...o }) => ({
    ...o,
    itens_count: orcamento_itens?.[0]?.count ?? 0,
  }));
}

/** Orçamento completo: cabeçalho + itens + histórico (passos). */
export async function getOrcamento(id: number): Promise<OrcamentoDetalhe> {
  const o = check(await supabase.from('orcamentos').select('*').eq('id', id).single()) as Orcamento;
  const [itens, eventos] = await Promise.all([
    supabase.from('orcamento_itens').select('*').eq('orcamento_id', id).order('id'),
    supabase.from('orcamento_eventos').select('*').eq('orcamento_id', id).order('created_at', { ascending: true }),
  ]);
  if (itens.error) throw new Error(itens.error.message);
  if (eventos.error) throw new Error(eventos.error.message);
  return { ...o, itens: (itens.data ?? []) as OrcamentoItem[], eventos: (eventos.data ?? []) as OrcamentoEvento[] };
}

/** Move o orçamento de coluna e registra o passo no histórico. */
export async function moverStatus(id: number, status: OrcamentoStatus): Promise<Orcamento> {
  const orc = check(
    await supabase.from('orcamentos').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  ) as Orcamento;
  const autor = await meuEmail();
  const { error } = await supabase.from('orcamento_eventos').insert({
    orcamento_id: id,
    tipo: 'status',
    descricao: `Movido para "${STATUS_DESC[status]}"`,
    autor,
  });
  if (error) throw new Error(error.message);
  return orc;
}

/** Salva as notas internas (campo livre estilo CRM). */
export async function salvarNotas(id: number, notas: string): Promise<Orcamento> {
  return check(
    await supabase.from('orcamentos').update({ notas: notas.trim() || null, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  ) as Orcamento;
}

/** Adiciona uma anotação ao histórico de passos. */
export async function addNota(id: number, descricao: string): Promise<OrcamentoEvento> {
  const autor = await meuEmail();
  return check(
    await supabase.from('orcamento_eventos').insert({ orcamento_id: id, tipo: 'nota', descricao: descricao.trim(), autor }).select().single(),
  ) as OrcamentoEvento;
}

export async function deleteOrcamento(id: number): Promise<void> {
  const { error } = await supabase.from('orcamentos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Quantidade de orçamentos novos (badge da sidebar). */
export async function getOrcamentosNovos(): Promise<number> {
  const { count: c } = await supabase.from('orcamentos').select('id', { count: 'exact', head: true }).eq('status', 'novo');
  return c ?? 0;
}

function traduzCadastroErro(msg: string): string {
  if (/already registered|already been registered|user.*exists/i.test(msg)) return 'Já existe um usuário com esse e-mail.';
  if (/signups? (not allowed|disabled)|not allowed for/i.test(msg)) return 'Cadastro desativado no Supabase. Ligue "Allow new users to sign up" em Authentication → Email.';
  if (/password.*at least|at least.*characters|weak password/i.test(msg)) return 'Senha muito curta (mínimo 6 caracteres).';
  return msg;
}

/* id curto e único o suficiente para nome de arquivo, sem depender de Date global */
function stamp(): string {
  return Math.random().toString(36).slice(2, 9);
}
