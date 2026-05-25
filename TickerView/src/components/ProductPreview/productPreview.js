/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Product Preview Canvas Mockups
   src/components/ProductPreview/productPreview.js
   Footprint · Volume Profile · Multi-Chart (simulé)
══════════════════════════════════════════════════════════════ */

let currentTab = 0;
let animFrame = null;

/**
 * @typedef {object} ProductPreviewOptions
 * @property {boolean} [compact=false]     — hauteur réduite (hero cockpit)
 * @property {string}  [symbol='BTC']    — symbole pour lien terminal
 * @property {string}  [root='.cockpit-preview'] — conteneur scope
 * @property {(sym: string) => void} [onOpenTerminal]
 */

/**
 * @param {ProductPreviewOptions} [options]
 */
export function initProductPreview(options = {}) {
  const {
    compact = false,
    symbol = 'BTC',
    root: rootSel = '.cockpit-preview',
    onOpenTerminal,
  } = options;

  const root = document.querySelector(rootSel);
  if (!root) return;

  const tabs = root.querySelectorAll('.ptab, .cockpit-preview__tab');
  const canvas = root.querySelector('#preview-canvas');
  const frame = root.querySelector('.cockpit-preview__frame, .preview-frame');
  const openLink = root.querySelector('[data-preview-open]');

  if (!canvas) return;

  const DPR = window.devicePixelRatio || 1;

  // ─────────────────────────────────────────────────────────────
  // RÈGLE D'OR : CSS contrôle 100% de l'affichage (position,
  // width, height via `position:absolute; inset:0`).
  // JS ne touche QUE le buffer de rendu (canvas.width / canvas.height).
  // Écrire canvas.style.width ou canvas.style.height depuis JS
  // crée un conflit layout → le panneau se re-déplie après le paint.
  // ─────────────────────────────────────────────────────────────

  // ✅ FIX BUG PRINCIPAL : initialiser le buffer canvas AVANT d'installer
  // le ResizeObserver. Si on installe l'observer en premier, sa première
  // notification arrive avec les dimensions post-layout et déclenche
  // immédiatement un redraw — ce double-fire crée le "dépli" visible.
  // On lit les dimensions une seule fois via getBoundingClientRect()
  // (appelé ici après le double-rAF dans home.js, donc layout stable)
  // puis on installe l'observer avec `box: 'content-box'` pour éviter
  // les notifications dues aux scrollbars / borders.
  function initBuffer() {
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const W = Math.max(Math.round(rect.width), 1);
    const H = Math.max(Math.round(rect.height), 1);
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    drawTab(currentTab);
  }

  // Initialisation immédiate du buffer (layout déjà stable grâce au
  // double-rAF dans home.js)
  initBuffer();

  tabs.forEach((t, i) => {
    t.addEventListener('click', e => {
      e.stopPropagation();
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentTab = i;
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
      drawTab(i);
    });
  });

  function openTerminal() {
    if (onOpenTerminal) {
      onOpenTerminal(symbol);
      return;
    }
    window.location.href = `stock.html?sym=${encodeURIComponent(symbol)}`;
  }

  frame?.addEventListener('click', openTerminal);
  frame?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTerminal();
    }
  });
  if (frame && !frame.hasAttribute('tabindex')) {
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', 'Ouvrir le footprint dans le terminal');
  }

  openLink?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openTerminal();
  });

  // ✅ FIX : utiliser `box: 'content-box'` pour éviter les notifications
  // parasites causées par les changements de border/padding.
  // De plus, on utilise entry.contentBoxSize quand disponible — plus
  // précis et sans reflow — avec fallback sur contentRect.
  // Un flag `resizing` coupe les notifications en cascade : si le
  // ResizeObserver se déclenche pendant qu'on écrit dans le buffer,
  // l'écriture ne change pas la taille CSS (cf. règle d'or ci-dessus)
  // donc pas de boucle, mais le flag évite tout redraw inutile.
  let resizing = false;

  const ro = new ResizeObserver(entries => {
    if (resizing) return;
    resizing = true;

    const entry = entries[0];
    if (!entry) {
      resizing = false;
      return;
    }

    let W, H;
    if (entry.contentBoxSize && entry.contentBoxSize[0]) {
      W = Math.max(Math.round(entry.contentBoxSize[0].inlineSize), 1);
      H = Math.max(Math.round(entry.contentBoxSize[0].blockSize), 1);
    } else {
      W = Math.max(Math.round(entry.contentRect.width), 1);
      H = Math.max(Math.round(entry.contentRect.height), 1);
    }

    // Ne rien faire si les dimensions n'ont pas changé (évite les
    // redessins inutiles lors de reflows qui ne touchent pas la taille)
    const curW = Math.round(canvas.width  / DPR);
    const curH = Math.round(canvas.height / DPR);
    if (W === curW && H === curH) {
      resizing = false;
      return;
    }

    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    drawTab(currentTab);

    // Libérer le flag après le paint pour que les vrais redimensionnements
    // (fenêtre, sidebar) soient bien pris en compte
    requestAnimationFrame(() => { resizing = false; });
  });

  ro.observe(canvas.parentElement, { box: 'content-box' });

  // MutationObserver pour le changement de thème seulement
  const themeObserver = new MutationObserver(() => drawTab(currentTab));
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/* ── Couleurs via tokens CSS ───────────────────────────────── */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function isLight() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function accent() { return cssVar('--magma', '#FF4D12'); }
function signal() { return cssVar('--signal', '#00E5C4'); }
function blue()   { return cssVar('--blue', '#5E7EFF'); }
function bgBase() { return cssVar('--void', '#040405'); }
function bgCard() { return cssVar('--slate-elevated', '#1A1A24'); }
function textPrimary()   { return cssVar('--text-primary', '#ECEAE4'); }
function textSecondary() { return cssVar('--text-secondary', '#6B6872'); }
function border() { return cssVar('--border-subtle', '#252530'); }

function drawTab(i) {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // Lire les dimensions depuis le buffer (canvas.width/height),
  // PAS depuis style.width/height qui ne sont plus écrits par JS.
  const W = Math.round(canvas.width  / DPR);
  const H = Math.round(canvas.height / DPR);
  if (!W || !H) return;
  ctx.clearRect(0, 0, W, H);

  if (i === 0) drawFootprint(ctx, W, H);
  else if (i === 1) drawVolumeProfile(ctx, W, H);
  else if (i === 2) drawMultiChart(ctx, W, H);
}

/* ── 1. FOOTPRINT CHART ────────────────────────────────────── */

function drawFootprint(ctx, W, H) {
  const bg  = bgBase();
  const brd = border();
  const acc = accent();
  const bl  = blue();
  const ts  = textSecondary();

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const CANDLES = 8;
  const LEVELS  = 8;
  const cellW   = (W - 80) / CANDLES;
  const cellH   = (H - 40) / LEVELS;
  const startX  = 60;
  const startY  = 20;
  const basePrice = 67800;

  /* ── Grille prix + lignes horizontales ── */
  for (let l = 0; l < LEVELS + 1; l++) {
    const y = startY + l * cellH;
    ctx.fillStyle    = ts;
    ctx.font         = `9px 'IBM Plex Mono',monospace`;
    ctx.textAlign    = 'right';
    ctx.fillText((basePrice - l * 25).toLocaleString('fr-FR'), startX - 8, y + cellH * 0.5 + 3);
    ctx.strokeStyle  = brd;
    ctx.lineWidth    = 0.5;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  /* ── Bougies + cellules bid/ask ── */
  for (let c = 0; c < CANDLES; c++) {
    const x     = startX + c * cellW;
    const wickH = cellH * LEVELS * 0.6;
    const wickY = startY + cellH * 1.2 + Math.random() * cellH;

    ctx.strokeStyle = brd;
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + cellW / 2, wickY);
    ctx.lineTo(x + cellW / 2, wickY + wickH);
    ctx.stroke();

    for (let l = 0; l < LEVELS; l++) {
      const y   = startY + l * cellH;
      const bid = Math.floor(Math.random() * 900 + 100);
      const ask = Math.floor(Math.random() * 900 + 100);
      const ratio     = bid / (bid + ask);
      const imbalance = Math.abs(ratio - 0.5) > 0.3;

      let cellFill;
      if (imbalance && ratio > 0.5) {
        cellFill = `rgba(255,77,18,${0.1 + ratio * 0.15})`;
      } else if (imbalance) {
        cellFill = `rgba(0,229,196,${0.08 + (1 - ratio) * 0.12})`;
      } else {
        cellFill = isLight() ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
      }
      ctx.fillStyle = cellFill;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      const fw = cellW / 2 - 2;
      ctx.font      = `8px 'IBM Plex Mono',monospace`;
      ctx.textAlign = 'center';

      // ask = bleu (vendeurs), bid = orange (acheteurs) — convention orderflow
      ctx.fillStyle   = bl;
      ctx.globalAlpha = 0.85;
      ctx.fillText(ask, x + fw / 2 + 2, y + cellH * 0.58);

      ctx.fillStyle   = acc;
      ctx.globalAlpha = 0.85;
      ctx.fillText(bid, x + fw + fw / 2 + 2, y + cellH * 0.58);
      ctx.globalAlpha = 1;

      if (imbalance) {
        ctx.fillStyle = ratio > 0.5 ? acc : signal();
        ctx.font      = `bold 8px 'IBM Plex Mono',monospace`;
        ctx.fillText('▸', x + cellW - 10, y + cellH * 0.58);
      }
    }

    /* Delta net de la bougie (centré sous la colonne) */
    const delta = Math.floor((Math.random() - 0.42) * 800);
    ctx.font      = `bold 9px 'IBM Plex Mono',monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = delta >= 0 ? acc : bl;
    ctx.fillText((delta >= 0 ? '+' : '') + delta, x + cellW / 2, H - 6);

    /* Séparateur vertical */
    ctx.strokeStyle = brd;
    ctx.lineWidth   = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + cellW, startY);
    ctx.lineTo(x + cellW, H - 14);
    ctx.stroke();
  }

  /* ── Légende ASK / BID ── */
  ctx.font         = `7px 'IBM Plex Mono',monospace`;
  ctx.textAlign    = 'right';
  ctx.globalAlpha  = 0.75;

  ctx.fillStyle = bl;
  ctx.fillText('ASK', startX - 6, H - 14);

  ctx.fillStyle = acc;
  ctx.fillText('BID', startX - 6, H - 4);

  ctx.globalAlpha = 1;
  ctx.textAlign   = 'left';

  /* Titre du footprint */
  ctx.font      = `bold 10px 'IBM Plex Mono',monospace`;
  ctx.fillStyle = acc;
  ctx.fillText('FOOTPRINT · BTC/USDT · 5m', 4, 14);
}

/* ── 2. VOLUME PROFILE ─────────────────────────────────────── */

function drawVolumeProfile(ctx, W, H) {
  const bg  = bgBase();
  const brd = border();
  const acc = accent();
  const bl  = blue();
  const ts  = textSecondary();

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const CHART_W = W * 0.68;
  const VP_W    = W * 0.28;
  const LEVELS  = 18;
  const PADDING = 30;
  const lvH     = (H - PADDING * 2) / LEVELS;

  const prices = [];
  let p = 67800;
  for (let i = 0; i < 50; i++) {
    p += (Math.random() - 0.48) * 80;
    prices.push(p);
  }
  const pMin   = Math.min(...prices) - 50;
  const pMax   = Math.max(...prices) + 50;
  const pRange = pMax - pMin;

  ctx.strokeStyle = acc;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  prices.forEach((v, i) => {
    const x = PADDING + (i / 49) * (CHART_W - PADDING * 2);
    const y = PADDING + ((pMax - v) / pRange) * (H - PADDING * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = isLight() ? 'rgba(232,68,10,0.05)' : 'rgba(255,77,18,0.06)';
  ctx.lineTo(CHART_W - PADDING, H - PADDING);
  ctx.lineTo(PADDING, H - PADDING);
  ctx.closePath();
  ctx.fill();

  const volumes = [];
  let pocIdx = 0;
  let maxV   = 0;
  for (let l = 0; l < LEVELS; l++) {
    const v = Math.floor(Math.random() * 1000 + 100) * (Math.random() > 0.7 ? 2.5 : 1);
    volumes.push(v);
    if (v > maxV) { maxV = v; pocIdx = l; }
  }
  const vaStart = Math.max(0, pocIdx - Math.floor(LEVELS * 0.35));
  const vaEnd   = Math.min(LEVELS - 1, pocIdx + Math.floor(LEVELS * 0.35));
  const vpX     = CHART_W + 4;

  volumes.forEach((v, l) => {
    const barW = (v / maxV) * (VP_W - 8);
    const y    = PADDING + l * lvH;
    const isPoc = l === pocIdx;
    const isVA  = l >= vaStart && l <= vaEnd;

    ctx.fillStyle = isPoc
      ? acc
      : isVA
        ? (isLight() ? 'rgba(232,68,10,0.25)' : 'rgba(255,77,18,0.18)')
        : (isLight() ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)');
    ctx.fillRect(vpX, y + 1, barW, lvH - 2);

    const lvPrice = Math.round(pMax - (l / LEVELS) * pRange);
    ctx.font      = `8px 'IBM Plex Mono',monospace`;
    ctx.textAlign = 'right';
    ctx.fillStyle = isPoc ? acc : ts;
    ctx.fillText(lvPrice.toLocaleString(), vpX - 4, y + lvH * 0.65);
  });

  const pocY = PADDING + pocIdx * lvH + lvH * 0.5;
  ctx.strokeStyle = acc;
  ctx.lineWidth   = 0.8;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PADDING, pocY);
  ctx.lineTo(CHART_W - 4, pocY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font      = `bold 10px 'IBM Plex Mono',monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = acc;
  ctx.fillText('VRVP · BTC/USDT · 1H', 4, 14);
}

/* ── 3. MULTI-CHART ────────────────────────────────────────── */

function drawMultiChart(ctx, W, H) {
  const bg  = bgBase();
  const brd = border();
  const acc = accent();
  const bl  = blue();
  const tp  = textPrimary();

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const tfs = [['1m', 'BTC/USDT', true], ['5m', 'ETH/USDT', false], ['15m', 'BTC/USDT', true], ['1h', 'NQ1!', false]];
  const pad = 2;
  const PW  = (W - pad * 3) / 2;
  const PH  = (H - pad) / 2;

  tfs.forEach(([, sym, isUp], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ox  = col * (PW + pad);
    const oy  = row * (PH + pad);

    ctx.fillStyle   = bgCard();
    ctx.fillRect(ox, oy, PW, PH);
    ctx.strokeStyle = brd;
    ctx.lineWidth   = 0.8;
    ctx.strokeRect(ox, oy, PW, PH);

    ctx.fillStyle = isLight() ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
    ctx.fillRect(ox, oy, PW, 18);
    ctx.font      = `bold 8px 'IBM Plex Mono',monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = tp;
    ctx.fillText(sym, ox + 8, oy + 12);

    const BARS   = 20;
    const BAR_W  = (PW - 16) / BARS;
    const CHART_H = PH - 28;
    let cp = 100 + Math.random() * 20;

    for (let b = 0; b < BARS; b++) {
      const o = cp;
      const c = o + (Math.random() - 0.48) * 4;
      const h = Math.max(o, c) + Math.random() * 2;
      const l = Math.min(o, c) - Math.random() * 2;
      const allH   = CHART_H - 4;
      const minP   = 80;
      const pRange = 50;
      const bX     = ox + 8 + b * BAR_W;
      const oY     = oy + 22 + allH - ((o - minP) / pRange) * allH;
      const cY     = oy + 22 + allH - ((c - minP) / pRange) * allH;
      const hY     = oy + 22 + allH - ((h - minP) / pRange) * allH;
      const lY     = oy + 22 + allH - ((l - minP) / pRange) * allH;
      const candleIsUp = c >= o;
      const colC = candleIsUp ? acc : bl;

      ctx.strokeStyle = colC;
      ctx.lineWidth   = 0.6;
      ctx.beginPath();
      ctx.moveTo(bX + BAR_W / 2, hY);
      ctx.lineTo(bX + BAR_W / 2, lY);
      ctx.stroke();

      const bodyH = Math.max(1, Math.abs(cY - oY));
      ctx.fillStyle   = colC;
      ctx.globalAlpha = candleIsUp ? 0.85 : 0.6;
      ctx.fillRect(bX + 1, Math.min(oY, cY), BAR_W - 2, bodyH);
      ctx.globalAlpha = 1;
      cp = c;
    }

    const delta = isUp
      ? Math.floor(Math.random() * 500 + 100)
      : -Math.floor(Math.random() * 500 + 100);
    ctx.font      = `7px 'IBM Plex Mono',monospace`;
    ctx.fillStyle = delta >= 0 ? acc : bl;
    ctx.fillText(`Δ ${delta >= 0 ? '+' : ''}${delta}`, ox + 8, oy + PH - 4);
  });
}
