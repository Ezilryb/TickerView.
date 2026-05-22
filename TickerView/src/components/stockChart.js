/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Stock Chart Component
   src/components/StockChart/stockChart.js
   Canvas: Candlesticks · Volume · MA20/MA50 · Crosshair
══════════════════════════════════════════════════════════════ */

import { generateOHLCV, TF_CONFIG } from '../../utils/stockData.js';

const INITIAL_PRICE = 182.52;

/* ── Color helpers ─────────────────────────────────────────── */
function th(dark, light){ return document.documentElement.getAttribute('data-theme')==='light' ? light : dark; }
const C = {
  bg:       ()=> th('#0C0C10','#FFFFFF'),
  bgCard:   ()=> th('#131318','#F7F4EF'),
  border:   ()=> th('#1E1E24','#E4E0D8'),
  textPri:  ()=> th('#E8E6E0','#1A1A1E'),
  textSec:  ()=> th('#5A5750','#7A756C'),
  accent:   ()=> th('#E8440A','#D63B06'),
  blue:     ()=> th('#5E7EFF','#3D5CE8'),
  up:       ()=> th('#E8440A','#D63B06'),
  dn:       ()=> th('#5E7EFF','#3D5CE8'),
  upRaw:    ()=> th('232,68,10','214,59,6'),
  dnRaw:    ()=> th('94,126,255','61,92,232'),
};

/* ── Moving Average ────────────────────────────────────────── */
function calcMA(data, period){
  return data.map((_, i) => {
    if(i < period - 1) return null;
    return data.slice(i - period + 1, i + 1).reduce((s,d) => s + d.c, 0) / period;
  });
}

/* ── Main chart class ──────────────────────────────────────── */
export class StockChart {
  constructor(containerId){
    this.container = document.getElementById(containerId);
    if(!this.container) return;

    this.canvas  = this.container.querySelector('#chart-canvas');
    this.overlay = this.container.querySelector('#chart-overlay'); // crosshair canvas
    this.DPR     = window.devicePixelRatio || 1;

    this.tf       = '3M';
    this.type     = 'candle'; // candle | line | mountain
    this.showMA20 = true;
    this.showMA50 = true;
    this.data     = [];
    this.mouse    = null;

    this._resize();
    this._bindEvents();
    this._generate();

    // Redraw on theme change
    new MutationObserver(() => this.draw()).observe(
      document.documentElement, { attributes:true, attributeFilter:['data-theme'] }
    );
    window.addEventListener('resize', () => { this._resize(); this.draw(); });
  }

  setTimeframe(tf){ this.tf = tf; this._generate(); }
  setType(type)   { this.type = type; this.draw(); }
  toggleMA(period){ period===20 ? (this.showMA20 = !this.showMA20) : (this.showMA50 = !this.showMA50); this.draw(); }

  _generate(){
    const cfg = TF_CONFIG[this.tf];
    this.data = generateOHLCV(cfg.bars, INITIAL_PRICE, cfg.vol);
    this.draw();
  }

  _resize(){
    const W = this.container.clientWidth;
    const H = this.container.clientHeight || 380;
    [this.canvas, this.overlay].forEach(c => {
      if(!c) return;
      c.width  = W * this.DPR;
      c.height = H * this.DPR;
      c.style.width  = W + 'px';
      c.style.height = H + 'px';
    });
    this.W = W; this.H = H;
  }

  _bindEvents(){
    if(!this.overlay) return;
    const onMove = e => {
      const r  = this.overlay.getBoundingClientRect();
      const cx = (e.clientX || e.touches?.[0]?.clientX) - r.left;
      const cy = (e.clientY || e.touches?.[0]?.clientY) - r.top;
      this.mouse = { x:cx, y:cy };
      this._drawCrosshair();
      this._updateHoverInfo(cx);
    };
    const onLeave = () => {
      this.mouse = null;
      const ctx = this.overlay.getContext('2d');
      ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
      this._updateHoverInfo(null);
    };
    this.overlay.addEventListener('mousemove', onMove);
    this.overlay.addEventListener('mouseleave', onLeave);
    this.overlay.addEventListener('touchmove', onMove, { passive:true });
  }

  /* ── Layout constants ──────────────────────────────────── */
  _layout(){
    const PAD_L = 12, PAD_R = 70, PAD_T = 20, PAD_B = 32;
    const VOL_H = Math.floor(this.H * 0.18);
    return {
      PAD_L, PAD_R, PAD_T, PAD_B, VOL_H,
      chartX: PAD_L,
      chartY: PAD_T,
      chartW: this.W - PAD_L - PAD_R,
      chartH: this.H - PAD_T - PAD_B - VOL_H - 8,
      volY:   this.H - PAD_B - VOL_H,
      volH:   VOL_H,
    };
  }

  /* ── Main draw ─────────────────────────────────────────── */
  draw(){
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    if(!this.data.length) return;

    const L      = this._layout();
    const data   = this.data;
    const prices = data.flatMap(d => [d.h, d.l]);
    const pMin   = Math.min(...prices);
    const pMax   = Math.max(...prices);
    const pRange = pMax - pMin || 1;
    const vols   = data.map(d => d.v);
    const vMax   = Math.max(...vols);

    // Scale helpers
    const py = v => L.chartY + L.chartH - ((v - pMin) / pRange) * L.chartH;
    const vy = v => L.volY + L.volH - (v / vMax) * L.volH;
    const bw = L.chartW / data.length;
    const bx = i => L.chartX + i * bw;

    // Background grid
    this._drawGrid(ctx, L, pMin, pMax, pRange, py);

    // Volume
    this._drawVolume(ctx, data, L, bx, bw, vy);

    // Chart type
    if(this.type === 'candle') this._drawCandles(ctx, data, L, bx, bw, py);
    else this._drawLine(ctx, data, L, bx, bw, py, this.type === 'mountain');

    // MAs
    if(this.showMA20) this._drawMA(ctx, calcMA(data, 20), data, bx, bw, py, C.accent(), 1.4);
    if(this.showMA50) this._drawMA(ctx, calcMA(data, 50), data, bx, bw, py, C.blue(), 1.4);

    // Price axis (right)
    this._drawPriceAxis(ctx, L, pMin, pMax, py);

    // MA legend
    this._drawLegend(ctx, L);
  }

  _drawGrid(ctx, L, pMin, pMax, pRange, py){
    ctx.strokeStyle = C.border();
    ctx.lineWidth = 0.5;
    const STEPS = 5;
    for(let i = 0; i <= STEPS; i++){
      const v = pMin + (i / STEPS) * pRange;
      const y = py(v);
      ctx.beginPath(); ctx.moveTo(L.chartX, y); ctx.lineTo(L.chartX + L.chartW, y); ctx.stroke();
    }
    // Vertical
    const VSTEPS = 6;
    for(let i = 0; i <= VSTEPS; i++){
      const x = L.chartX + (i / VSTEPS) * L.chartW;
      ctx.beginPath(); ctx.moveTo(x, L.chartY); ctx.lineTo(x, L.volY + L.volH); ctx.stroke();
    }
  }

  _drawCandles(ctx, data, L, bx, bw, py){
    const body = Math.max(2, bw * 0.55);
    data.forEach((d, i) => {
      const isUp = d.c >= d.o;
      const col  = isUp ? C.up() : C.dn();
      const x    = bx(i) + bw / 2;
      // Wick
      ctx.strokeStyle = col; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x, py(d.h)); ctx.lineTo(x, py(d.l)); ctx.stroke();
      // Body
      const y1 = py(Math.max(d.o, d.c));
      const y2 = py(Math.min(d.o, d.c));
      const bh = Math.max(1, y2 - y1);
      ctx.fillStyle = isUp ? col : `rgba(${C.dnRaw()},0.7)`;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x - body/2, y1, body, bh);
      ctx.globalAlpha = 1;
    });
  }

  _drawLine(ctx, data, L, bx, bw, py, fill){
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = bx(i) + bw / 2;
      const y = py(d.c);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = C.accent(); ctx.lineWidth = 1.8;
    ctx.stroke();

    if(fill){
      const last = data[data.length - 1];
      ctx.lineTo(bx(data.length - 1) + bw/2, L.chartY + L.chartH);
      ctx.lineTo(bx(0) + bw/2, L.chartY + L.chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, L.chartY, 0, L.chartY + L.chartH);
      grad.addColorStop(0, `rgba(${C.upRaw()},0.18)`);
      grad.addColorStop(1, `rgba(${C.upRaw()},0)`);
      ctx.fillStyle = grad; ctx.fill();
    }
  }

  _drawVolume(ctx, data, L, bx, bw, vy){
    const vb = Math.max(1, bw * 0.6);
    data.forEach((d, i) => {
      const isUp = d.c >= d.o;
      const col  = isUp ? `rgba(${C.upRaw()},0.35)` : `rgba(${C.dnRaw()},0.35)`;
      const x    = bx(i) + bw/2 - vb/2;
      const y    = vy(d.v);
      ctx.fillStyle = col;
      ctx.fillRect(x, y, vb, L.volY + L.volH - y);
    });
    // Vol label
    ctx.font = `7px 'IBM Plex Mono',monospace`;
    ctx.fillStyle = C.textSec();
    ctx.textAlign = 'left';
    ctx.fillText('VOL', L.chartX + 4, L.volY + 10);
  }

  _drawMA(ctx, maData, data, bx, bw, py, color, lw){
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.setLineDash([]);
    ctx.beginPath();
    let started = false;
    maData.forEach((v, i) => {
      if(v === null) return;
      const x = bx(i) + bw/2;
      const y = py(v);
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    });
    ctx.stroke();
  }

  _drawPriceAxis(ctx, L, pMin, pMax, py){
    const STEPS = 5;
    ctx.font = `8px 'IBM Plex Mono',monospace`;
    ctx.textAlign = 'left';
    for(let i = 0; i <= STEPS; i++){
      const v = pMin + (i / STEPS) * (pMax - pMin);
      const y = py(v);
      ctx.fillStyle = C.textSec();
      ctx.fillText('$' + v.toFixed(2), L.chartX + L.chartW + 4, y + 3);
    }
    // Current price line
    const last  = this.data[this.data.length - 1];
    const lastY = py(last.c);
    const isUp  = last.c >= this.data[0]?.c;
    ctx.strokeStyle = isUp ? C.up() : C.dn(); ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(L.chartX, lastY); ctx.lineTo(L.chartX + L.chartW, lastY); ctx.stroke();
    ctx.setLineDash([]);
    // Price label
    const lbH = 16, lbW = 62;
    ctx.fillStyle = isUp ? C.up() : C.dn();
    ctx.fillRect(L.chartX + L.chartW + 2, lastY - lbH/2, lbW, lbH);
    ctx.fillStyle = '#fff'; ctx.font = `bold 8px 'IBM Plex Mono',monospace`;
    ctx.fillText('$' + last.c.toFixed(2), L.chartX + L.chartW + 6, lastY + 3);
  }

  _drawLegend(ctx, L){
    const items = [];
    if(this.showMA20) items.push({ label:'MA20', color:C.accent() });
    if(this.showMA50) items.push({ label:'MA50', color:C.blue() });
    let x = L.chartX + 8;
    items.forEach(item => {
      ctx.strokeStyle = item.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, L.chartY + 10); ctx.lineTo(x + 16, L.chartY + 10); ctx.stroke();
      ctx.fillStyle = item.color; ctx.font = `8px 'IBM Plex Mono',monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 20, L.chartY + 14);
      x += 56;
    });
  }

  /* ── Crosshair on overlay canvas ──────────────────────── */
  _drawCrosshair(){
    if(!this.overlay || !this.mouse) return;
    const ctx = this.overlay.getContext('2d');
    ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    const { x, y } = this.mouse;

    ctx.strokeStyle = `rgba(${C.upRaw()},0.4)`; ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke();
    ctx.setLineDash([]);

    // Y label
    const L = this._layout();
    const pMin = Math.min(...this.data.map(d => d.l));
    const pMax = Math.max(...this.data.map(d => d.h));
    const pRange = pMax - pMin || 1;
    const pricePct = 1 - (y - L.chartY) / L.chartH;
    const price = pMin + pricePct * pRange;
    if(price >= pMin && price <= pMax){
      const lbW = 62, lbH = 16;
      ctx.fillStyle = C.accent();
      ctx.fillRect(this.W - lbW - 8, y - lbH/2, lbW, lbH);
      ctx.fillStyle = '#fff'; ctx.font = `bold 8px 'IBM Plex Mono',monospace`;
      ctx.textAlign = 'left';
      ctx.fillText('$' + price.toFixed(2), this.W - lbW - 4, y + 3);
    }
  }

  _updateHoverInfo(mouseX){
    const infoEl = document.getElementById('chart-hover-info');
    if(!infoEl) return;
    if(mouseX === null){ infoEl.innerHTML = ''; return; }
    const L = this._layout();
    const bw = L.chartW / this.data.length;
    const idx = Math.min(this.data.length - 1, Math.max(0, Math.floor((mouseX - L.chartX) / bw)));
    const d   = this.data[idx];
    if(!d) return;
    const isUp = d.c >= d.o;
    const col  = isUp ? 'var(--accent)' : 'var(--blue)';
    infoEl.innerHTML = `
      <span>O <b style="color:${col}">$${d.o.toFixed(2)}</b></span>
      <span>H <b style="color:${col}">$${d.h.toFixed(2)}</b></span>
      <span>L <b style="color:${col}">$${d.l.toFixed(2)}</b></span>
      <span>C <b style="color:${col}">$${d.c.toFixed(2)}</b></span>
      <span>VOL <b>${(d.v/1_000_000).toFixed(1)}M</b></span>
    `;
  }
}
