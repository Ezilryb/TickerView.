/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Financials Component
   src/components/Financials/financials.js
   Key metrics grid rendered in the right sidebar
══════════════════════════════════════════════════════════════ */

import { FINANCIALS } from '../../utils/stockData.js';

export function renderFinancials(){
  const el = document.getElementById('financials-grid');
  if(!el) return;

  el.innerHTML = FINANCIALS.map(f => `
    <div class="fin-cell ${f.fire ? 'fire' : ''}">
      <div class="fin-label">${f.label}</div>
      <div class="fin-value">${f.value}</div>
      <div class="fin-sub">${f.sub}</div>
    </div>
  `).join('');
}
