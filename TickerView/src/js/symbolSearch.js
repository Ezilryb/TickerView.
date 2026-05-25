/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Symbol Search
   src/js/symbolSearch.js
══════════════════════════════════════════════════════════════ */

import { SYMBOL_LIST } from '../utils/symbolRegistry.js';

/**
 * @param {string} q
 */
function searchSymbols(q) {
  const ql = q.toLowerCase().trim();
  if (!ql) return [];
  return SYMBOL_LIST.filter(s =>
    s.sym.toLowerCase().includes(ql) ||
    s.name.toLowerCase().includes(ql) ||
    s.exchange.toLowerCase().includes(ql) ||
    s.sector.toLowerCase().includes(ql)
  ).slice(0, 8);
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Champ de recherche réutilisable (terminal ou compare).
 * @param {{ input: HTMLInputElement, dropdown: HTMLElement, wrap?: HTMLElement, onPick: (sym: object) => void }} cfg
 */
export function bindSymbolSearchField(cfg) {
  const { input, dropdown, wrap, onPick } = cfg;
  if (!input || !dropdown) return;

  let selectedIdx = -1;
  let filtered = [];

  function hideDropdown() {
    dropdown.classList.add('hidden');
    selectedIdx = -1;
  }

  function pick(idx) {
    const s = filtered[idx];
    if (!s) return;
    hideDropdown();
    onPick(s);
  }

  function renderDropdown(items) {
    selectedIdx = -1;
    if (!items.length) {
      dropdown.innerHTML = `<div class="sym-search-no-result">Aucun résultat pour « ${escHtml(input.value)} »</div>`;
      dropdown.classList.remove('hidden');
      return;
    }
    dropdown.innerHTML = items.map((s, i) => `
      <div class="sym-search-item" role="option" data-idx="${i}" tabindex="-1">
        <span class="sym-search-sym">${s.sym}</span>
        <span class="sym-search-name">${s.name}</span>
        <span class="sym-search-exchange">${s.exchange}</span>
      </div>
    `).join('');
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.sym-search-item').forEach(el => {
      el.addEventListener('click', () => pick(parseInt(el.dataset.idx, 10)));
      el.addEventListener('mouseenter', () => {
        dropdown.querySelectorAll('.sym-search-item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        selectedIdx = parseInt(el.dataset.idx, 10);
      });
    });
  }

  input.addEventListener('input', () => {
    filtered = searchSymbols(input.value);
    if (!input.value.trim()) {
      hideDropdown();
      return;
    }
    renderDropdown(filtered);
  });

  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.sym-search-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1);
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
      items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
      items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0) {
        pick(selectedIdx);
        return;
      }
      if (filtered.length) pick(0);
    } else if (e.key === 'Escape') {
      hideDropdown();
      input.blur();
    }
  });

  document.addEventListener('click', e => {
    const container = wrap || input.closest('.sym-search-wrap');
    if (container && !container.contains(e.target)) hideDropdown();
  });

  return { hideDropdown };
}

/**
 * Terminal — navigation vers stock.html?sym=
 * @param {{ inputId?: string, wrapId?: string, dropdownId?: string }} [opts]
 */
export function initSymbolSearch(opts = {}) {
  const input = document.getElementById(opts.inputId || 'sym-search-input');
  const wrap = document.getElementById(opts.wrapId || 'sym-search-wrap');
  const dropdown = document.getElementById(opts.dropdownId || 'sym-search-dropdown');
  if (!input || !dropdown) return;

  bindSymbolSearchField({
    input,
    dropdown,
    wrap,
    onPick: s => {
      window.location.href = `stock.html?sym=${encodeURIComponent(s.sym)}`;
    },
  });

  const urlSym = new URLSearchParams(window.location.search).get('sym');
  if (urlSym) input.value = urlSym;
}

/**
 * Compare — callback local sans rechargement.
 * @param {{ onPickA: (sym: object) => void, onPickB: (sym: object) => void }} handlers
 */
export function initCompareSymbolSearch(handlers) {
  bindSymbolSearchField({
    input: document.getElementById('search-input-a'),
    dropdown: document.getElementById('search-dropdown-a'),
    wrap: document.getElementById('sym-search-wrap-a'),
    onPick: handlers.onPickA,
  });

  bindSymbolSearchField({
    input: document.getElementById('search-input-b'),
    dropdown: document.getElementById('search-dropdown-b'),
    wrap: document.getElementById('sym-search-wrap-b'),
    onPick: handlers.onPickB,
  });
}
