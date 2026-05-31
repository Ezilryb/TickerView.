/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Sound Design (Phase P6)
   src/js/soundDesign.js · Web Audio API · synthèse légère
══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'tickerview.sound';

let audioCtx = null;
let enabled = true;

function loadEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(on) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  syncSoundToggleUI();
}

export function isSoundAllowed() {
  if (!enabled) return false;
  const root = document.querySelector('.app-shell');
  if (root?.classList.contains('is-flow-mode')) return false;
  return true;
}

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * @param {{ freq: number, duration: number, type?: OscillatorType, gain: number, decay?: number }} opts
 */
function playTone(opts) {
  if (!isSoundAllowed()) return;

  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freq * 0.4), t + opts.duration);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.gain, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (opts.decay || opts.duration));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + opts.duration + 0.02);
  } catch {
    /* autoplay policy / API indisponible */
  }
}

/** Micro-clic mécanique — orderflow / imbalances */
export function playMechanicalClick() {
  playTone({ freq: 920, duration: 0.028, type: 'square', gain: 0.018, decay: 0.04 });
}

/** Confirmation feutrée — palette, IA */
export function playSoftConfirm() {
  playTone({ freq: 520, duration: 0.06, type: 'sine', gain: 0.022, decay: 0.08 });
}

/** Alerte imbalance / volume (légèrement plus présent) */
export function playImbalanceAlert() {
  playTone({ freq: 340, duration: 0.045, type: 'triangle', gain: 0.026, decay: 0.07 });
  setTimeout(() => {
    if (isSoundAllowed()) {
      playTone({ freq: 480, duration: 0.03, type: 'sine', gain: 0.012, decay: 0.05 });
    }
  }, 28);
}

function syncSoundToggleUI() {
  document.querySelectorAll('[data-shell-toggle-sound]').forEach(btn => {
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.classList.toggle('is-muted', !enabled);
    const label = btn.querySelector('[data-sound-label]');
    if (label) label.textContent = enabled ? 'Sons ON' : 'Sons OFF';
  });
}

export function injectSoundToggle() {
  document.querySelectorAll('.app-statusbar__right').forEach(bar => {
    if (bar.querySelector('[data-shell-toggle-sound]')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-statusbar__sound';
    btn.setAttribute('data-shell-toggle-sound', '');
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.innerHTML = `<span data-sound-label>${enabled ? 'Sons ON' : 'Sons OFF'}</span>`;

    btn.addEventListener('click', () => {
      setSoundEnabled(!enabled);
    });

    const wsItem = [...bar.querySelectorAll('.app-statusbar__item')].find(
      el => el.textContent.trim().startsWith('Workspace'),
    );
    if (wsItem) bar.insertBefore(btn, wsItem);
    else bar.prepend(btn);
  });

  syncSoundToggleUI();
}

export function initSoundDesign() {
  enabled = loadEnabled();
  injectSoundToggle();
}

/** Débloque l'audio après un geste utilisateur */
export function unlockAudio() {
  try {
    ensureContext();
  } catch {
    /* ignore */
  }
}

document.addEventListener('pointerdown', () => unlockAudio(), { once: true });
