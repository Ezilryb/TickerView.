/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Workspaces Panel
   src/js/workspacesPanel.js
   Fix : capture-phase → s'exécute AVANT workspaces.js
══════════════════════════════════════════════════════════════ */

import { applyWorkspace, saveCurrentToActiveWorkspace } from './workspaces.js';
import { playSoftConfirm } from './soundDesign.js';

const WS_KEY = 'tickerview.workspaces';

const DEFAULTS = [
  { id:'default',  name:'Default',  icon:'📊', flowMode:false, aiOpen:false,
    sidebarCollapsed:false, page:'terminal', sym:'AAPL', chartType:'candle', chartTf:'3M',
    symA:'AAPL', symB:'NVDA', compareTf:'1Y' },
  { id:'scalper',  name:'Scalper',  icon:'⚡', flowMode:true,  aiOpen:false,
    sidebarCollapsed:true,  page:'terminal', sym:'BTC',  chartType:'candle', chartTf:'1D',
    symA:'BTC',  symB:'ETH',  compareTf:'1D' },
  { id:'macro',    name:'Macro',    icon:'🔭', flowMode:false, aiOpen:true,
    sidebarCollapsed:false, page:'terminal', sym:'AAPL', chartType:'line', chartTf:'1Y',
    symA:'AAPL', symB:'MSFT', compareTf:'5Y' },
  { id:'research', name:'Research', icon:'🔬', flowMode:false, aiOpen:true,
    sidebarCollapsed:false, page:'compare',  sym:'NVDA', chartType:'mountain', chartTf:'6M',
    symA:'AAPL', symB:'NVDA', compareTf:'1Y' },
];

function loadStore() {
  try {
    const raw = localStorage.getItem(WS_KEY);
    if (!raw) return { activeId:'default', workspaces:[...DEFAULTS] };
    const p = JSON.parse(raw);
    return { activeId: p.activeId||'default', workspaces: p.workspaces?.length ? p.workspaces : [...DEFAULTS] };
  } catch { return { activeId:'default', workspaces:[...DEFAULTS] }; }
}
function saveStore(s) { try { localStorage.setItem(WS_KEY,JSON.stringify(s)); } catch {} }

const PAGE_SVG = {
  terminal: `<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M7 14l3-4 3 3 4-6"/>`,
  compare:  `<path d="M4 6h6v12H4zM14 6h6v8h-6z"/><path d="M14 18h6v2h-6z"/>`,
  home:     `<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/>`,
};

function pageLabel(ws) {
  return ws.page === 'compare'
    ? `Comparer · ${ws.symA||'A'} vs ${ws.symB||'B'} · ${ws.compareTf||'1Y'}`
    : `Terminal · ${ws.sym||'AAPL'} · ${ws.chartTf||'3M'}`;
}

function buildCard(ws, active) {
  const tags = [];
  if (ws.flowMode)          tags.push({ l:'Flow',    c:'wsp-tag--flow' });
  if (ws.aiOpen)            tags.push({ l:'AI',      c:'wsp-tag--ai'   });
  if (ws.sidebarCollapsed)  tags.push({ l:'Compact', c:''              });
  tags.push({ l: ws.chartTf   ||'3M',     c:'wsp-tag--tf'   });
  tags.push({ l: ws.chartType ||'candle', c:'wsp-tag--type' });
  return `
  <button type="button" class="wsp-card${active?' is-active':''}" data-wsp-id="${ws.id}">
    <div class="wsp-card-head">
      <span class="wsp-card-icon">${ws.icon||'📊'}</span>
      <span class="wsp-card-name">${ws.name}</span>
      ${active?'<span class="wsp-active-badge">ACTIF</span>':''}
    </div>
    <div class="wsp-card-page">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        ${PAGE_SVG[ws.page]||PAGE_SVG.terminal}
      </svg>
      <span>${pageLabel(ws)}</span>
    </div>
    <div class="wsp-card-tags">${tags.map(t=>`<span class="wsp-tag ${t.c}">${t.l}</span>`).join('')}</div>
    <div class="wsp-card-cta">${active?'Workspace actif':'Activer →'}</div>
  </button>`;
}

let panelEl = null;
let _open   = false;

function buildPanel() {
  const el = document.createElement('div');
  el.id = 'workspaces-panel';
  el.className = 'wsp-panel';
  el.setAttribute('aria-hidden','true');
  el.setAttribute('role','dialog');
  el.setAttribute('aria-modal','true');
  el.innerHTML = `
    <div class="wsp-backdrop" data-wsp-close tabindex="-1"></div>
    <div class="wsp-dialog">
      <div class="wsp-head">
        <div class="wsp-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/>
            <rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>
          </svg>
          WORKSPACES
        </div>
        <div class="wsp-head-actions">
          <button type="button" class="wsp-btn-save" id="wsp-save-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Sauvegarder layout
          </button>
          <button type="button" class="wsp-close" data-wsp-close aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="wsp-grid" id="wsp-grid"></div>
      <div class="wsp-foot">Cliquez sur une carte pour activer le workspace.</div>
    </div>`;
  document.body.appendChild(el);

  el.querySelectorAll('[data-wsp-close]').forEach(b =>
    b.addEventListener('click', closeWorkspacesPanel));

  el.querySelector('#wsp-save-btn')?.addEventListener('click', () => {
    saveCurrentToActiveWorkspace();
    renderGrid();
  });

  return el;
}

function renderGrid() {
  const grid = panelEl?.querySelector('#wsp-grid');
  if (!grid) return;
  const st = loadStore();
  grid.innerHTML = st.workspaces.map(ws => buildCard(ws, ws.id === st.activeId)).join('');
  grid.querySelectorAll('[data-wsp-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const st2 = loadStore();
      const ws  = st2.workspaces.find(w => w.id === btn.dataset.wspId);
      if (!ws) return;
      st2.activeId = btn.dataset.wspId;
      saveStore(st2);
      applyWorkspace(ws);
      closeWorkspacesPanel();
      playSoftConfirm();
    });
  });
}

export function openWorkspacesPanel() {
  if (!panelEl) panelEl = buildPanel();
  renderGrid();
  _open = true;
  panelEl.classList.add('is-open');
  panelEl.setAttribute('aria-hidden','false');
  document.addEventListener('keydown', _key);
}

export function closeWorkspacesPanel() {
  if (!panelEl) return;
  _open = false;
  panelEl.classList.remove('is-open');
  panelEl.setAttribute('aria-hidden','true');
  document.removeEventListener('keydown', _key);
}

function _key(e) { if (e.key === 'Escape' && _open) closeWorkspacesPanel(); }

export function initWorkspacesPanel() {
  // Phase CAPTURE = s'exécute AVANT tous les listeners bubble (dont workspaces.js)
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-nav="workspaces"]');
    if (!link) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // bloque workspaces.js
    _open ? closeWorkspacesPanel() : openWorkspacesPanel();
  }, true); // ← true = capture
}
