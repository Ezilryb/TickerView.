/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — État shell partagé (Flow, sidebar)
   src/js/shellState.js
══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'tickerview.shell';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sidebarCollapsed: false, flowMode: false };
    return { sidebarCollapsed: false, flowMode: false, ...JSON.parse(raw) };
  } catch {
    return { sidebarCollapsed: false, flowMode: false };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * @param {boolean} on
 */
export function setFlowMode(on) {
  const root = document.querySelector('.app-shell');
  if (!root) return;

  root.classList.toggle('is-flow-mode', on);
  const state = loadState();
  state.flowMode = on;
  saveState(state);

  root.querySelector('[data-shell-toggle-flow]')?.setAttribute('aria-pressed', on ? 'true' : 'false');
}
