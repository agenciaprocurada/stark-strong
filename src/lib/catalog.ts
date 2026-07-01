/* Stark Strong — camada de acesso ao catálogo (Supabase).
   Roda no build (frontmatter Astro, contexto server). Normaliza os
   registros do banco para o formato que os componentes da vitrine já usam. */
import { supabase } from './supabase';

export interface ViewCategory {
  slug: string;
  nome: string;
  ordem: number;
}

export interface ViewProduct {
  id: string; // = slug (chave estável p/ o orçamento)
  ref: string | null;
  slug: string;
  name: string; // exibição (Title Case)
  category: string;
  categorySlug: string;
  img: string;
  gallery: string[];
  spec: string; // linha técnica curta do card
  chips: string[]; // selos técnicos da página de detalhe
  description: string[]; // parágrafos
  specs: { label: string; value: string }[]; // ficha técnica
  destaque: boolean;
}

/* ---------- normalização de texto ---------- */
const PLACEHOLDER_IMG = '/assets/photo-machine-hero.png';
const MINUSC = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'para', 'e', 'em', 'a', 'o', 'ou', 'sem', 'no', 'na']);

function clean(s: string | null): string {
  return (s || '')
    .replace(/compartilhe:.*/is, '')
    .replace(/<!--.*$/s, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(s: string | null): string {
  return clean(s)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w, i) => {
      if (/\d/.test(w)) return w.toUpperCase(); // códigos/modelos: STK-81, 50MM
      if (i > 0 && MINUSC.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/** Extrai "C x L x A" das especificações, ex.: "1,25 × 1,60 × 1,70 m". */
function extractDims(espec: string | null): string | null {
  const m = clean(espec).match(/(\d[\d.,]*)\s*[x×]\s*(\d[\d.,]*)\s*[x×]\s*(\d[\d.,]*)\s*m\b/i);
  return m ? `${m[1]} × ${m[2]} × ${m[3]} m` : null;
}

/** Extrai um peso de bateria, se houver, ex.: "Peso Bateria 120kg". */
function extractCarga(espec: string | null): string | null {
  const m = clean(espec).match(/bateria\s*([\d.,]+\s*kg)/i);
  return m ? m[1].replace(/\s+/g, '') : null;
}

function paragraphs(desc: string | null): string[] {
  const c = clean(desc);
  if (!c) return [];
  // dá respiro antes de seções comuns que vêm coladas no texto
  const withBreaks = c.replace(/\s+(Principais Características|Benefícios|Diferenciais)\b/g, '\n$1');
  const lines = withBreaks.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    // quebra blocos muito longos em parágrafos de ~3 frases
    const sentences = line.match(/[^.!?]+[.!?]+|\S+$/g) || [line];
    for (let i = 0; i < sentences.length; i += 3) {
      out.push(sentences.slice(i, i + 3).join(' ').trim());
    }
  }
  return out;
}

/* ---------- mapeamento ---------- */
type Row = {
  ref: string | null;
  slug: string;
  nome: string;
  preco: string;
  especificacoes: string | null;
  descricao: string | null;
  imagem_principal: string | null;
  destaque: boolean;
  categorias: { nome: string; slug: string } | null;
  produto_imagens: { arquivo: string; ordem: number }[];
};

function mapProduct(r: Row): ViewProduct {
  const categoria = r.categorias?.nome ?? 'Produtos';
  const gallery = [...(r.produto_imagens || [])]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => i.arquivo);
  const img = r.imagem_principal || gallery[0] || PLACEHOLDER_IMG;

  const dims = extractDims(r.especificacoes);
  const carga = extractCarga(r.especificacoes);

  const chips: string[] = [];
  if (dims) chips.push(dims);
  if (carga) chips.push(`Bateria ${carga}`);
  if (chips.length === 0) chips.push(categoria);

  const specs: { label: string; value: string }[] = [];
  if (r.ref) specs.push({ label: 'Referência', value: r.ref });
  specs.push({ label: 'Categoria', value: categoria });
  if (dims) specs.push({ label: 'Dimensões aproximadas (C × L × A)', value: dims });
  if (carga) specs.push({ label: 'Peso da bateria', value: carga });
  specs.push({ label: 'Investimento', value: 'Sob orçamento' });

  return {
    id: r.slug,
    ref: r.ref,
    slug: r.slug,
    name: titleCase(r.nome),
    category: categoria,
    categorySlug: r.categorias?.slug ?? '',
    img,
    gallery: gallery.length ? gallery : [img],
    spec: dims ? `Dimensões ${dims}` : `${categoria} · linha profissional`,
    chips,
    description: paragraphs(r.descricao),
    specs,
    destaque: !!r.destaque,
  };
}

/* ---------- cache ----------
   No build (uma única execução) cacheamos para não repetir a query a cada
   página/componente. Em dev re-consultamos sempre, para que qualquer re-seed
   apareça na hora — sem precisar reiniciar o servidor. */
const SELECT = '*, categorias(nome,slug), produto_imagens(arquivo,ordem)';
const CACHE = !import.meta.env.DEV;
let _cats: Promise<ViewCategory[]> | null = null;
let _prods: Promise<ViewProduct[]> | null = null;

export function getCategories(): Promise<ViewCategory[]> {
  if (!_cats || !CACHE) {
    _cats = supabase
      .from('categorias')
      .select('slug,nome,ordem')
      .order('ordem')
      .then(({ data, error }) => {
        if (error) throw new Error(`Falha ao carregar categorias: ${error.message}`);
        return (data ?? []) as ViewCategory[];
      });
  }
  return _cats;
}

export function getProducts(): Promise<ViewProduct[]> {
  if (!_prods || !CACHE) {
    _prods = supabase
      .from('produtos')
      .select(SELECT)
      .eq('ativo', true)
      .order('id')
      .then(({ data, error }) => {
        if (error) throw new Error(`Falha ao carregar produtos: ${error.message}`);
        return ((data ?? []) as Row[]).map(mapProduct);
      });
  }
  return _prods;
}

export async function getProduct(slug: string): Promise<ViewProduct | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

/** Produtos em destaque para a home (máx. n). Sem destaques marcados, cai nos primeiros n. */
export async function getFeatured(n = 8): Promise<ViewProduct[]> {
  const all = await getProducts();
  const flagged = all.filter((p) => p.destaque).slice(0, n);
  return flagged.length ? flagged : all.slice(0, n);
}

export async function getRelated(p: ViewProduct, n = 3): Promise<ViewProduct[]> {
  return (await getProducts()).filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, n);
}

/* ---------- banners do carrossel da home ---------- */
export interface ViewBanner {
  tipo: 'editavel' | 'imagem';
  // editável
  eyebrow: string;
  title: { t: string; gold?: boolean }[];
  lead: string;
  img: string;
  primary: string;
  primaryHref: string;
  secondary: string;
  secondaryHref: string;
  // imagem
  imgMobile: string;
  corFundo: string;
  largura: 'full' | 'limitado';
  link: string;
}

const BANNER_COLS = 'tipo,eyebrow,titulo,lead,imagem,imagem_mobile,cor_fundo,largura,link,botao1_texto,botao1_link,botao2_texto,botao2_link';

/* ---------- configurações do site (contato, endereço, horário) ---------- */
export interface ViewConfig {
  telefone: string;
  telHref: string;       // tel:+55...
  whatsapp: string;
  whatsappDigits: string; // só dígitos com DDI 55
  whatsappHref: string;   // https://wa.me/55...
  email: string;
  emailHref: string;      // mailto:
  endRua: string;
  endNumero: string;
  endCidade: string;
  endEstado: string;
  endCep: string;
  enderecoLinha: string;  // "Rua X, 777 — Cascavel/PR · CEP 85817830"
  cidadeUf: string;       // "Cascavel · PR"
  horario: string;
  instagram: string;
  youtube: string;
  whatsappSocial: string; // link completo da rede social (cai no wa.me derivado se vazio)
}

// Defaults reais — usados se a tabela/linha não existir no build (site nunca quebra).
const CONFIG_FALLBACK = {
  telefone: '(45) 9 9926-5525',
  whatsapp: '(45) 9 9926-5525',
  email: 'vendas@starkstrong.com.br',
  end_rua: 'Rua Lagoa Ibirapuera',
  end_numero: '777',
  end_cidade: 'Cascavel',
  end_estado: 'PR',
  end_cep: '85817830',
  horario: 'Segunda a sexta das 09:00 às 17:30',
  instagram: 'https://www.instagram.com/starkstrong.br/',
  youtube: 'https://www.youtube.com/@STARKSTRONG',
  whatsapp_url: 'https://api.whatsapp.com/send/?phone=5545991036748&text=Ol%C3%A1%21+Vim+pela+loja+online+e+gostaria+de+atendimento.&type=phone_number&app_absent=0',
};

/** Só dígitos, com DDI 55 do Brasil na frente (para tel: e wa.me). */
function digitsBR(s: string): string {
  let d = (s || '').replace(/\D/g, '');
  if (!d) return '';
  if (!d.startsWith('55')) d = '55' + d;
  return d;
}

function mapConfig(c: any): ViewConfig {
  const telefone = c.telefone ?? '';
  const whatsapp = c.whatsapp ?? '';
  const email = c.email ?? '';
  const endRua = c.end_rua ?? '';
  const endNumero = c.end_numero ?? '';
  const endCidade = c.end_cidade ?? '';
  const endEstado = c.end_estado ?? '';
  const endCep = c.end_cep ?? '';
  const wd = digitsBR(whatsapp);
  const cidadeUf = [endCidade, endEstado].filter(Boolean).join(' · ');
  const ruaNum = [endRua, endNumero].filter(Boolean).join(', ');
  const enderecoLinha = [ruaNum, cidadeUf.replace(' · ', '/'), endCep ? `CEP ${endCep}` : '']
    .filter(Boolean).join(' — ');
  return {
    telefone,
    telHref: telefone ? `tel:+${digitsBR(telefone)}` : '',
    whatsapp,
    whatsappDigits: wd,
    whatsappHref: wd ? `https://wa.me/${wd}` : '',
    email,
    emailHref: email ? `mailto:${email}` : '',
    endRua, endNumero, endCidade, endEstado, endCep,
    enderecoLinha,
    cidadeUf,
    horario: c.horario ?? '',
    instagram: c.instagram ?? '',
    youtube: c.youtube ?? '',
    whatsappSocial: (c.whatsapp_url ?? '') || (wd ? `https://wa.me/${wd}` : ''),
  };
}

let _config: Promise<ViewConfig> | null = null;

export function getSiteConfig(): Promise<ViewConfig> {
  if (!_config || !CACHE) {
    _config = supabase
      .from('configuracoes')
      .select('telefone,whatsapp,email,end_rua,end_numero,end_cidade,end_estado,end_cep,horario,instagram,youtube,whatsapp_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          if (error && import.meta.env.DEV) console.warn('getSiteConfig:', error.message);
          return mapConfig(CONFIG_FALLBACK);
        }
        return mapConfig(data);
      });
  }
  return _config;
}

let _banners: Promise<ViewBanner[]> | null = null;

export function getBanners(): Promise<ViewBanner[]> {
  if (!_banners || !CACHE) {
    _banners = supabase
      .from('banners')
      .select(BANNER_COLS)
      .eq('ativo', true)
      .order('ordem')
      .then(({ data, error }) => {
        if (error) {
          // tabela/colunas ainda não existem ou falha: home usa o fallback do componente
          if (import.meta.env.DEV) console.warn('getBanners:', error.message);
          return [];
        }
        return (data ?? []).map((b: any): ViewBanner => ({
          tipo: b.tipo === 'imagem' ? 'imagem' : 'editavel',
          eyebrow: b.eyebrow ?? '',
          title: Array.isArray(b.titulo) ? b.titulo : [],
          lead: b.lead ?? '',
          img: b.imagem ?? PLACEHOLDER_IMG,
          primary: b.botao1_texto ?? 'Solicitar orçamento',
          primaryHref: b.botao1_link ?? '/produtos',
          secondary: b.botao2_texto ?? '',
          secondaryHref: b.botao2_link ?? '/produtos',
          imgMobile: b.imagem_mobile ?? b.imagem ?? PLACEHOLDER_IMG,
          corFundo: b.cor_fundo ?? '#0a0a0a',
          largura: b.largura === 'limitado' ? 'limitado' : 'full',
          link: b.link ?? '',
        }));
      });
  }
  return _banners;
}
