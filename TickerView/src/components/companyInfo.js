/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Company Info Component
   src/components/CompanyInfo/companyInfo.js
══════════════════════════════════════════════════════════════ */

import { STOCK } from '../../utils/stockData.js';

export function renderCompanyInfo(){
  const el = document.getElementById('company-info');
  if(!el) return;

  el.innerHTML = `
    <!-- Logo placeholder -->
    <div class="ci-logo-row">
      <div class="ci-logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <path d="M26 12.5c-.1-2.8 2.3-4.2 2.4-4.3-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1-1 0-2.4-1-3.9-.9-2 0-3.8 1.2-4.8 2.9-2.1 3.6-.5 8.8 1.5 11.7 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-1 3.7-1 1.8 0 2.3 1 3.8.9 1.5 0 2.5-1.4 3.5-2.8 1.1-1.6 1.5-3.2 1.5-3.3-.1 0-2.9-1.1-3-4.9z" fill="currentColor" opacity="0.9"/>
          <path d="M22.8 4c.8-1 1.3-2.4 1.2-3.7-1.2.1-2.6.8-3.5 1.8-.8.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.5 3.5-1.6z" fill="currentColor"/>
        </svg>
      </div>
      <div>
        <div class="ci-sym">${STOCK.sym}</div>
        <div class="ci-exchange">${STOCK.exchange} · ${STOCK.isin}</div>
      </div>
    </div>

    <div class="ci-name">${STOCK.name}</div>

    <!-- Sector tags -->
    <div class="ci-tags">
      <span class="ci-tag">${STOCK.sector}</span>
      <span class="ci-tag">${STOCK.industry}</span>
    </div>

    <!-- Description -->
    <p class="ci-desc">${STOCK.description}</p>

    <!-- Quick facts -->
    <div class="ci-facts">
      <div class="ci-fact">
        <span class="ci-fact-label">CEO</span>
        <span class="ci-fact-val">${STOCK.ceo}</span>
      </div>
      <div class="ci-fact">
        <span class="ci-fact-label">Fondée en</span>
        <span class="ci-fact-val">${STOCK.founded}</span>
      </div>
      <div class="ci-fact">
        <span class="ci-fact-label">Siège</span>
        <span class="ci-fact-val">${STOCK.hq}</span>
      </div>
      <div class="ci-fact">
        <span class="ci-fact-label">Effectif</span>
        <span class="ci-fact-val">${STOCK.employees}</span>
      </div>
    </div>

    <!-- OHLCV quick strip -->
    <div class="ci-ohlcv">
      <div class="ci-ohlcv-row">
        <span>Ouverture</span><span>$${STOCK.open.toFixed(2)}</span>
      </div>
      <div class="ci-ohlcv-row">
        <span>Haut</span><span class="fire">$${STOCK.high.toFixed(2)}</span>
      </div>
      <div class="ci-ohlcv-row">
        <span>Bas</span><span class="dn">$${STOCK.low.toFixed(2)}</span>
      </div>
      <div class="ci-ohlcv-row">
        <span>Clôture préc.</span><span>$${STOCK.prevClose.toFixed(2)}</span>
      </div>
      <div class="ci-ohlcv-row">
        <span>Volume</span><span>${STOCK.volume}</span>
      </div>
      <div class="ci-ohlcv-row">
        <span>Vol. moyen</span><span>${STOCK.avgVolume}</span>
      </div>
    </div>
  `;
}
