/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Workspaces (Phase P5)
   src/js/workspaces.js
══════════════════════════════════════════════════════════════ */

import { loadState, saveState, setFlowMode } from './shellState.js';
import { openAiDrawer, closeAiDrawer, isAiDrawerOpen } from './aiDrawer.js';
import { playSoftConfirm } from './soundDesign.js';

const STORAGE_KEY = 'tickerview.workspaces';

const DEFAULT_WORKSPACES = [
  {
    id: 'default',
    name: 'Default',
    flowMode: false,
    aiOpen: false,
    sidebarCollapsed: false,
    page: 'terminal',
    sym: 'AAPL',
    chartType: 'candle',
    chartTf: '3M',
    symA: 'AAPL',
    symB: 'NVDA',
    compareTf: '1Y',
  },
  {
    id: 'scalper',
    name: 'Scalper',
    flowMode: true,
    aiOpen: false,
    sidebarCollapsed: true,
    page: 'terminal',
    sym: 'BTC',
    chartType: 'candle',
    chartTf: '1D',
    symA: 'BTC',
    symB: 'ETH',
    compareTf: '1D',
  },
  {
    id: 'macro',
    name: 'Macro',
    flowMode: false,
    aiOpen: true,
    sidebarCollapsed: false,
    page: 'terminal',
    sym: 'AAPL',
    chartType: 'line',
    chartTf: '1Y',
    symA: 'AAPL',
    symB: 'MSFT',
    compareTf: '5Y',
  },
  {
    id: 'research',
    name: 'Research',
    flowMode: false,
    aiOpen: true,
    sidebarCollapsed: false,
    page: 'compare',
    sym: 'NVDA',
    chartType: 'mountain',
    chartTf: '6M',
    symA: 'AAPL',
    symB: 'NVDA',
    compareTf: '1Y',
  },
];

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { activeId: 'default', workspaces: [...DEFAULT_WORKSPACES] };
    }
    const parsed = JSON.parse(raw);
    const workspaces = parsed.workspaces?.length ? parsed.workspaces : [...DEFAULT_WORKSPACES];
    return {
      activeId: parsed.activeId || 'default',
      workspaces,
    };
  } catch {
    return { activeId: 'default', workspaces: [...DEFAULT_WORKSPACES] };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function captureCurrentState() {
  const root = document.querySelector('.app-shell');
  const page = root?.dataset.page || 'home';
  const params = new URLSearchParams(window.location.search);
  const shell = loadState();

  const state = {
    id: loadStore().activeId,
    name: '',
    flowMode: root?.classList.contains('is-flow-mode') ?? false,
    aiOpen: isAiDrawerOpen(),
    sidebarCollapsed: root?.classList.contains('is-sidebar-collapsed') ?? false,
    page,
    sym: params.get('sym') || root?.dataset.focusSym || 'AAPL',
    chartType: document.querySelector('[data-type].active')?.dataset.type || 'candle',
    chartTf: document.querySelector('[data-tf].active')?.dataset.tf || '3M',
    symA: params.get('symA') || 'AAPL',
    symB: params.get('symB') || 'NVDA',
    compareTf: params.get('tf') || '1Y',
  };

  return state;
}

function updateWorkspaceLabelUI(name) {
  document.querySelectorAll('[data-workspace-label]').forEach(el => {
    el.textContent = name;
  });
  document.querySelectorAll('[data-shell-workspace-name]').forEach(el => {
    el.textContent = name;
  });
}

function applyTerminalLayout(ws) {
  setFlowMode(!!ws.flowMode);

  const shell = loadState();
  shell.sidebarCollapsed = !!ws.sidebarCollapsed;
  saveState(shell);
  const root = document.querySelector('.app-shell');
  root?.classList.toggle('is-sidebar-collapsed', !!ws.sidebarCollapsed);

  if (ws.aiOpen) openAiDrawer();
  else closeAiDrawer();

  const profileBtn = document.getElementById('toggle-profile');
  const grid = document.getElementById('terminal-grid');
  if (grid && profileBtn) {
    const collapsed = !!ws.sidebarCollapsed;
    grid.classList.toggle('is-left-collapsed', collapsed);
    profileBtn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
  }

  document.querySelectorAll('[data-type]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === ws.chartType);
  });
  document.querySelectorAll('[data-tf]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tf === ws.chartTf);
  });

  const typeBtn = document.querySelector(`[data-type="${ws.chartType}"]`);
  const tfBtn = document.querySelector(`[data-tf="${ws.chartTf}"]`);
  typeBtn?.click();
  tfBtn?.click();
}

/**
 * Applique un workspace sur la page courante ou navigue si nécessaire.
 * @param {object} ws
 */
export function applyWorkspace(ws) {
  const targetPage = ws.page || 'terminal';
  const currentPage = document.querySelector('.app-shell')?.dataset.page || 'home';

  if (targetPage === 'compare' && currentPage !== 'compare') {
    window.location.href = `compare.html?symA=${encodeURIComponent(ws.symA)}&symB=${encodeURIComponent(ws.symB)}&tf=${ws.compareTf || '1Y'}`;
    return;
  }

  if (targetPage === 'terminal' && currentPage !== 'terminal') {
    const q = new URLSearchParams({ sym: ws.sym || 'AAPL' });
    if (ws.aiOpen) q.set('ai', '1');
    window.location.href = `stock.html?${q.toString()}`;
    return;
  }

  if (targetPage === 'home' && currentPage !== 'home') {
    window.location.href = 'index.html';
    return;
  }

  if (currentPage === 'terminal') {
    applyTerminalLayout(ws);
    const params = new URLSearchParams(window.location.search);
    const curSym = params.get('sym');
    if (ws.sym && curSym !== ws.sym) {
      const q = new URLSearchParams({ sym: ws.sym });
      if (ws.aiOpen) q.set('ai', '1');
      window.location.href = `stock.html?${q.toString()}`;
      return;
    }
  }

  if (currentPage === 'compare') {
    setFlowMode(!!ws.flowMode);
    if (ws.aiOpen) openAiDrawer();
    else closeAiDrawer();
    const params = new URLSearchParams(window.location.search);
    if (params.get('symA') !== ws.symA || params.get('symB') !== ws.symB || params.get('tf') !== ws.compareTf) {
      window.location.href = `compare.html?symA=${encodeURIComponent(ws.symA)}&symB=${encodeURIComponent(ws.symB)}&tf=${ws.compareTf || '1Y'}`;
    }
  }

  if (currentPage === 'home') {
    setFlowMode(!!ws.flowMode);
  }

  updateWorkspaceLabelUI(ws.name);
  playSoftConfirm();
}

export function setActiveWorkspace(id) {
  const store = loadStore();
  const ws = store.workspaces.find(w => w.id === id);
  if (!ws) return;

  store.activeId = id;
  saveStore(store);
  applyWorkspace(ws);
}

export function saveCurrentToActiveWorkspace() {
  const store = loadStore();
  const captured = captureCurrentState();
  const idx = store.workspaces.findIndex(w => w.id === store.activeId);

  if (idx >= 0) {
    store.workspaces[idx] = {
      ...store.workspaces[idx],
      ...captured,
      id: store.workspaces[idx].id,
      name: store.workspaces[idx].name,
    };
  }

  saveStore(store);
  updateWorkspaceLabelUI(store.workspaces[idx]?.name || 'Default');
  playSoftConfirm();
}

function buildMenu(store) {
  const menu = document.querySelector('[data-workspace-menu]');
  if (!menu) return;

  menu.innerHTML = store.workspaces.map(ws => `
    <button type="button" class="app-workspace__item${ws.id === store.activeId ? ' is-active' : ''}" data-workspace-id="${ws.id}">
      <span class="app-workspace__item-name">${ws.name}</span>
      ${ws.id === store.activeId ? '<span class="app-workspace__item-tag">actif</span>' : ''}
    </button>
  `).join('') + `
    <div class="app-workspace__sep"></div>
    <button type="button" class="app-workspace__item app-workspace__item--action" data-workspace-save>Enregistrer le layout actuel</button>
  `;

  menu.querySelectorAll('[data-workspace-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveWorkspace(btn.dataset.workspaceId);
      menu.classList.add('hidden');
    });
  });

  menu.querySelector('[data-workspace-save]')?.addEventListener('click', () => {
    saveCurrentToActiveWorkspace();
    menu.classList.add('hidden');
  });
}

export function injectWorkspaceSelector() {
  const actions = document.querySelector('.app-topbar__actions');
  if (!actions || actions.querySelector('[data-workspace-trigger]')) return;

  const store = loadStore();
  const active = store.workspaces.find(w => w.id === store.activeId) || store.workspaces[0];

  const wrap = document.createElement('div');
  wrap.className = 'app-topbar__workspace';
  wrap.innerHTML = `
    <button type="button" class="app-topbar__workspace-btn" data-workspace-trigger aria-haspopup="listbox" aria-expanded="false">
      <span class="app-topbar__workspace-prefix">Workspace</span>
      <span class="app-topbar__workspace-name" data-workspace-label>${active?.name || 'Default'}</span>
      <span aria-hidden="true">▾</span>
    </button>
    <div class="app-topbar__workspace-menu hidden" data-workspace-menu role="listbox"></div>
  `;

  const flowBtn = actions.querySelector('[data-shell-toggle-flow]');
  if (flowBtn) actions.insertBefore(wrap, flowBtn);
  else actions.prepend(wrap);

  buildMenu(store);

  const trigger = wrap.querySelector('[data-workspace-trigger]');
  const menu = wrap.querySelector('[data-workspace-menu]');

  trigger?.addEventListener('click', e => {
    e.stopPropagation();
    const open = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', open);
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    if (!open) buildMenu(loadStore());
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) {
      menu?.classList.add('hidden');
      trigger?.setAttribute('aria-expanded', 'false');
    }
  });
}

export function initWorkspaces() {
  injectWorkspaceSelector();
  const store = loadStore();
  const active = store.workspaces.find(w => w.id === store.activeId);
  if (active) updateWorkspaceLabelUI(active.name);

  document.querySelector('[data-nav="workspaces"]')?.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('[data-workspace-trigger]')?.click();
  });
}

/** Persistance du nom workspace dans la statusbar */
export function syncStatusbarWorkspace() {
  const store = loadStore();
  const active = store.workspaces.find(w => w.id === store.activeId);
  document.querySelectorAll('[data-shell-workspace-name]').forEach(el => {
    if (active) el.textContent = active.name;
  });
}
