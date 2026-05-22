/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Stock Page Orchestrator
   src/pages/Stock/stock.js
   Boots all components for the stock analysis page
══════════════════════════════════════════════════════════════ */

import { initColorMode }       from '../../utils/colorMode.js';
import { StockChart }          from '../../components/StockChart/stockChart.js';
import { renderCompanyInfo }   from '../../components/CompanyInfo/companyInfo.js';
import { renderFinancials }    from '../../components/Financials/financials.js';
import { renderNews }          from '../../components/NewsPanel/newsPanel.js';
import { initAIAssistant }     from '../../components/AIAssistant/aiAssistant.js';
import { STOCK }               from '../../utils/stockData.js';

/* ── 1. Theme toggle ──────────────────────────────────────── */
initColorMode(document.getElementById('theme-toggle'));

/* ── 2. Render static components ─────────────────────────── */
renderCompanyInfo();
renderFinancials();
renderNews();

/* ── 3. Stock chart ───────────────────────────────────────── */
const chart = new StockChart('chart-container');

// Timeframe tabs
document.querySelectorAll('[data-tf]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tf]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chart.setTimeframe(btn.dataset.tf);
  });
});

// Chart type toggle
document.querySelectorAll('[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chart.setType(btn.dataset.type);
  });
});

// MA toggles
document.querySelectorAll('[data-ma]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    chart.toggleMA(parseInt(btn.dataset.ma));
  });
});

/* ── 4. Live price simulation ─────────────────────────────── */
let livePrice = STOCK.price;
const priceEl   = document.getElementById('live-price');
const changeEl  = document.getElementById('live-change');
const changePEl = document.getElementById('live-changepct');

setInterval(() => {
  const delta = (Math.random() - 0.48) * 0.8;
  livePrice   = Math.max(150, Math.min(220, livePrice + delta));
  const diff  = livePrice - STOCK.prevClose;
  const pct   = (diff / STOCK.prevClose) * 100;
  const isUp  = diff >= 0;

  priceEl.textContent  = '$' + livePrice.toFixed(2);
  changeEl.textContent = (isUp ? '+' : '') + diff.toFixed(2);
  changePEl.textContent= (isUp ? '+' : '') + pct.toFixed(2) + '%';
  [priceEl, changeEl, changePEl].forEach(e => {
    e.className = isUp ? 'fire' : 'dn';
  });
}, 2400);

/* ── 5. AI Assistant ──────────────────────────────────────── */
initAIAssistant();
