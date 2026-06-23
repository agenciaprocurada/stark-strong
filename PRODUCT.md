# Stark Strong — PRODUCT.md

> Gerado de forma condensada a partir do contexto do projeto (memória + código) para destravar o fluxo do Impeccable. Pode ser refinado com `/impeccable init`.

## What it is
Site estilo e-commerce de **equipamentos de musculação profissional** (máquinas para academias). Modelo de negócio: **tudo por orçamento** — sem preço público, sem carrinho de compra, sem checkout. O cliente monta uma lista de equipamentos e solicita orçamento.

## Register
**Brand** — o site é a vitrine da marca; a impressão visual É parte do produto. Mas carrega tarefas de e-commerce (catálogo, filtro, "adicionar ao orçamento", drawer), então o fluxo de orçamento exige rigor de produto.

## Audience
- **Proprietários / gestores de academias** (decisor de compra B2B): avaliam biomecânica, durabilidade, custo-benefício, suporte/instalação.
- **Frequentadores / entusiastas** (influência): qualidade e segurança do equipamento.
Contexto de uso: desktop (pesquisa de fornecedor) e mobile (descoberta).

## Brand voice
"A performance é inevitável." Premium, técnico, industrial/engenheirado. Paleta preto/grafite + dourado. League Spartan (títulos caixa-alta), Montserrat (rótulos), Inter (corpo). Estética de cantos retos, hairline e regra dourada.

## Scope / state
Protótipo visual em **Astro** estático, **sem backend**. Orçamento vive no `localStorage`; "enviar pedido" só simula sucesso. Páginas: home (`/`) e detalhe de produto (`/produto/[slug]`). Admin e persistência real ficam para fase futura.

## Success
Transmitir percepção de marca premium e conduzir o visitante a **solicitar orçamento** com o mínimo de atrito.
