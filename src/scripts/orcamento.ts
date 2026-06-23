/* Stark Strong — orçamento client-side (protótipo, sem backend).
   Itens persistem no localStorage. "Enviar" simula o pedido e mostra sucesso. */

interface QuoteItem {
  id: string;
  name: string;
  category: string;
  img: string;
  qty: number;
}

const KEY = 'ss_orcamento';

/* ---- SVGs inline (conteúdo dinâmico não passa pelo astro-icon) ---- */
const PATHS: Record<string, string> = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  check: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
};
function svg(name: string, size = 18): string {
  return `<svg class="ss-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
}

/* ---- storage ---- */
function load(): QuoteItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuoteItem[]) : [];
  } catch {
    return [];
  }
}
function save(list: QuoteItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}
function count(list = load()): number {
  return list.reduce((n, i) => n + i.qty, 0);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/* ---- DOM refs ---- */
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
const overlay = $('#oc-overlay');
const drawer = $('#oc-drawer');
const content = $('#oc-content');
const toastEl = $<HTMLElement>('#hm-toast');
let toastTimer: number | undefined;

/* ---- badge ---- */
function updateBadge(): void {
  const n = count();
  document.querySelectorAll<HTMLElement>('[data-oc-count]').forEach((el) => {
    el.textContent = String(n);
    el.hidden = n === 0;
  });
}

/* ---- toast ---- */
function toast(msg: string): void {
  if (!toastEl) return;
  toastEl.querySelector('[data-toast-msg]')!.textContent = msg;
  toastEl.classList.add('is-show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-show'), 2600);
}

/* ---- drawer open/close ---- */
function openDrawer(): void {
  renderCart();
  overlay?.classList.add('is-open');
  drawer?.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(): void {
  overlay?.classList.remove('is-open');
  drawer?.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ---- views ---- */
function renderCart(): void {
  if (!content) return;
  const list = load();
  if (list.length === 0) {
    content.innerHTML = `
      <div class="oc-body">
        <div class="oc-empty">
          ${svg('clipboard', 40)}
          <p>Seu orçamento está vazio. Adicione equipamentos pela vitrine e monte sua lista — sem compromisso.</p>
        </div>
      </div>
      <div class="oc-foot">
        <button class="ss-btn ss-btn--dark ss-btn--lg" data-oc-close>Continuar navegando</button>
      </div>`;
    return;
  }
  const items = list
    .map(
      (i) => `
    <div class="oc-item" data-row="${esc(i.id)}">
      <img class="oc-item__img" src="${esc(i.img)}" alt="${esc(i.name)}" />
      <div class="oc-item__main">
        <p class="oc-item__cat">${esc(i.category)}</p>
        <p class="oc-item__name">${esc(i.name)}</p>
        <div class="oc-item__row">
          <div class="oc-step">
            <button data-oc-dec="${esc(i.id)}" aria-label="Diminuir">${svg('minus', 16)}</button>
            <span>${i.qty}</span>
            <button data-oc-inc="${esc(i.id)}" aria-label="Aumentar">${svg('plus', 16)}</button>
          </div>
          <button class="oc-item__remove" data-oc-remove="${esc(i.id)}">${svg('trash', 14)} Remover</button>
        </div>
      </div>
    </div>`
    )
    .join('');
  content.innerHTML = `
    <div class="oc-body">${items}</div>
    <div class="oc-foot">
      <div class="oc-foot__count"><span>Itens no orçamento</span><b>${count(list)}</b></div>
      <button class="ss-btn ss-btn--primary ss-btn--lg" data-oc-checkout>Solicitar orçamento</button>
      <p class="oc-foot__note">Resposta com proposta e prazo em até 1 dia útil.</p>
    </div>`;
}

function renderForm(): void {
  if (!content) return;
  content.innerHTML = `
    <div class="oc-body">
      <form class="oc-form" id="oc-form" novalidate>
        <button type="button" class="oc-form__back" data-oc-back>${svg('back', 15)} Voltar</button>
        <h3>Dados para o <span>orçamento</span></h3>
        <div class="oc-form__grid">
          <div class="ss-field ss-field--dark oc-form__full">
            <label class="ss-field__label" for="oc-nome">Nome</label>
            <input class="ss-field__input" id="oc-nome" name="nome" required placeholder="Seu nome" />
          </div>
          <div class="ss-field ss-field--dark oc-form__full">
            <label class="ss-field__label" for="oc-academia">Academia / empresa</label>
            <input class="ss-field__input" id="oc-academia" name="academia" placeholder="Nome da academia" />
          </div>
          <div class="ss-field ss-field--dark">
            <label class="ss-field__label" for="oc-email">E-mail</label>
            <input class="ss-field__input" id="oc-email" name="email" type="email" required placeholder="seu@email.com.br" />
          </div>
          <div class="ss-field ss-field--dark">
            <label class="ss-field__label" for="oc-tel">WhatsApp</label>
            <input class="ss-field__input" id="oc-tel" name="telefone" placeholder="(11) 90000-0000" />
          </div>
          <div class="ss-field ss-field--dark oc-form__full">
            <label class="ss-field__label" for="oc-msg">Observações</label>
            <input class="ss-field__input" id="oc-msg" name="mensagem" placeholder="Cidade, prazo, projeto..." />
          </div>
        </div>
      </form>
    </div>
    <div class="oc-foot">
      <button class="ss-btn ss-btn--primary ss-btn--lg" type="submit" form="oc-form">Enviar pedido de orçamento</button>
      <p class="oc-foot__note">Protótipo — nenhum dado é enviado a um servidor.</p>
    </div>`;
}

function renderSuccess(): void {
  if (!content) return;
  content.innerHTML = `
    <div class="oc-success">
      ${svg('check', 56)}
      <h3>Pedido <span>enviado</span></h3>
      <p>Recebemos sua lista. Um especialista Stark Strong retorna com proposta e prazo em até 1 dia útil.</p>
      <button class="ss-btn ss-btn--dark ss-btn--lg" data-oc-close>Fechar</button>
    </div>`;
}

/* ---- mutations ---- */
function addItem(data: { id: string; name: string; category: string; img: string }): void {
  const list = load();
  const found = list.find((i) => i.id === data.id);
  if (found) found.qty += 1;
  else list.push({ ...data, qty: 1 });
  save(list);
  updateBadge();
  toast(`${data.name} adicionado ao orçamento`);
}
function changeQty(id: string, delta: number): void {
  let list = load();
  const it = list.find((i) => i.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) list = list.filter((i) => i.id !== id);
  save(list);
  updateBadge();
  renderCart();
}
function removeItem(id: string): void {
  save(load().filter((i) => i.id !== id));
  updateBadge();
  renderCart();
}

/* ---- events ---- */
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>(
    '[data-add-orcamento],[data-oc-open],[data-oc-close],[data-oc-dec],[data-oc-inc],[data-oc-remove],[data-oc-checkout],[data-oc-back]'
  );
  if (!t) return;

  if (t.hasAttribute('data-add-orcamento')) {
    addItem({
      id: t.dataset.id!,
      name: t.dataset.name!,
      category: t.dataset.cat || '',
      img: t.dataset.img || '',
    });
  } else if (t.hasAttribute('data-oc-open')) {
    e.preventDefault();
    openDrawer();
  } else if (t.hasAttribute('data-oc-close')) {
    closeDrawer();
  } else if (t.hasAttribute('data-oc-dec')) {
    changeQty(t.dataset.ocDec!, -1);
  } else if (t.hasAttribute('data-oc-inc')) {
    changeQty(t.dataset.ocInc!, 1);
  } else if (t.hasAttribute('data-oc-remove')) {
    removeItem(t.dataset.ocRemove!);
  } else if (t.hasAttribute('data-oc-checkout')) {
    renderForm();
  } else if (t.hasAttribute('data-oc-back')) {
    renderCart();
  }
});

overlay?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id !== 'oc-form') return;
  e.preventDefault();
  if (!form.reportValidity()) return;
  save([]); // limpa o orçamento após "enviar"
  updateBadge();
  renderSuccess();
});

/* init */
updateBadge();
