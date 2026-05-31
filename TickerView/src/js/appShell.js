/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — App Shell Controller
   src/js/appShell.js
══════════════════════════════════════════════════════════════ */

import { initCommandPalette }    from './commandPalette.js';
import { initKeyboardShortcuts } from './keyboardShortcuts.js';
import { loadState, saveState, setFlowMode } from './shellState.js';
import { initWorkspaces, syncStatusbarWorkspace } from './workspaces.js';
import { initSessionTracking, initResumeBanner, initWelcomeLine } from './streaks.js';
import { initSoundDesign }       from './soundDesign.js';
import { initSettingsPanel, syncLogoTheme }  from './settingsPanel.js';
import { initWorkspacesPanel }   from './workspacesPanel.js';

export function initAppShell(root = document.querySelector('.app-shell')) {
  if (!root) return;

  let state = loadState();

  /* ── Sidebar ─────────────────────────────────────────── */
  const toggleBtn = root.querySelector('[data-shell-toggle-sidebar]');

  function syncSidebarA11y() {
    toggleBtn?.setAttribute('aria-expanded',
      root.classList.contains('is-sidebar-collapsed') ? 'false' : 'true');
  }

  if (state.sidebarCollapsed) root.classList.add('is-sidebar-collapsed');
  if (state.flowMode)         root.classList.add('is-flow-mode');
  syncSidebarA11y();

  toggleBtn?.addEventListener('click', () => {
    root.classList.toggle('is-sidebar-collapsed');
    state.sidebarCollapsed = root.classList.contains('is-sidebar-collapsed');
    syncSidebarA11y();
    saveState(state);
  });

  /* ── Flow Mode ───────────────────────────────────────── */
  const flowBtn = root.querySelector('[data-shell-toggle-flow]');

  function syncFlowA11y() {
    flowBtn?.setAttribute('aria-pressed',
      root.classList.contains('is-flow-mode') ? 'true' : 'false');
  }
  syncFlowA11y();
  flowBtn?.addEventListener('click', () => {
    setFlowMode(!root.classList.contains('is-flow-mode'));
    state = loadState();
    syncFlowA11y();
  });

  /* ── Logo ────────────────────────────────────────────── */
  syncLogoTheme();
  new MutationObserver(() => syncLogoTheme()).observe(
    document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ── Panneaux — en PREMIER (capture-phase, avant workspaces.js) ── */
  initSettingsPanel();
  initWorkspacesPanel();

  /* ── Autres sous-systèmes ────────────────────────────── */
  initCommandPalette();
  initKeyboardShortcuts();
  initSoundDesign();
  initWorkspaces();           // workspaces.js ajoute ses listeners APRÈS les nôtres
  syncStatusbarWorkspace();
  initSessionTracking();
  initWelcomeLine();
  initResumeBanner();
}
