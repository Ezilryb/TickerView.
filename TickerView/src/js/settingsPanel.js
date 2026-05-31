/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Settings Panel
   src/js/settingsPanel.js
   Fix : capture-phase → s'exécute AVANT tous les autres listeners
══════════════════════════════════════════════════════════════ */

import { isSoundEnabled, setSoundEnabled } from './soundDesign.js';

const THEME_KEY  = 'tv_theme';
const GRAIN_KEY  = 'tickerview.grain';
const MOTION_KEY = 'tickerview.reducedMotion';

let panelEl = null;
let _open   = false;

function buildPanel() {
  const el = document.createElement('div');
  el.id = 'settings-panel';
  el.className = 'settings-panel';
  el.setAttribute('aria-hidden','true');
  el.setAttribute('role','dialog');
  el.setAttribute('aria-modal','true');
  el.innerHTML = `
    <div class="sp-backdrop" data-sp-close tabindex="-1"></div>
    <div class="sp-dialog">
      <div class="sp-head">
        <div class="sp-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
          RÉGLAGES
        </div>
        <button type="button" class="sp-close" data-sp-close aria-label="Fermer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="sp-body">
        <section class="sp-section">
          <h3 class="sp-section-label">Apparence</h3>
          <div class="sp-row">
            <div class="sp-row-copy">
              <span class="sp-row-title">Thème</span>
              <span class="sp-row-hint">Sombre recommandé pour l'orderflow</span>
            </div>
            <div class="sp-theme-group">
              <button type="button" class="sth-btn" data-theme-btn="dark">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 3.5A5 5 0 1 1 3.5 11 4 4 0 0 0 11 3.5z"/>
                </svg>
                Sombre
              </button>
              <button type="button" class="sth-btn" data-theme-btn="light">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="8" r="3"/>
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1"/>
                </svg>
                Clair
              </button>
            </div>
          </div>
          <div class="sp-row">
            <div class="sp-row-copy">
              <span class="sp-row-title">Grain cinématique</span>
              <span class="sp-row-hint">Texture de film sur le fond</span>
            </div>
            <button type="button" class="sp-toggle" id="sp-toggle-grain" aria-pressed="true">
              <span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>
            </button>
          </div>
        </section>

        <section class="sp-section">
          <h3 class="sp-section-label">Audio</h3>
          <div class="sp-row">
            <div class="sp-row-copy">
              <span class="sp-row-title">Sons de l'interface</span>
              <span class="sp-row-hint">Clics mécaniques, confirmations, alertes</span>
            </div>
            <button type="button" class="sp-toggle" id="sp-toggle-sound" aria-pressed="true">
              <span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>
            </button>
          </div>
        </section>

        <section class="sp-section">
          <h3 class="sp-section-label">Performance</h3>
          <div class="sp-row">
            <div class="sp-row-copy">
              <span class="sp-row-title">Animations réduites</span>
              <span class="sp-row-hint">Désactive transitions et effets visuels</span>
            </div>
            <button type="button" class="sp-toggle" id="sp-toggle-motion" aria-pressed="false">
              <span class="sp-toggle-track"><span class="sp-toggle-thumb"></span></span>
            </button>
          </div>
        </section>

        <section class="sp-section">
          <h3 class="sp-section-label">Données locales</h3>
          <div class="sp-row">
            <div class="sp-row-copy">
              <span class="sp-row-title">Réinitialiser</span>
              <span class="sp-row-hint">Workspaces, streaks, état shell et préférences</span>
            </div>
            <button type="button" class="sp-btn-danger" id="sp-btn-reset">Effacer tout</button>
          </div>
        </section>
      </div>

      <div class="sp-foot">
        <span>TickerView Beta</span>
        <span>© 2026 Beta Capital Enterprise</span>
      </div>
    </div>`;

  document.body.appendChild(el);

  // Fermeture
  el.querySelectorAll('[data-sp-close]').forEach(b =>
    b.addEventListener('click', closeSettingsPanel));

  // Thème
  el.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.themeBtn;
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(THEME_KEY, t); } catch {}
      syncLogoTheme();
      syncAll();
    });
  });

  // Son
  el.querySelector('#sp-toggle-sound')?.addEventListener('click', function() {
    const next = this.getAttribute('aria-pressed') !== 'true';
    setSoundEnabled(next);
    this.setAttribute('aria-pressed', next ? 'true' : 'false');
  });

  // Grain
  el.querySelector('#sp-toggle-grain')?.addEventListener('click', function() {
    const next = this.getAttribute('aria-pressed') !== 'true';
    const g = document.querySelector('.app-shell__grain');
    if (g) g.style.opacity = next ? '' : '0';
    try { localStorage.setItem(GRAIN_KEY, next ? '1' : '0'); } catch {}
    this.setAttribute('aria-pressed', next ? 'true' : 'false');
  });

  // Motion
  el.querySelector('#sp-toggle-motion')?.addEventListener('click', function() {
    const next = this.getAttribute('aria-pressed') !== 'true';
    document.documentElement.classList.toggle('reduce-motion', next);
    try { localStorage.setItem(MOTION_KEY, next ? '1' : '0'); } catch {}
    this.setAttribute('aria-pressed', next ? 'true' : 'false');
  });

  // Reset
  el.querySelector('#sp-btn-reset')?.addEventListener('click', () => {
    if (!confirm('Effacer toutes les données TickerView ?\n(workspaces, streaks, préférences)')) return;
    ['tickerview.shell','tickerview.workspaces','tickerview.streak',
     'tickerview.session','tickerview.sound','tickerview.shell.ai',
     GRAIN_KEY, MOTION_KEY, THEME_KEY].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    location.reload();
  });

  return el;
}

function syncAll() {
  if (!panelEl) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  panelEl.querySelectorAll('[data-theme-btn]').forEach(btn =>
    btn.classList.toggle('is-active', btn.dataset.themeBtn === theme));
  panelEl.querySelector('#sp-toggle-sound')?.setAttribute('aria-pressed', isSoundEnabled() ? 'true' : 'false');
  panelEl.querySelector('#sp-toggle-grain')?.setAttribute('aria-pressed',
    localStorage.getItem(GRAIN_KEY) !== '0' ? 'true' : 'false');
  panelEl.querySelector('#sp-toggle-motion')?.setAttribute('aria-pressed',
    localStorage.getItem(MOTION_KEY) === '1' ? 'true' : 'false');
}

export function syncLogoTheme() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  document.querySelectorAll('[data-logo-dark]').forEach(img => {
    img.src = theme === 'dark'
      ? img.dataset.logoDark
      : (img.dataset.logoLight || img.dataset.logoDark);
  });
}

export function openSettingsPanel() {
  if (!panelEl) panelEl = buildPanel();
  const g = document.querySelector('.app-shell__grain');
  if (g) g.style.opacity = localStorage.getItem(GRAIN_KEY) !== '0' ? '' : '0';
  syncAll();
  _open = true;
  panelEl.classList.add('is-open');
  panelEl.setAttribute('aria-hidden','false');
  document.addEventListener('keydown', _key);
}

export function closeSettingsPanel() {
  if (!panelEl) return;
  _open = false;
  panelEl.classList.remove('is-open');
  panelEl.setAttribute('aria-hidden','true');
  document.removeEventListener('keydown', _key);
}

function _key(e) { if (e.key === 'Escape') closeSettingsPanel(); }

export function initSettingsPanel() {
  // Appliquer états persistés au chargement
  try {
    if (localStorage.getItem(GRAIN_KEY) === '0') {
      const g = document.querySelector('.app-shell__grain');
      if (g) g.style.opacity = '0';
    }
    if (localStorage.getItem(MOTION_KEY) === '1')
      document.documentElement.classList.add('reduce-motion');
  } catch {}

  syncLogoTheme();

  // Phase CAPTURE = s'exécute AVANT tous les listeners bubble
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-nav="settings"]');
    if (!link) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // bloque tout autre handler
    _open ? closeSettingsPanel() : openSettingsPanel();
  }, true); // ← true = capture
}
