/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Stock Page Orchestrator (Phase P3)
   src/pages/Stock/stock.js
══════════════════════════════════════════════════════════════ */

import { initAppShell } from '../../js/appShell.js';
import { initAiDrawer } from '../../js/aiDrawer.js';
import { initSymbolSearch } from '../../js/symbolSearch.js';
import { setShellFocus } from '../../js/shellFocus.js';
import { StockChart } from '../../components/StockChart/stockChart.js';
import { renderCompanyInfo } from '../../components/CompanyInfo/companyInfo.js';
import { renderFinancials } from '../../components/Financials/financials.js';
import { renderNews } from '../../components/NewsPanel/newsPanel.js';
import { initAIAssistant } from '../../components/AIAssistant/aiAssistant.js';
import { initOrderflowStrip } from '../../components/OrderflowStrip/orderflowStrip.js';
import {
  getSymbolData,
  buildFinancials,
  buildNews,
} from '../../utils/symbolRegistry.js';

const urlSym = new URLSearchParams(window.location.search).get('sym') || 'AAPL';
const STOCK = getSymbolData(urlSym);

document.title = `${STOCK.sym} — ${STOCK.name} | Terminal Orderflow · TickerView`;
document.querySelector('meta[name="description"]')?.setAttribute(
  'content',
  `Analyse orderflow de ${STOCK.name} (${STOCK.sym}) : graphique, delta, métriques et TickerAI.`
);

/* ── Shell + drawer + recherche ───────────────────────────── */
initAppShell();
initAiDrawer();
initSymbolSearch();

const shSymEl = document.getElementById('sh-sym');
const shNameEl = document.getElementById('sh-name');
const shExchEl = document.getElementById('sh-exchange');
const aiSymLabel = document.getElementById('ai-sym-label');
const aiInput = document.getElementById('ai-input');
const priceEl = document.getElementById('live-price');
const changeEl = document.getElementById('live-change');
const changePEl = document.getElementById('live-changepct');
const ohlcvEl = document.querySelector('.sh-ohlcv');
const terminalGrid = document.getElementById('terminal-grid');
const toggleProfileBtn = document.getElementById('toggle-profile');

if (shSymEl) shSymEl.textContent = STOCK.sym;
if (shNameEl) shNameEl.textContent = STOCK.name;
if (shExchEl) shExchEl.textContent = STOCK.exchange;
if (aiSymLabel) aiSymLabel.textContent = STOCK.sym;
if (aiInput) aiInput.placeholder = `Question sur ${STOCK.sym}…`;

const fmtPrice = (v, prefix = '$') => (v > 100
  ? `${prefix}${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : `${prefix}${v.toFixed(4)}`);

if (ohlcvEl) {
  ohlcvEl.innerHTML = `
    <span>O <b>${fmtPrice(STOCK.open)}</b></span>
    <span>H <b>${fmtPrice(STOCK.high)}</b></span>
    <span>L <b>${fmtPrice(STOCK.low)}</b></span>
    <span>Préc. <b>${fmtPrice(STOCK.prevClose)}</b></span>
    <span>Vol <b>${STOCK.volume}</b></span>
  `;
}

let livePrice = STOCK.price;

function syncTopbar(price, diff, pct) {
  setShellFocus({
    symDisplay: STOCK.sym,
    sym: STOCK.sym,
    venue: `${STOCK.exchange} · ${STOCK.sector}`,
    exchange: STOCK.exchange,
    price,
    changePct: pct,
  });
}

function patchPriceDisplay(price, diff, pct) {
  const isUp = diff >= 0;
  const display = fmtPrice(price);
  if (priceEl) {
    priceEl.textContent = display;
    priceEl.className = isUp ? 'fire' : 'dn';
    priceEl.classList.remove('is-flash-up', 'is-flash-down');
    priceEl.classList.add(isUp ? 'is-flash-up' : 'is-flash-down');
    setTimeout(() => priceEl.classList.remove('is-flash-up', 'is-flash-down'), 120);
  }
  if (changeEl) {
    changeEl.textContent = `${isUp ? '+' : ''}${diff.toFixed(2)}`;
    changeEl.className = isUp ? 'fire' : 'dn';
  }
  if (changePEl) {
    changePEl.textContent = `(${isUp ? '+' : ''}${pct.toFixed(2)}%)`;
    changePEl.className = isUp ? 'fire' : 'dn';
  }
  syncTopbar(price, diff, pct);
}

patchPriceDisplay(STOCK.price, STOCK.change, STOCK.changePct);

toggleProfileBtn?.addEventListener('click', () => {
  terminalGrid?.classList.toggle('is-left-collapsed');
  const collapsed = terminalGrid?.classList.contains('is-left-collapsed');
  toggleProfileBtn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
});

/* ── Composants ───────────────────────────────────────────── */
renderCompanyInfo(STOCK);
renderFinancials(buildFinancials(STOCK));
renderNews(buildNews(STOCK));
initOrderflowStrip(STOCK);
initAIAssistant(STOCK);

const chart = new StockChart('chart-container', STOCK.basePrice, STOCK.tfVol);

document.querySelectorAll('[data-tf]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tf]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chart.setTimeframe(btn.dataset.tf);
  });
});

document.querySelectorAll('[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chart.setType(btn.dataset.type);
  });
});

document.querySelectorAll('[data-ma]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    chart.toggleMA(parseInt(btn.dataset.ma, 10));
  });
});

const tickVol = STOCK.basePrice > 1000 ? 45 : STOCK.basePrice > 100 ? 0.8 : STOCK.basePrice > 1 ? 0.005 : 0.0002;

setInterval(() => {
  const delta = (Math.random() - 0.48) * tickVol;
  livePrice = Math.max(STOCK.price * 0.85, Math.min(STOCK.price * 1.15, livePrice + delta));
  const diff = livePrice - STOCK.prevClose;
  const pct = (diff / STOCK.prevClose) * 100;
  patchPriceDisplay(livePrice, diff, pct);
}, 2400);
