/* Stark Strong — catálogo (protótipo).
   Modelo "tudo por orçamento": sem preço público. Cada item carrega
   uma linha técnica (spec) no lugar do preço e entra no orçamento. */

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  img: string;
  spec: string;
  tag?: 'Mais vendido' | 'Novo' | 'Premium' | null;
  rating: number;
  reviews: number;
  /* ---- conteúdo da página de detalhe (opcional) ---- */
  tagline?: string;
  description?: string[];
  gallery?: string[];
  highlights?: { icon: string; title: string; text: string }[];
  specs?: { label: string; value: string }[];
}

export const CATEGORIES = [
  'Pernas',
  'Peito',
  'Costas',
  'Ombros',
  'Braços',
  'Cabos',
  'Acessórios',
] as const;

/** Filtros da vitrine (inclui "Todos"). */
export const FILTERS = ['Todos', 'Pernas', 'Peito', 'Costas', 'Ombros', 'Braços', 'Cabos'] as const;

export const PRODUCTS: Product[] = [
  {
    id: 'hack-45-linear', slug: 'hack-45-linear', name: 'Hack 45° Linear', category: 'Pernas',
    img: '/assets/photo-machine-rack.png', spec: 'Guias lineares · ângulo 45° · aço estrutural',
    tag: 'Mais vendido', rating: 4.9, reviews: 132,
    tagline: 'O agachamento que respeita a sua biomecânica — e exige a sua melhor série.',
    description: [
      'O Hack 45° Linear coloca a carga no ângulo exato de 45° e a conduz por guias lineares de baixo atrito. O resultado é uma trajetória estável do início ao fim do movimento, sem desvios e sem pontos mortos — quadríceps, glúteos e posteriores trabalham com amplitude completa e segurança.',
      'Estrutura em aço estrutural, plataforma antiderrapante ampla e ombreiras acolchoadas de alta densidade. Travas de segurança de acionamento rápido permitem chegar à falha com confiança. Acabamento premium que vira referência de performance no seu salão.',
    ],
    gallery: ['/assets/photo-machine-rack.png', '/assets/photo-detail-plate.png', '/assets/photo-machine-hero.png', '/assets/photo-gym-dark.png'],
    highlights: [
      { icon: 'ruler', title: 'Ângulo de 45° fixo', text: 'Vetor de carga ideal para o quadríceps, com menor estresse lombar e máxima ativação.' },
      { icon: 'move-vertical', title: 'Guias lineares', text: 'Roldanas e trilhos de baixo atrito: movimento suave, silencioso e sem folga.' },
      { icon: 'shield-check', title: 'Travas de segurança', text: 'Acionamento rápido com a mão — chegue à falha sozinho, com total controle.' },
      { icon: 'layers', title: 'Carga em discos', text: 'Até 6 torres de discos. Progressão real para iniciantes e avançados.' },
    ],
    specs: [
      { label: 'Ângulo de trabalho', value: '45° fixo' },
      { label: 'Sistema de movimento', value: 'Guias lineares de baixo atrito' },
      { label: 'Estrutura', value: 'Aço estrutural · pintura eletrostática' },
      { label: 'Plataforma', value: 'Antiderrapante · 560 × 420 mm' },
      { label: 'Capacidade de carga', value: 'Até 500 kg em discos' },
      { label: 'Carga por discos', value: 'Olímpico Ø 50 mm · 6 torres' },
      { label: 'Dimensões (L×P×A)', value: '1.250 × 1.900 × 1.450 mm' },
      { label: 'Peso do equipamento', value: '215 kg' },
      { label: 'Garantia', value: '5 anos estrutura · 2 anos componentes' },
    ],
  },
  { id: 'leg-press-horizontal', slug: 'leg-press-horizontal', name: 'Leg Press Horizontal', category: 'Pernas', img: '/assets/photo-machine-hero.png', spec: 'Curva de resistência progressiva · alta carga', tag: null, rating: 4.8, reviews: 98 },
  { id: 'supino-articulado', slug: 'supino-articulado', name: 'Supino Articulado', category: 'Peito', img: '/assets/photo-gym-dark.png', spec: 'Convergência biomecânica · pegada ajustável', tag: null, rating: 4.7, reviews: 74 },
  { id: 'remada-unilateral', slug: 'remada-unilateral', name: 'Remada Unilateral', category: 'Costas', img: '/assets/photo-machine-rack.png', spec: 'Trabalho independente · amplitude completa', tag: 'Novo', rating: 4.9, reviews: 51 },
  { id: 'cadeira-extensora', slug: 'cadeira-extensora', name: 'Cadeira Extensora', category: 'Pernas', img: '/assets/photo-machine-hero.png', spec: 'Eixo alinhado ao joelho · encosto regulável', tag: null, rating: 4.8, reviews: 120 },
  { id: 'crossover-duplo', slug: 'crossover-duplo', name: 'Crossover Duplo', category: 'Cabos', img: '/assets/photo-gym-dark.png', spec: 'Polias duplas · roldanas de baixo atrito', tag: 'Premium', rating: 5.0, reviews: 44 },
  { id: 'desenvolvimento-ombros', slug: 'desenvolvimento-ombros', name: 'Desenvolvimento de Ombros', category: 'Ombros', img: '/assets/photo-machine-rack.png', spec: 'Trajetória guiada · apoio lombar firme', tag: null, rating: 4.7, reviews: 63 },
  { id: 'rosca-scott-articulada', slug: 'rosca-scott-articulada', name: 'Rosca Scott Articulada', category: 'Braços', img: '/assets/photo-detail-plate.png', spec: 'Apoio inclinado · resistência uniforme', tag: null, rating: 4.6, reviews: 38 },
];
