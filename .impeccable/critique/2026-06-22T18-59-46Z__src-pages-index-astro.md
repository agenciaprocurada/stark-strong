---
target: o site (home + PDP)
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-06-22T18-59-46Z
slug: src-pages-index-astro
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toast + badge + estados do drawer são bons; faltam estados de loading/sucesso persistente |
| 2 | Match System / Real World | 3 | Linguagem natural; mas a nav de categorias e a busca prometem função que não existe |
| 3 | User Control and Freedom | 3 | Esc/overlay/voltar/steppers ok; "enviar" limpa o orçamento sem confirmação nem recibo |
| 4 | Consistency and Standards | 3 | DS forte e coeso; nav-links vs chips de filtro divergem |
| 5 | Error Prevention | 2 | Só validação nativa; nenhum confirm antes de limpar a lista inteira |
| 6 | Recognition Rather Than Recall | 3 | Catálogo visível, breadcrumb na PDP, ícones rotulados |
| 7 | Flexibility and Efficiency | 2 | Sem atalhos, sem quantidade na PDP, busca morta |
| 8 | Aesthetic and Minimalist Design | 3 | Visual premium e comprometido; blocos-placeholder (blog/parceiros) baixam o nível |
| 9 | Error Recovery | 2 | Mensagens de erro nativas (bolhas genéricas), não inline |
| 10 | Help and Documentation | 2 | Telefone/contato existem; links de ajuda do rodapé não levam a lugar nenhum |
| **Total** | | **26/40** | **Aceitável — boa base, melhorias significativas antes de ir ao ar** |

## Anti-Patterns Verdict

**LLM assessment:** NÃO grita "feito por IA" no visual — o sistema é comprometido e distinto (preto/grafite + dourado, League Spartan caixa-alta, motivo de costura diagonal + regra dourada). Isso já passa o teste de slop de marca. Os tells são de *gramática*, não de estética: (1) eyebrow minúsculo em caixa-alta em TODA seção ("Catálogo · 2025", "Conteúdo", "Newsletter", "Sobre o equipamento", "Ficha técnica", "Mesma linha") — exatamente o "kicker repetido como gramática de seção" que o registro de marca proíbe; (2) blocos coloridos onde deveriam estar fotos (blog e parceiros); (3) grids de cards idênticos.

**Deterministic scan:** detector quase limpo — 1 aviso: excesso de travessões (5 em-dashes) na copy do `BaseLayout.astro`. É a meta description (não é corpo visível), impacto baixo, mas vale trocar por vírgulas/pontos. Nenhuma side-stripe border, nenhum gradient-text, nenhum glassmorphism detectado — bom.

**Visual overlays:** indisponível neste ambiente (sem automação de browser). Review feito por código + build estático validado.

## Overall Impression
O site tem uma identidade real e bem executada — não é template genérico. O problema não é beleza, é **confiança**: vários controles parecem funcionais mas são decorativos (busca, conta, favoritos, links de categoria/rodapé). Para um comprador B2B avaliando um fornecedor de máquinas, UI que "finge funcionar" mina a promessa de marca "premium e confiável". A maior oportunidade: tornar real (ou remover) o que está falso, e dar imagem de verdade aos equipamentos.

## What's Working
- **Sistema visual comprometido e on-brand.** Regra dourada + costura diagonal são um motivo de verdade, não decoração aleatória. Foge do bege-AI-slop.
- **Tradução do modelo "por orçamento".** "Sob orçamento" no lugar do preço, toast de confirmação, drawer com fluxo lista → formulário → sucesso. Coerente.
- **PDP bem estruturada.** Breadcrumb, galeria com miniaturas, chips de spec e ficha técnica organizada dão hierarquia clara.

## Priority Issues

- **[P1] Controles decorativos quebram a confiança.** A busca do header (`onsubmit return false`), os botões Conta/Favoritos, o coração de favoritar nos cards e os links de categoria (todos apontam para `#produtos`) não fazem nada. Vários links do rodapé idem.
  - **Why:** o comprador testa a interface; quando a busca não busca e o favorito não favorita, a leitura é "site inacabado", não "premium". Persona Riley/Marcelo abandona.
  - **Fix:** ou implementar o mínimo (busca filtra o grid; favoritos via localStorage; nav de categoria realmente filtra), ou remover o que não funciona. Não deixar isca morta.

- **[P1] Drawer de orçamento inacessível por leitor de tela.** `aria-hidden="true"` é estático e nunca é alternado pelo JS (só troca classes `is-open`). Não há gerência de foco ao abrir.
  - **Why:** o fluxo principal de conversão fica invisível/inutilizável para teclado e leitor de tela (persona Sam). É o caminho que gera o lead.
  - **Fix:** alternar `aria-hidden`/`inert` ao abrir/fechar, mover o foco para dentro do drawer, prender o foco (focus trap) e devolver ao gatilho ao fechar.

- **[P1] Imagem-placeholder onde a foto vende.** Blog usa blocos listrados com texto "blog-01.jpg"; parceiros são nomes em texto. Numa marca em que o equipamento É o argumento, bloco colorido no lugar de foto é falha de registro.
  - **Why:** marca depende de imagem; placeholder lê como incompleto, não como minimalismo.
  - **Fix:** fotos reais dos equipamentos/instalações (ou logos reais dos parceiros). Uma foto decisiva > cinco medianas.

- **[P2] Eyebrow em caixa-alta em toda seção = gramática de IA.** O kicker repetido vira andaime previsível.
  - **Why:** é o tell que mais aproxima o site do "feito por IA".
  - **Fix:** variar a cadência — usar o kicker em 1 seção âncora e deixar as outras respirarem só com o título, ou trocar por numeração só onde há sequência real (a ficha/processo).

- **[P2] "Enviar" apaga o orçamento inteiro sem rede de segurança.** Após o sucesso, a lista é zerada (`save([])`), sem confirmação, sem recibo, sem opção de revisar/baixar.
  - **Why:** se o usuário fechar, perdeu tudo o que montou; nenhum registro de que pediu.
  - **Fix:** mostrar resumo do que foi enviado na tela de sucesso, oferecer "copiar lista"/WhatsApp, e idealmente confirmar antes de limpar.

## Persona Red Flags

**Jordan (Primeira vez):** clica numa categoria do menu esperando filtrar e cai na vitrine inteira (todas vão para `#produtos`); digita na busca e nada acontece — sem feedback de "ainda não disponível". Sai sem entender se o site funciona.

**Riley (Stress tester):** descobre em 20s que busca, conta, favoritos e metade do rodapé são fachada. Submete o formulário do orçamento com e-mail inválido e recebe a bolha nativa do browser (genérica). Recarrega após enviar: lista sumiu, sem recibo.

**Casey (Mobile, uma mão):** no header, as ações (Conta/Favoritos/Orçamento) ficam no topo, fora da zona do polegar; sem busca no mobile (`.hm-search{display:none}`) e sem nav de categoria (`.hm-cats{display:none}`) — a descoberta no celular fica só na rolagem.

**Marcelo (Dono de academia, comprador B2B — persona do projeto):** quer comparar capacidade de carga, dimensões e garantia entre máquinas. A PDP do Hack 45 entrega isso bem, mas os outros 7 produtos não têm ficha — então a comparação trava. Quer enviar o orçamento e ter um comprovante; hoje não recebe nenhum.

## Minor Observations
- Travessões em excesso na meta description (`BaseLayout.astro`).
- Placeholder `--color-stone-400` (#8A857C) em fundo claro fica abaixo de 4.5:1 — texto de placeholder/notas pequenas perde legibilidade. [Provável]
- Só a PDP do Hack 45 tem conteúdo rico; as demais renderizam página vazia de specs (esconde seções, mas o catálogo fica desigual).
- Sem `:focus-visible` reforçado nos cards interativos navegáveis por teclado (o card é `div`, não link/botão — não é focável).

## Questions to Consider
- E se a busca filtrasse o grid de verdade em 10 linhas de JS, em vez de ser fachada?
- A home precisa de blog + newsletter + parceiros nesta fase, ou isso dilui o foco em "solicitar orçamento"?
- Como seria a versão *confiante* da tela de sucesso — que faz o comprador sentir que o pedido realmente saiu?
