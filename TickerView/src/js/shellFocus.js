/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Shell Focus (prix / symbole Topbar)
   src/js/shellFocus.js
══════════════════════════════════════════════════════════════ */

/**
 * @typedef {object} ShellFocusPayload
 * @property {string} symDisplay  — ex. BTC/USDT
 * @property {string} [sym]       — symbole court pour stock.html (ex. BTC)
 * @property {string} [venue]     — ex. Binance Futures · PERP
 * @property {number} price
 * @property {number} changePct
 * @property {string} [exchange]  — status bar
 */

/**
 * Met à jour la topbar et la status bar (symbole focus global).
 * @param {ShellFocusPayload} data
 */
export function setShellFocus(data) {
  const root = document.querySelector('.app-shell');
  if (!root) return;

  const {
    symDisplay,
    sym = symDisplay.split('/')[0].replace(/!.*/, ''),
    venue = 'Binance Futures · PERP',
    price,
    changePct,
    exchange = 'Binance',
  } = data;

  const isUp = changePct >= 0;
  const fmtPrice = price > 100
    ? price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  const changeAbs = (price * (changePct / 100));
  const changeStr = `${isUp ? '+' : ''}${changeAbs.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} (${isUp ? '+' : ''}${changePct.toFixed(2)}%)`;

  root.querySelectorAll('[data-shell-symbol]').forEach(el => { el.textContent = symDisplay; });
  root.querySelectorAll('[data-shell-status-symbol]').forEach(el => { el.textContent = symDisplay; });
  root.querySelector('[data-shell-venue]') && (root.querySelector('[data-shell-venue]').textContent = venue);

  const priceEl = root.querySelector('[data-shell-price]');
  const changeEl = root.querySelector('[data-shell-change]');
  if (priceEl) {
    priceEl.textContent = fmtPrice;
    priceEl.classList.remove('is-flash-up', 'is-flash-down');
    priceEl.classList.add(isUp ? 'is-flash-up' : 'is-flash-down');
    setTimeout(() => priceEl.classList.remove('is-flash-up', 'is-flash-down'), 140);
  }
  if (changeEl) {
    changeEl.textContent = changeStr;
    changeEl.classList.remove('is-up', 'is-down');
    changeEl.classList.add(isUp ? 'is-up' : 'is-down');
  }

  const exEl = root.querySelector('[data-shell-exchange]');
  if (exEl) exEl.textContent = exchange;

  root.dataset.focusSym = sym;
}

/**
 * Extrait le symbole court depuis un libellé tape (BTC/USDT → BTC).
 * @param {string} tapeSym
 */
export function symFromTape(tapeSym) {
  const base = tapeSym.split('/')[0].split(' ')[0];
  return base.replace(/!.*/, '');
}

/**
 * Infère venue / exchange depuis marketData TICKERS si possible.
 * @param {string} tapeSym
 * @param {import('../utils/marketData.js').typeof TICKERS} tickers
 */
export function venueFromTape(tapeSym, tickers) {
  const short = symFromTape(tapeSym);
  const t = tickers.find(x => x.sym === short || tapeSym.startsWith(x.sym));
  if (!t) return { venue: 'Marché · Live', exchange: 'Multi' };
  if (t.type.includes('CRYPTO')) return { venue: `${t.exchange} Futures · PERP`, exchange: t.exchange };
  if (t.type === 'FOREX') return { venue: `${t.exchange} · Spot FX`, exchange: t.exchange };
  return { venue: `${t.exchange} · ${t.type}`, exchange: t.exchange };
}
