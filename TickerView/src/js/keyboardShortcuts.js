/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Raccourcis clavier centralisés (Phase P4)
   src/js/keyboardShortcuts.js
══════════════════════════════════════════════════════════════ */

import {
  toggleCommandPalette,
  isCommandPaletteOpen,
  handlePaletteKeydown,
} from './commandPalette.js';
import { toggleAiDrawer, isAiDrawerOpen, closeAiDrawer } from './aiDrawer.js';

/**
 * Point d'entrée unique : évite les conflits Ctrl+K / Ctrl+J / Escape.
 */
export function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (isCommandPaletteOpen()) {
      handlePaletteKeydown(e);
      return;
    }

    if (e.key === 'Escape' && isAiDrawerOpen()) {
      e.preventDefault();
      closeAiDrawer();
      return;
    }

    if (!(e.ctrlKey || e.metaKey)) return;

    const key = e.key.toLowerCase();

    if (key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
      return;
    }

    if (key === 'j') {
      e.preventDefault();
      toggleAiDrawer();
    }
  });
}
