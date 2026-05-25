/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Command Palette (Phase P4)
   src/js/commandPalette.js · Ctrl+K / Cmd+K
══════════════════════════════════════════════════════════════ */

import { SYMBOL_LIST } from '../utils/symbolRegistry.js';
import { setFlowMode } from './shellState.js';
import { openAiDrawer, closeAiDrawer } from './aiDrawer.js';
import { playSoftConfirm } from './soundDesign.js';

let mount = null;
let input = null;
let list = null;
let open = false;
let items = [];
let activeIdx = 0;

const STATIC = [
  { type: 'page', label: 'Accueil — Cockpit', query: 'accueil home', href: 'index.html' },
  { type: 'page', label: 'Terminal d\'analyse', query: 'terminal analyse stock', href: 'stock.html' },
  { type: 'page', label: 'Comparer deux symboles', query: 'compare comparer', href: 'compare.html' },
  { type: 'action', label: 'Activer le mode Flow', query: 'flow on flow mode', run: () => setFlowMode(true) },
  { type: 'action', label: 'Désactiver le mode Flow', query: 'flow off', run: () => setFlowMode(false) },
  { type: 'action', label: 'Ouvrir TickerAI', query: 'ai open tickerai', run: () => openAiDrawer() },
  { type: 'action', label: 'Fermer TickerAI', query: 'ai close', run: () => closeAiDrawer() },
];

function fuzzyScore(query, text) {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 65;

  let qi = 0;
  let score = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += 12;
      qi++;
    }
  }
  return qi === q.length ? 28 + score : 0;
}

function buildSymbolItems() {
  return SYMBOL_LIST.map(s => ({
    type: 'symbol',
    label: `${s.sym} — ${s.name}`,
    sub: s.exchange,
    query: `${s.sym} ${s.name} ${s.exchange} ${s.sector}`.toLowerCase(),
    sym: s.sym,
  }));
}

function parseCompareQuery(raw) {
  const m = raw.trim().match(/^compare\s+(\S+)\s+(?:vs\s+)?(\S+)$/i);
  if (!m) return null;
  return { symA: m[1].toUpperCase(), symB: m[2].toUpperCase() };
}

function resolveQuery(raw) {
  const q = raw.trim();
  if (!q) return STATIC.slice(0, 6);

  const compare = parseCompareQuery(q);
  if (compare) {
    return [{
      type: 'compare',
      label: `Comparer ${compare.symA} vs ${compare.symB}`,
      sub: 'compare.html',
      query: q,
      symA: compare.symA,
      symB: compare.symB,
      score: 200,
    }];
  }

  const pool = [
    ...STATIC.map(x => ({ ...x, score: fuzzyScore(q, x.query + ' ' + x.label) })),
    ...buildSymbolItems().map(x => ({ ...x, score: fuzzyScore(q, x.query) })),
  ];

  return pool
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderList() {
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `<div class="cmd-palette__empty">Aucun résultat</div>`;
    return;
  }

  list.innerHTML = items.map((item, i) => {
    const tag = item.type === 'symbol' ? 'SYM'
      : item.type === 'compare' ? 'VS'
        : item.type === 'action' ? 'ACT'
          : 'NAV';
    return `
      <button
        type="button"
        class="cmd-palette__item${i === activeIdx ? ' is-active' : ''}"
        data-idx="${i}"
        role="option"
        aria-selected="${i === activeIdx}"
      >
        <span class="cmd-palette__tag cmd-palette__tag--${item.type}">${tag}</span>
        <span class="cmd-palette__item-text">
          <span class="cmd-palette__item-label">${esc(item.label)}</span>
          ${item.sub ? `<span class="cmd-palette__item-sub">${esc(item.sub)}</span>` : ''}
        </span>
        <span class="cmd-palette__item-hint">↵</span>
      </button>
    `;
  }).join('');

  list.querySelectorAll('.cmd-palette__item').forEach(el => {
    el.addEventListener('click', () => {
      activeIdx = parseInt(el.dataset.idx, 10);
      executeActive();
    });
    el.addEventListener('mouseenter', () => {
      activeIdx = parseInt(el.dataset.idx, 10);
      renderList();
    });
  });
}

function executeItem(item) {
  if (!item) return;

  if (item.type === 'symbol') {
    window.location.href = `stock.html?sym=${encodeURIComponent(item.sym)}`;
    return;
  }
  if (item.type === 'compare') {
    window.location.href = `compare.html?symA=${encodeURIComponent(item.symA)}&symB=${encodeURIComponent(item.symB)}`;
    return;
  }
  if (item.type === 'page' && item.href) {
    window.location.href = item.href;
    return;
  }
  if (item.type === 'action' && item.run) {
    item.run();
    closeCommandPalette();
  }
}

function executeActive() {
  executeItem(items[activeIdx]);
  if (items[activeIdx]?.type !== 'action') closeCommandPalette();
}

function onInput() {
  items = resolveQuery(input.value);
  activeIdx = 0;
  renderList();
}

function ensureMount() {
  if (mount) return;

  mount = document.createElement('div');
  mount.className = 'cmd-palette';
  mount.id = 'cmd-palette';
  mount.setAttribute('aria-hidden', 'true');
  mount.innerHTML = `
    <div class="cmd-palette__backdrop" data-cmd-close tabindex="-1"></div>
    <div class="cmd-palette__dialog" role="dialog" aria-modal="true" aria-label="Palette de commandes">
      <div class="cmd-palette__input-wrap">
        <span class="cmd-palette__icon" aria-hidden="true">⌕</span>
        <input
          type="text"
          class="cmd-palette__input"
          id="cmd-palette-input"
          placeholder="Symbole, compare AAPL NVDA, flow on…"
          autocomplete="off"
          spellcheck="false"
          aria-autocomplete="list"
          aria-controls="cmd-palette-list"
        >
        <kbd class="cmd-palette__kbd">ESC</kbd>
      </div>
      <div class="cmd-palette__list" id="cmd-palette-list" role="listbox"></div>
      <div class="cmd-palette__footer">
        <span>↑↓ naviguer</span>
        <span>↵ ouvrir</span>
        <span>esc fermer</span>
      </div>
    </div>
  `;

  document.body.appendChild(mount);

  input = mount.querySelector('#cmd-palette-input');
  list = mount.querySelector('#cmd-palette-list');

  input.addEventListener('input', onInput);

  mount.querySelector('[data-cmd-close]')?.addEventListener('click', closeCommandPalette);
  mount.addEventListener('click', e => {
    if (e.target === mount.querySelector('.cmd-palette__backdrop')) closeCommandPalette();
  });
}

export function isCommandPaletteOpen() {
  return open;
}

export function openCommandPalette() {
  ensureMount();
  open = true;
  mount.classList.add('is-open');
  mount.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cmd-palette-open');
  input.value = '';
  onInput();
  requestAnimationFrame(() => input.focus());
  playSoftConfirm();
}

export function closeCommandPalette() {
  if (!mount) return;
  open = false;
  mount.classList.remove('is-open');
  mount.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cmd-palette-open');
}

export function toggleCommandPalette() {
  if (open) closeCommandPalette();
  else openCommandPalette();
}

/**
 * @param {KeyboardEvent} e
 */
export function handlePaletteKeydown(e) {
  if (!open) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeCommandPalette();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(activeIdx + 1, items.length - 1);
    renderList();
    list.querySelector('.cmd-palette__item.is-active')?.scrollIntoView({ block: 'nearest' });
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(activeIdx - 1, 0);
    renderList();
    list.querySelector('.cmd-palette__item.is-active')?.scrollIntoView({ block: 'nearest' });
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    executeActive();
  }
}

export function initCommandPalette() {
  ensureMount();

  document.querySelectorAll('[data-shell-cmd-palette]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      toggleCommandPalette();
    });
  });
}
