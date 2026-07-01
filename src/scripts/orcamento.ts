/* Stark Strong — mini-carrinho do orçamento (drawer + badge).
   Itens persistem no localStorage. A revisão e o envio acontecem em /orcamento. */

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
      <a class="ss-btn ss-btn--primary ss-btn--lg" href="/orcamento">Revisar e solicitar</a>
      <p class="oc-foot__note">Resposta com proposta e prazo em até 1 dia útil.</p>
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
    '[data-add-orcamento],[data-oc-open],[data-oc-close],[data-oc-dec],[data-oc-inc],[data-oc-remove]'
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
  }
});

overlay?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});

/* init */
updateBadge();
