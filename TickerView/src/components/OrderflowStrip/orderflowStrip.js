/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Orderflow Strip (Phase P3 / P6)
   src/components/OrderflowStrip/orderflowStrip.js
══════════════════════════════════════════════════════════════ */

import { playMechanicalClick, playImbalanceAlert } from '../../js/soundDesign.js';

/**
 * @param {object} [stock]
 */
export function initOrderflowStrip(stock = {}) {
  const strip = document.getElementById('orderflow-strip');
  if (!strip) return;

  const els = {
    delta: strip.querySelector('[data-of="delta"]'),
    cvd: strip.querySelector('[data-of="cvd"]'),
    imbalances: strip.querySelector('[data-of="imbalances"]'),
    trades: strip.querySelector('[data-of="trades"]'),
    bias: strip.querySelector('[data-of="bias"]'),
  };

  let cvd = (Math.random() - 0.5) * 4000;
  let imbalances = Math.floor(Math.random() * 8 + 2);

  function fmtDelta(n) {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${Math.round(n).toLocaleString('fr-FR')}`;
  }

  function flash(el, type) {
    if (!el) return;
    el.classList.remove('is-flash-up', 'is-flash-down', 'is-flash-pulse');
    el.classList.add(type === 'up' ? 'is-flash-up' : type === 'down' ? 'is-flash-down' : 'is-flash-pulse');
    setTimeout(() => el.classList.remove('is-flash-up', 'is-flash-down', 'is-flash-pulse'), 160);
  }

  function tick() {
    const delta = (Math.random() - 0.46) * 1200;
    const big = Math.abs(delta) > 700;

    cvd += delta * 0.35;
    if (Math.random() > 0.82) imbalances += Math.random() > 0.5 ? 1 : -1;
    imbalances = Math.max(0, imbalances);

    const isUp = delta >= 0;
    if (els.delta) {
      els.delta.textContent = fmtDelta(delta);
      els.delta.classList.toggle('is-up', isUp);
      els.delta.classList.toggle('is-down', !isUp);
      if (big) {
        flash(els.delta.closest('.of-cell'), isUp ? 'up' : 'down');
        if (document.querySelector('.app-shell')?.dataset.page === 'terminal') {
          playMechanicalClick();
        }
      }
    }
    if (els.cvd) {
      els.cvd.textContent = fmtDelta(cvd);
      els.cvd.classList.toggle('is-up', cvd >= 0);
      els.cvd.classList.toggle('is-down', cvd < 0);
    }
    if (els.imbalances) {
      els.imbalances.textContent = String(imbalances);
      if (big) {
        flash(els.imbalances.closest('.of-cell'), 'pulse');
        if (document.querySelector('.app-shell')?.dataset.page === 'terminal') {
          playImbalanceAlert();
        }
      }
    }
    if (els.trades) {
      const tps = Math.floor(12 + Math.random() * 40);
      els.trades.textContent = tps.toLocaleString('fr-FR');
    }
    if (els.bias) {
      els.bias.textContent = cvd > 500 ? 'ACHETEUR' : cvd < -500 ? 'VENDEUR' : 'NEUTRE';
      els.bias.classList.toggle('is-up', cvd > 500);
      els.bias.classList.toggle('is-down', cvd < -500);
    }

    strip.dataset.sym = stock.sym || '';
  }

  tick();
  setInterval(tick, 2200);
}
