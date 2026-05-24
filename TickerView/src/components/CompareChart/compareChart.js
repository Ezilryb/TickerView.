/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Compare Chart Component
   src/components/CompareChart/compareChart.js
   Draws a normalized % return chart for two symbols on one canvas.
══════════════════════════════════════════════════════════════ */

function th(dark, light) {
    return document.documentElement.getAttribute('data-theme') === 'light' ? light : dark;
  }
  const C = {
    bg:        () => th('#0C0C10', '#FFFFFF'),
    bgCard:    () => th('#131318', '#FFFFFF'),
    border:    () => th('#1E1E24', '#E4E0D8'),
    textSec:   () => th('#5A5750', '#7A756C'),
    accent:    () => th('#E8440A', '#D63B06'),
    blue:      () => th('#5E7EFF', '#3D5CE8'),
    accentRaw: () => th('232,68,10', '214,59,6'),
    blueRaw:   () => th('94,126,255', '61,92,232'),
  };
  
  export class CompareChart {
    /**
     * @param {string} canvasId  – main drawing canvas
     * @param {string} overlayId – transparent interaction canvas
     */
    constructor(canvasId, overlayId) {
      this.canvas  = document.getElementById(canvasId);
      this.overlay = document.getElementById(overlayId);
      if (!this.canvas) return;
  
      this.DPR   = window.devicePixelRatio || 1;
      this.normA = [];
      this.normB = [];
      this.symA  = '—';
      this.symB  = '—';
      this.mouse = null;
  
      this._resize();
      this._bindEvents();
  
      new MutationObserver(() => this.draw()).observe(
        document.documentElement,
        { attributes: true, attributeFilter: ['data-theme'] }
      );
      window.addEventListener('resize', () => { this._resize(); this.draw(); });
    }
  
    /** Load two OHLCV datasets and redraw */
    load(dataA, dataB, symA, symB) {
      this.normA = this._normalize(dataA);
      this.normB = this._normalize(dataB);
      this.symA  = symA;
      this.symB  = symB;
      this.draw();
    }
  
    /** Normalize an OHLCV array to % return relative to first close */
    _normalize(data) {
      if (!data.length) return [];
      const base = data[0].c;
      return data.map((d, i) => ({ i, pct: (d.c / base - 1) * 100 }));
    }
  
    _layout() {
      const PAD_L = 58, PAD_R = 20, PAD_T = 48, PAD_B = 28;
      return {
        PAD_L, PAD_R, PAD_T, PAD_B,
        chartX: PAD_L,
        chartY: PAD_T,
        chartW: this.W - PAD_L - PAD_R,
        chartH: this.H - PAD_T - PAD_B,
      };
    }
  
    _resize() {
      const el = this.canvas.parentElement;
      const W  = el.clientWidth  || 800;
      const H  = el.clientHeight || 340;
      [this.canvas, this.overlay].forEach(c => {
        if (!c) return;
        c.width        = W * this.DPR;
        c.height       = H * this.DPR;
        c.style.width  = W + 'px';
        c.style.height = H + 'px';
      });
      this.W = W;
      this.H = H;
    }
  
    _bindEvents() {
      if (!this.overlay) return;
      this.overlay.addEventListener('mousemove', e => {
        const r    = this.overlay.getBoundingClientRect();
        this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
        this._drawOverlay();
      });
      this.overlay.addEventListener('mouseleave', () => {
        this.mouse = null;
        const ctx = this.overlay.getContext('2d');
        ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
        ctx.clearRect(0, 0, this.W, this.H);
      });
    }
  
    /* ── MAIN DRAW ─────────────────────────────────────────── */
    draw() {
      if (!this.canvas) return;
      const ctx = this.canvas.getContext('2d');
      ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);
  
      // Background
      ctx.fillStyle = C.bg();
      ctx.fillRect(0, 0, this.W, this.H);
  
      if (!this.normA.length && !this.normB.length) return;
  
      const L   = this._layout();
      const all = [
        ...this.normA.map(d => d.pct),
        ...this.normB.map(d => d.pct),
        0,
      ];
      const rawMin = Math.min(...all);
      const rawMax = Math.max(...all);
      const pad    = Math.max((rawMax - rawMin) * 0.12, 2);
      const yMin   = rawMin - pad;
      const yMax   = rawMax + pad;
      const yRange = yMax - yMin || 1;
      const len    = Math.max(this.normA.length, this.normB.length, 1);
  
      const py = v => L.chartY + L.chartH - ((v - yMin) / yRange) * L.chartH;
      const px = i => L.chartX + (i / (len - 1)) * L.chartW;
  
      this._drawGrid(ctx, L, yMin, yMax, yRange, py);
      this._drawArea(ctx, L, this.normB, C.blue(),   C.blueRaw(),   px, py);
      this._drawArea(ctx, L, this.normA, C.accent(), C.accentRaw(), px, py);
      this._drawZeroLine(ctx, L, py);
      this._drawLegend(ctx, L);
    }
  
    _drawGrid(ctx, L, yMin, yMax, yRange, py) {
      const STEPS = 6;
      ctx.font      = `8px 'IBM Plex Mono',monospace`;
      ctx.textAlign = 'right';
      for (let i = 0; i <= STEPS; i++) {
        const v = yMin + (i / STEPS) * yRange;
        const y = py(v);
        ctx.strokeStyle = C.border(); ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(L.chartX, y); ctx.lineTo(L.chartX + L.chartW, y); ctx.stroke();
        ctx.fillStyle = C.textSec();
        ctx.fillText(`${v >= 0 ? '+' : ''}${v.toFixed(1)}%`, L.chartX - 6, y + 3);
      }
    }
  
    _drawZeroLine(ctx, L, py) {
      const y0 = py(0);
      if (y0 < L.chartY || y0 > L.chartY + L.chartH) return;
      ctx.strokeStyle = C.textSec(); ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(L.chartX, y0); ctx.lineTo(L.chartX + L.chartW, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.textSec(); ctx.font = `8px 'IBM Plex Mono',monospace`;
      ctx.textAlign = 'right';
      ctx.fillText('0%', L.chartX - 6, y0 + 3);
    }
  
    _drawArea(ctx, L, norm, color, colorRaw, px, py) {
      if (!norm.length) return;
      // Fill under/above baseline
      ctx.save();
      ctx.beginPath();
      norm.forEach((d, i) => {
        const x = px(d.i), y = py(d.pct);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      const lastX  = px(norm[norm.length - 1].i);
      const firstX = px(norm[0].i);
      ctx.lineTo(lastX, py(0));
      ctx.lineTo(firstX, py(0));
      ctx.closePath();
      ctx.fillStyle = `rgba(${colorRaw},0.07)`;
      ctx.fill();
      ctx.restore();
  
      // Line with subtle glow
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        norm.forEach((d, i) => {
          const x = px(d.i), y = py(d.pct);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle  = pass === 0 ? `rgba(${colorRaw},0.18)` : color;
        ctx.lineWidth    = pass === 0 ? 4 : 1.8;
        ctx.stroke();
      }
  
      // End dot
      const last = norm[norm.length - 1];
      if (last) {
        ctx.beginPath();
        ctx.arc(px(last.i), py(last.pct), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  
    _drawLegend(ctx, L) {
      const items = [];
      if (this.normA.length) {
        const last = this.normA[this.normA.length - 1].pct;
        items.push({ sym: this.symA, pct: last, color: C.accent(), rawColor: C.accentRaw() });
      }
      if (this.normB.length) {
        const last = this.normB[this.normB.length - 1].pct;
        items.push({ sym: this.symB, pct: last, color: C.blue(), rawColor: C.blueRaw() });
      }
  
      let x = L.chartX + 12;
      const y = L.chartY + 20;
  
      // Background pill
      ctx.fillStyle   = C.bgCard();
      ctx.strokeStyle = C.border(); ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.rect(L.chartX + 8, L.chartY + 8, items.length * 152 + 8, 24);
      ctx.fill(); ctx.stroke();
  
      items.forEach(item => {
        // Line swatch
        ctx.strokeStyle = item.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 8, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = item.color; ctx.fill();
  
        // Label
        ctx.fillStyle = item.color;
        ctx.font      = `bold 9px 'IBM Plex Mono',monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(item.sym, x + 22, y + 3);
  
        ctx.fillStyle = C.textSec();
        ctx.font      = `8px 'IBM Plex Mono',monospace`;
        ctx.fillText(`${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%`, x + 22 + item.sym.length * 7 + 4, y + 3);
  
        x += 152;
      });
    }
  
    /* ── OVERLAY (crosshair + tooltip) ─────────────────────── */
    _drawOverlay() {
      if (!this.overlay || !this.mouse) return;
      const ctx = this.overlay.getContext('2d');
      ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
      ctx.clearRect(0, 0, this.W, this.H);
  
      const L   = this._layout();
      const len = Math.max(this.normA.length, this.normB.length, 1);
      if (!len) return;
  
      const { x } = this.mouse;
      const relX   = Math.max(0, Math.min(1, (x - L.chartX) / L.chartW));
      const idx    = Math.round(relX * (len - 1));
      const crossX = L.chartX + (idx / (len - 1)) * L.chartW;
  
      // Build scale
      const all = [
        ...this.normA.map(d => d.pct),
        ...this.normB.map(d => d.pct),
        0,
      ];
      const rawMin = Math.min(...all);
      const rawMax = Math.max(...all);
      const pad    = Math.max((rawMax - rawMin) * 0.12, 2);
      const yMin   = rawMin - pad;
      const yMax   = rawMax + pad;
      const yRange = yMax - yMin || 1;
      const py     = v => L.chartY + L.chartH - ((v - yMin) / yRange) * L.chartH;
  
      // Vertical crosshair
      ctx.strokeStyle = `rgba(${C.accentRaw()},0.3)`; ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(crossX, L.chartY);
      ctx.lineTo(crossX, L.chartY + L.chartH);
      ctx.stroke();
      ctx.setLineDash([]);
  
      // Data points
      const dA = this.normA[Math.min(idx, this.normA.length - 1)];
      const dB = this.normB[Math.min(idx, this.normB.length - 1)];
  
      [
        { d: dA, color: C.accent() },
        { d: dB, color: C.blue() },
      ].forEach(({ d, color }) => {
        if (!d) return;
        ctx.beginPath();
        ctx.arc(crossX, py(d.pct), 4, 0, Math.PI * 2);
        ctx.fillStyle   = color;
        ctx.fill();
        ctx.strokeStyle = C.bg(); ctx.lineWidth = 1.5;
        ctx.stroke();
      });
  
      // Tooltip
      const hasA = !!dA, hasB = !!dB;
      const rows = (hasA ? 1 : 0) + (hasB ? 1 : 0);
      const ttW  = 154, ttH = rows * 18 + 14;
      let ttX    = crossX + 12;
      if (ttX + ttW > L.chartX + L.chartW) ttX = crossX - ttW - 12;
      const ttY  = L.chartY + 12;
  
      ctx.fillStyle   = C.bgCard();
      ctx.strokeStyle = C.border(); ctx.lineWidth = 1;
      ctx.fillRect(ttX, ttY, ttW, ttH);
      ctx.strokeRect(ttX, ttY, ttW, ttH);
  
      let rowY = ttY + 16;
      const entries = [];
      if (hasA) entries.push({ sym: this.symA, pct: dA.pct, color: C.accent() });
      if (hasB) entries.push({ sym: this.symB, pct: dB.pct, color: C.blue() });
  
      entries.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.font      = `bold 9px 'IBM Plex Mono',monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(item.sym, ttX + 8, rowY);
        ctx.font = `9px 'IBM Plex Mono',monospace`;
        const label = `${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%`;
        ctx.textAlign = 'right';
        ctx.fillText(label, ttX + ttW - 8, rowY);
        rowY += 18;
      });
    }
  }