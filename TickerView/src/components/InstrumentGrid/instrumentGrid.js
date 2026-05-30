/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Instrument Grid Component
   src/components/InstrumentGrid/instrumentGrid.js
══════════════════════════════════════════════════════════════ */

import { TICKERS, rndSeries, buildSparkSVG } from '../../utils/marketData.js';

const FILTERS = {
  all: () => true,
  crypto: t => t.type.includes('CRYPTO'),
  futures: t => t.type.includes('FUTURES') || t.type.includes('METALS'),
  fx: t => t.type === 'FOREX',
};

let activeFilter = 'all';

/**
 * @param {'all'|'crypto'|'futures'|'fx'} [filter]
 */
export function renderInstruments(filter = activeFilter) {
  const grid = document.getElementById('instruments-grid');
  if (!grid) return;

  activeFilter = filter;
  const predicate = FILTERS[filter] || FILTERS.all;
  const list = TICKERS.filter(predicate);

  grid.innerHTML = '';
  const countEl = document.getElementById('instruments-count');
  if (countEl) {
    countEl.textContent = `${String(list.length).padStart(2, '0')} / ${TICKERS.length}+`;
  }

  const SERIES = list.map(t => rndSeries(32, t.price, 0.022));

  list.forEach((t, i) => {
    const isUp = t.change >= 0;
    const series = SERIES[i];
    const card = document.createElement('div');
    card.className = 'inst-card';
    card.setAttribute('role', 'listitem');

    const fmt = t.price > 100
      ? t.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : t.price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    card.innerHTML = `
      <div class="ic-header">
        <div>
          <div class="ic-sym">${t.sym}</div>
          <div class="ic-name">${t.name}</div>
          <div class="ic-type">${t.type} · ${t.exchange}</div>
        </div>
        <div class="ic-badge ${isUp ? 'up' : 'dn'}">${isUp ? '+' : ''}${t.change.toFixed(2)}%</div>
      </div>
      <div class="ic-price data-value">${t.price > 100 ? '$' : ''}${fmt}</div>
      <div class="ic-price-label">${t.exchange} · Temps réel</div>
      ${buildSparkSVG(series, isUp)}
      <div class="ic-meta">
        <span>VOL ${t.vol}</span>
        <span>${t.cap !== '—' ? 'MCap ' + t.cap : t.type}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `stock.html?sym=${encodeURIComponent(t.sym)}`;
    });

    grid.appendChild(card);
  });
}

/**
 * Branche les boutons filtre (Crypto | Futures | FX).
 */
export function initInstrumentFilters() {
  const wrap = document.getElementById('instruments-filters');
  if (!wrap) return;

  wrap.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderInstruments(btn.dataset.filter);
    });
  });
}
