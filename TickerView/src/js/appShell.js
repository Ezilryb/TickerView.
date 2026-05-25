/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — App Shell Controller (Phase P0)
   src/js/appShell.js

   Gère : sidebar repliable, Flow Mode, persistance localStorage.
   La Command Palette (Ctrl+K) sera branchée en Phase P4.
══════════════════════════════════════════════════════════════ */

import { initCommandPalette } from './commandPalette.js';
import { initKeyboardShortcuts } from './keyboardShortcuts.js';
import { loadState, saveState, setFlowMode } from './shellState.js';
import { initWorkspaces, syncStatusbarWorkspace } from './workspaces.js';
import { initSessionTracking, initResumeBanner, initWelcomeLine } from './streaks.js';
import { initSoundDesign } from './soundDesign.js';

/**
 * Initialise la coque applicative sur la page courante.
 * @param {HTMLElement} [root] — .app-shell (défaut : document.querySelector)
 */
export function initAppShell(root = document.querySelector('.app-shell')) {
  if (!root) return;

  let state = loadState();

  const toggleBtn = root.querySelector('[data-shell-toggle-sidebar]');

  function syncSidebarA11y() {
    const collapsed = root.classList.contains('is-sidebar-collapsed');
    toggleBtn?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  if (state.sidebarCollapsed) root.classList.add('is-sidebar-collapsed');
  if (state.flowMode) root.classList.add('is-flow-mode');
  syncSidebarA11y();

  toggleBtn?.addEventListener('click', () => {
    root.classList.toggle('is-sidebar-collapsed');
    state.sidebarCollapsed = root.classList.contains('is-sidebar-collapsed');
    syncSidebarA11y();
    saveState(state);
  });

  const flowBtn = root.querySelector('[data-shell-toggle-flow]');

  function syncFlowA11y() {
    const on = root.classList.contains('is-flow-mode');
    flowBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  syncFlowA11y();

  flowBtn?.addEventListener('click', () => {
    const on = !root.classList.contains('is-flow-mode');
    setFlowMode(on);
    state = loadState();
    syncFlowA11y();
  });

  initCommandPalette();
  initKeyboardShortcuts();
  initSoundDesign();
  initWorkspaces();
  syncStatusbarWorkspace();
  initSessionTracking();
  initWelcomeLine();
  initResumeBanner();
}
