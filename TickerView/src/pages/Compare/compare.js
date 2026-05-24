/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Compare Page Orchestrator
   src/pages/Compare/compare.js
   Handles dual-symbol comparison: chart, metrics, live prices.
   URL: compare.html?symA=AAPL&symB=NVDA&tf=1Y
══════════════════════════════════════════════════════════════ */

import { initColorMode }                          from '../../utils/colorMode.js';
import { CompareChart }                           from '../../components/CompareChart/compareChart.js';
import { renderCompareMetrics, renderSymCard }    from '../../components/CompareMetrics/compareMetrics.js';
import {
  getSymbolData,
  generateOHLCV,
  TF_CONFIG,
  SYMBOL_LIST,
}                                                 from '../../utils/symbolRegistry.js';

/* ── 1. URL params ──────────────────────────────────────── */
const params = new URLSearchParams(window.location.search);
let symAKey  = params.get('symA') || 'AAPL';
let symBKey  = params.get('symB') || 'NVDA';
let tf       = params.get('tf')   || '1Y';

let dataA = getSymbolData(symAKey);
let dataB = getSymbolData(symBKey);

/* ── 2. Theme ───────────────────────────────────────────── */
initColorMode(document.getElementById('theme-toggle'));

/* ── 3. Chart ───────────────────────────────────────────── */
const chart = new CompareChart('compare-canvas', 'compare-overlay');

function loadChart() {
  const cfg  = TF_CONFIG[tf] || TF_CONFIG['1Y'];
  const volA = dataA.tfVol * (cfg.vol / 0.025);
  const volB = dataB.tfVol * (cfg.vol / 0.025);
  chart.load(
    generateOHLCV(cfg.bars, dataA.basePrice, volA),
    generateOHLCV(cfg.bars, dataB.basePrice, volB),
    dataA.sym,
    dataB.sym
  );
}

/* ── 4. Header info ─────────────────────────────────────── */
let livePriceA = dataA.price;
let livePriceB = dataB.price;

function updateHeaderInfo() {
  const fmtA = livePriceA > 100
    ? `$${livePriceA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${livePriceA.toFixed(4)}`;
  const fmtB = livePriceB > 100
    ? `$${livePriceB.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${livePriceB.toFixed(4)}`;

  const diffA  = livePriceA - dataA.prevClose;
  const pctA   = (diffA / dataA.prevClose) * 100;
  const diffB  = livePriceB - dataB.prevClose;
  const pctB   = (diffB / dataB.prevClose) * 100;
  const isUpA  = pctA >= 0;
  const isUpB  = pctB >= 0;

  // Sym A
  const nameA   = document.getElementById('ch-fullname-a');
  const priceA  = document.getElementById('ch-price-a');
  const changeA = document.getElementById('ch-change-a');
  if (nameA)   nameA.textContent   = dataA.name;
  if (priceA)  priceA.textContent  = fmtA;
  if (changeA) {
    changeA.textContent = `${isUpA ? '+' : ''}${pctA.toFixed(2)}%`;
    changeA.className   = `ch-sym-change ${isUpA ? 'fire' : 'dn'}`;
  }

  // Sym B
  const nameB   = document.getElementById('ch-fullname-b');
  const priceB  = document.getElementById('ch-price-b');
  const changeB = document.getElementById('ch-change-b');
  if (nameB)   nameB.textContent   = dataB.name;
  if (priceB)  priceB.textContent  = fmtB;
  if (changeB) {
    changeB.textContent = `${isUpB ? '+' : ''}${pctB.toFixed(2)}%`;
    changeB.className   = `ch-sym-change ${isUpB ? 'fire' : 'dn'}`;
  }

  // Search inputs
  const inputA = document.getElementById('search-input-a');
  const inputB = document.getElementById('search-input-b');
  if (inputA) inputA.value = dataA.sym;
  if (inputB) inputB.value = dataB.sym;
}

/* ── 5. Full refresh ────────────────────────────────────── */
function refresh() {
  document.title = `${dataA.sym} vs ${dataB.sym} — Comparaison · TickerView`;

  livePriceA = dataA.price;
  livePriceB = dataB.price;

  updateHeaderInfo();
  loadChart();
  renderCompareMetrics(dataA, dataB);
  renderSymCard('compare-card-a', dataA, 'a');
  renderSymCard('compare-card-b', dataB, 'b');
  pushURL();
}

function pushURL() {
  const url = new URL(window.location);
  url.searchParams.set('symA', dataA.sym);
  url.searchParams.set('symB', dataB.sym);
  url.searchParams.set('tf',   tf);
  window.history.replaceState({}, '', url);
}

/* ── 6. TF buttons ──────────────────────────────────────── */
document.querySelectorAll('[data-tf]').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.tf === tf);
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tf]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tf = btn.dataset.tf;
    loadChart();
    pushURL();
  });
});

/* ── 7. Swap button ─────────────────────────────────────── */
document.getElementById('btn-swap')?.addEventListener('click', () => {
  [dataA, dataB] = [dataB, dataA];
  [livePriceA, livePriceB] = [livePriceB, livePriceA];
  refresh();
});

/* ── 8. Symbol search (shared factory) ─────────────────── */
function initSymSearch(inputId, dropdownId, isA) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let filtered = [];
  let selIdx   = -1;

  function search(q) {
    const ql = q.toLowerCase().trim();
    if (!ql) return [];
    return SYMBOL_LIST.filter(s =>
      s.sym.toLowerCase().includes(ql) ||
      s.name.toLowerCase().includes(ql) ||
      s.exchange.toLowerCase().includes(ql)
    ).slice(0, 7);
  }

  function renderDropdown(items) {
    selIdx = -1;
    if (!items.length) {
      dropdown.innerHTML = `<div class="sym-search-no-result">Aucun résultat</div>`;
      dropdown.classList.remove('hidden');
      return;
    }
    dropdown.innerHTML = items.map((s, i) => `
      <div class="sym-search-item" data-idx="${i}" role="option" tabindex="-1">
        <span class="sym-search-sym">${s.sym}</span>
        <span class="sym-search-name">${s.name}</span>
        <span class="sym-search-exchange">${s.exchange}</span>
      </div>
    `).join('');
    dropdown.classList.remove('hidden');
    dropdown.querySelectorAll('.sym-search-item').forEach(el => {
      el.addEventListener('click', () => pick(filtered[+el.dataset.idx]));
      el.addEventListener('mouseenter', () => {
        dropdown.querySelectorAll('.sym-search-item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        selIdx = +el.dataset.idx;
      });
    });
  }

  function pick(s) {
    if (!s) return;
    if (isA) dataA = getSymbolData(s.sym);
    else     dataB = getSymbolData(s.sym);
    dropdown.classList.add('hidden');
    refresh();
  }

  function hide() { dropdown.classList.add('hidden'); selIdx = -1; }

  input.addEventListener('input', () => {
    filtered = search(input.value);
    if (!input.value.trim()) { hide(); return; }
    renderDropdown(filtered);
  });

  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.sym-search-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selIdx = Math.min(selIdx + 1, filtered.length - 1);
      items.forEach((el, i) => el.classList.toggle('selected', i === selIdx));
      items[selIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selIdx = Math.max(selIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('selected', i === selIdx));
      items[selIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selIdx >= 0) pick(filtered[selIdx]);
      else if (filtered.length) pick(filtered[0]);
    } else if (e.key === 'Escape') {
      hide(); input.blur();
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!input.closest('.ch-search-wrap')?.contains(e.target)) hide();
  });
}

initSymSearch('search-input-a', 'search-dropdown-a', true);
initSymSearch('search-input-b', 'search-dropdown-b', false);

/* ── 9. Live price simulation ───────────────────────────── */
function tickVol(data) {
  return data.basePrice > 1000 ? 50
       : data.basePrice > 100  ? 1.2
       : data.basePrice > 1    ? 0.006
       : 0.0002;
}

setInterval(() => {
  livePriceA = Math.max(
    dataA.price * 0.88,
    Math.min(dataA.price * 1.12, livePriceA + (Math.random() - 0.48) * tickVol(dataA))
  );
  livePriceB = Math.max(
    dataB.price * 0.88,
    Math.min(dataB.price * 1.12, livePriceB + (Math.random() - 0.48) * tickVol(dataB))
  );
  updateHeaderInfo();
}, 2400);

/* ── 10. Bootstrap ──────────────────────────────────────── */
refresh();