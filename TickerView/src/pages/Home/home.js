/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Home Cockpit (Phase P2)
   src/pages/Home/home.js
══════════════════════════════════════════════════════════════ */

import { initAppShell } from '../../js/appShell.js';
import { setShellFocus, symFromTape, venueFromTape } from '../../js/shellFocus.js';
import { renderInstruments, initInstrumentFilters } from '../../components/InstrumentGrid/instrumentGrid.js';
import { initProductPreview } from '../../components/ProductPreview/productPreview.js';
import { TAPE_ITEMS, TICKERS } from '../../utils/marketData.js';
import { AI_ENDPOINT } from '../../config/api.js';
import { playSoftConfirm } from '../../js/soundDesign.js';

const WATCHLIST = TICKERS.slice(0, 6);
const DEMO_SYSTEM = `Tu es TickerAI sur la page d'accueil de TickerView (terminal orderflow).
Réponds en français en 2 phrases maximum. Sois concret (niveaux, delta, footprint).`;

export function initHome() {
  initAppShell();
  initShellFocusDefault();
  initTickerTape();
  initProductPreview({
    compact: true,
    symbol: 'BTC',
    onOpenTerminal: sym => {
      window.location.href = `stock.html?sym=${encodeURIComponent(sym)}`;
    },
  });
  initWatchlist();
  initHomeAI();
  initCompareCard();
  renderInstruments('all');
  initInstrumentFilters();
  initSidebarAnchors();
  initGuidesLink();
}

function initShellFocusDefault() {
  const btc = TAPE_ITEMS.find(t => t.sym.startsWith('BTC')) || TAPE_ITEMS[0];
  applyTapeFocus(btc, null);
}

function initTickerTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;

  const items = [...TAPE_ITEMS, ...TAPE_ITEMS];
  items.forEach(t => {
    const isUp = t.change >= 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tape-item';
    btn.dataset.tapeSym = t.sym;

    // ✅ FIX BUG 1 : minimumFractionDigits: 2 ajouté pour éviter "67 842,5" au lieu de "67 842,50"
    const fmt = t.price > 100
      ? t.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : t.price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    btn.innerHTML = `
      <span class="tape-sym">${t.sym}</span>
      <span class="tape-price">${t.price > 100 ? '$' : ''}${fmt}</span>
      <span class="tape-chg ${isUp ? 'up' : 'dn'}">${isUp ? '+' : ''}${t.change.toFixed(2)}%</span>
    `;
    btn.addEventListener('click', () => applyTapeFocus(t, btn));
    tape.appendChild(btn);
  });

  const first = tape.querySelector('.tape-item');
  if (first) first.classList.add('is-active');
}

/**
 * @param {{ sym: string, price: number, change: number }} item
 * @param {HTMLElement|null} activeBtn
 */
function applyTapeFocus(item, activeBtn) {
  const { venue, exchange } = venueFromTape(item.sym, TICKERS);
  setShellFocus({
    symDisplay: item.sym,
    sym: symFromTape(item.sym),
    venue,
    exchange,
    price: item.price,
    changePct: item.change,
  });

  document.querySelectorAll('.cockpit-tape .tape-item').forEach(el => {
    el.classList.toggle('is-active', el === activeBtn);
  });

  const previewSym = document.querySelector('.ptb-sym');
  if (previewSym) {
    previewSym.textContent = `${item.sym} · BINANCE FUTURES`;
  }
}

function initWatchlist() {
  const list = document.getElementById('cockpit-watchlist');
  if (!list) return;

  WATCHLIST.forEach(t => {
    const isUp = t.change >= 0;

    // ✅ FIX BUG 2 : minimumFractionDigits: 2 ajouté — même correctif que le ticker tape
    const fmt = t.price > 100
      ? t.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : t.price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cockpit-watchlist__row';
    btn.innerHTML = `
      <span>
        <span class="cockpit-watchlist__sym">${t.sym}</span>
        <span class="cockpit-watchlist__name">${t.name}</span>
      </span>
      <span class="cockpit-watchlist__price data-value">${t.price > 100 ? '$' : ''}${fmt}</span>
      <span class="cockpit-watchlist__chg ${isUp ? 'up' : 'dn'}">${isUp ? '+' : ''}${t.change.toFixed(2)}%</span>
    `;
    btn.addEventListener('click', () => {
      const tapeItem = TAPE_ITEMS.find(x => symFromTape(x.sym) === t.sym) || {
        sym: t.sym.includes('/') ? t.sym : `${t.sym}/USDT`,
        price: t.price,
        change: t.change,
      };
      applyTapeFocus(tapeItem, null);
      window.location.href = `stock.html?sym=${encodeURIComponent(t.sym)}`;
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function initHomeAI() {
  const input = document.getElementById('home-ai-input');
  const send = document.getElementById('home-ai-send');
  const out = document.getElementById('home-ai-out');
  if (!input || !send || !out) return;

  out.textContent = 'Posez une question sur BTC — démo TickerAI sans quitter l\'accueil.';

  async function ask() {
    const text = input.value.trim();
    if (!text || send.disabled) return;

    send.disabled = true;
    out.classList.add('is-loading');
    out.textContent = 'Analyse en cours…';

    const shell = document.querySelector('.app-shell');
    const sym = shell?.dataset.focusSym || 'BTC';

    try {
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `${DEMO_SYSTEM}\nSymbole focus : ${sym}.`,
          messages: [{ role: 'user', content: text }],
        }),
      });

      if (!res.ok) throw new Error('API');
      const { text: reply } = await res.json();
      out.textContent = reply || 'Réponse vide.';
      playSoftConfirm();
    } catch {
      out.textContent =
        'Mode démo hors-ligne : le POC sessionnel BTC se forme autour des zones à fort delta. Ouvrez le terminal pour une analyse complète avec TickerAI.';
    } finally {
      out.classList.remove('is-loading');
      send.disabled = false;
      input.value = '';
    }
  }

  send.addEventListener('click', ask);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ask();
    }
  });

  document.getElementById('home-ai-cta')?.addEventListener('click', () => {
    input.focus();
    input.placeholder = 'Où est le POC sur BTC ?';
  });
}

function initCompareCard() {
  document.getElementById('cockpit-compare-go')?.addEventListener('click', () => {
    window.location.href = 'compare.html?symA=AAPL&symB=NVDA&tf=1Y';
  });
}

function initSidebarAnchors() {
  if (!document.querySelector('[data-page="home"]')) return;

  document.querySelector('[data-nav="markets"]')?.addEventListener('click', e => {
    const el = document.getElementById('instruments');
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function initGuidesLink() {
  document.querySelector('[data-nav="guides"]')?.addEventListener('click', e => {
    const help = document.getElementById('home-help');
    if (!help) return;
    e.preventDefault();
    help.open = true;
    help.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
