/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — TickerAI Drawer (Phase P3 / P4)
   src/js/aiDrawer.js
══════════════════════════════════════════════════════════════ */

const AI_STORAGE_KEY = 'tickerview.shell.ai';

function loadAiOpen() {
  try {
    return localStorage.getItem(AI_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveAiOpen(open) {
  try {
    localStorage.setItem(AI_STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function getRoot() {
  return document.querySelector('.app-shell');
}

function getDrawer() {
  return document.getElementById('app-sidebar-right');
}

export function isAiDrawerOpen() {
  const root = getRoot();
  return !!root?.classList.contains('is-ai-open');
}

export function openAiDrawer() {
  const root = getRoot();
  const drawer = getDrawer();
  if (!root || !drawer) {
    const sym = new URLSearchParams(window.location.search).get('sym') || 'BTC';
    window.location.href = `stock.html?sym=${encodeURIComponent(sym)}&ai=1`;
    return;
  }

  root.classList.add('is-ai-open');
  drawer.setAttribute('aria-hidden', 'false');
  root.querySelectorAll('[data-shell-toggle-ai]').forEach(btn => {
    btn.setAttribute('aria-pressed', 'true');
  });
  saveAiOpen(true);
  drawer.querySelector('#ai-input')?.focus();
}

export function closeAiDrawer() {
  const root = getRoot();
  const drawer = getDrawer();
  if (!root || !drawer) return;

  root.classList.remove('is-ai-open');
  drawer.setAttribute('aria-hidden', 'true');
  root.querySelectorAll('[data-shell-toggle-ai]').forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
  });
  saveAiOpen(false);
}

export function toggleAiDrawer() {
  if (isAiDrawerOpen()) closeAiDrawer();
  else openAiDrawer();
}

/**
 * @param {HTMLElement} [root]
 */
export function initAiDrawer(root = getRoot()) {
  const drawer = getDrawer();
  if (!root || !drawer) return;

  if (loadAiOpen()) openAiDrawer();

  root.querySelectorAll('[data-shell-toggle-ai]').forEach(btn => {
    btn.addEventListener('click', () => toggleAiDrawer());
  });

  drawer.querySelector('[data-ai-drawer-close]')?.addEventListener('click', closeAiDrawer);

  if (new URLSearchParams(window.location.search).get('ai') === '1') {
    openAiDrawer();
  }
}
