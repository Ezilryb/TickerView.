/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Compare Page (Phase P4)
   src/pages/Compare/compare.js
══════════════════════════════════════════════════════════════ */

import { initAppShell } from '../../js/appShell.js';
import { initAiDrawer } from '../../js/aiDrawer.js';
import { setShellFocus } from '../../js/shellFocus.js';
import { initCompareSymbolSearch } from '../../js/symbolSearch.js';
import { CompareChart } from '../../components/CompareChart/compareChart.js';
import { renderCompareMetrics, renderSymCard } from '../../components/CompareMetrics/compareMetrics.js';
import {
  getSymbolData,
  generateOHLCV,
  TF_CONFIG,
} from '../../utils/symbolRegistry.js';

const params = new URLSearchParams(window.location.search);
let symAKey = params.get('symA') || 'AAPL';
let symBKey = params.get('symB') || 'NVDA';
let tf = params.get('tf') || '1Y';

let dataA = getSymbolData(symAKey);
let dataB = getSymbolData(symBKey);

initAppShell();
initAiDrawer();

const chart = new CompareChart('compare-canvas', 'compare-overlay');

let livePriceA = dataA.price;
let livePriceB = dataB.price;

function fmtPrice(v) {
  return v > 100
    ? `$${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${v.toFixed(4)}`;
}

function syncTopbarFocus() {
  const pctA = ((livePriceA - dataA.prevClose) / dataA.prevClose) * 100;
  const label = `${dataA.sym} vs ${dataB.sym}`;
  setShellFocus({
    symDisplay: label,
    sym: dataA.sym,
    venue: `${dataA.exchange} · ${dataB.exchange}`,
    exchange: dataA.exchange,
    price: livePriceA,
    changePct: pctA,
  });
  document.querySelectorAll('[data-shell-status-symbol]').forEach(el => {
    el.textContent = label;
  });
}

function updateHeaderInfo() {
  const diffA = livePriceA - dataA.prevClose;
  const pctA = (diffA / dataA.prevClose) * 100;
  const diffB = livePriceB - dataB.prevClose;
  const pctB = (diffB / dataB.prevClose) * 100;
  const isUpA = pctA >= 0;
  const isUpB = pctB >= 0;

  const nameA = document.getElementById('ch-fullname-a');
  const priceA = document.getElementById('ch-price-a');
  const changeA = document.getElementById('ch-change-a');
  if (nameA) nameA.textContent = dataA.name;
  if (priceA) priceA.textContent = fmtPrice(livePriceA);
  if (changeA) {
    changeA.textContent = `${isUpA ? '+' : ''}${pctA.toFixed(2)}%`;
    changeA.className = `ch-sym-change data-value ${isUpA ? 'is-up' : 'is-down'}`;
  }

  const nameB = document.getElementById('ch-fullname-b');
  const priceB = document.getElementById('ch-price-b');
  const changeB = document.getElementById('ch-change-b');
  if (nameB) nameB.textContent = dataB.name;
  if (priceB) priceB.textContent = fmtPrice(livePriceB);
  if (changeB) {
    changeB.textContent = `${isUpB ? '+' : ''}${pctB.toFixed(2)}%`;
    changeB.className = `ch-sym-change data-value ${isUpB ? 'is-up' : 'is-down'}`;
  }

  const inputA = document.getElementById('search-input-a');
  const inputB = document.getElementById('search-input-b');
  if (inputA) inputA.value = dataA.sym;
  if (inputB) inputB.value = dataB.sym;

  syncTopbarFocus();
}

function loadChart() {
  const cfg = TF_CONFIG[tf] || TF_CONFIG['1Y'];
  const volA = dataA.tfVol * (cfg.vol / 0.025);
  const volB = dataB.tfVol * (cfg.vol / 0.025);
  chart.load(
    generateOHLCV(cfg.bars, dataA.basePrice, volA),
    generateOHLCV(cfg.bars, dataB.basePrice, volB),
    dataA.sym,
    dataB.sym
  );
}

function pushURL() {
  const url = new URL(window.location);
  url.searchParams.set('symA', dataA.sym);
  url.searchParams.set('symB', dataB.sym);
  url.searchParams.set('tf', tf);
  window.history.replaceState({}, '', url);
}

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

document.getElementById('btn-swap')?.addEventListener('click', () => {
  [dataA, dataB] = [dataB, dataA];
  [livePriceA, livePriceB] = [livePriceB, livePriceA];
  refresh();
});

initCompareSymbolSearch({
  onPickA: s => {
    dataA = getSymbolData(s.sym);
    refresh();
  },
  onPickB: s => {
    dataB = getSymbolData(s.sym);
    refresh();
  },
});

function tickVol(data) {
  return data.basePrice > 1000 ? 50
    : data.basePrice > 100 ? 1.2
      : data.basePrice > 1 ? 0.006
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

refresh();
