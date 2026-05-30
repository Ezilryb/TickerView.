/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Streaks & session (Phase P5)
   src/js/streaks.js
══════════════════════════════════════════════════════════════ */

const STREAK_KEY = 'tickerview.streak';
const SESSION_KEY = 'tickerview.session';

const MS_48H = 48 * 60 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { streak: 0, lastVisit: 0, lastDay: '' };
    return { streak: 0, lastVisit: 0, lastDay: '', ...JSON.parse(raw) };
  } catch {
    return { streak: 0, lastVisit: 0, lastDay: '' };
  }
}

function saveStreak(data) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/**
 * Met à jour le streak et retourne le compteur actuel.
 */
export function tickStreak() {
  const data = loadStreak();
  const now = Date.now();
  const today = dayKey();

  if (!data.lastVisit) {
    data.streak = 1;
    data.lastVisit = now;
    data.lastDay = today;
    saveStreak(data);
    return data.streak;
  }

  const gap = now - data.lastVisit;

  if (gap > MS_48H) {
    data.streak = 1;
  } else if (data.lastDay !== today && gap <= MS_48H) {
    data.streak = Math.max(1, (data.streak || 1) + 1);
  } else if (data.streak < 1) {
    data.streak = 1;
  }

  data.lastVisit = now;
  data.lastDay = today;
  saveStreak(data);
  return data.streak;
}

export function getStreakCount() {
  return loadStreak().streak || 1;
}

export function updateStreakBadge() {
  const count = tickStreak();
  const unit = count > 1 ? 'jours' : 'jour';
  document.querySelectorAll('[data-shell-streak]').forEach(el => {
    el.textContent = `🔥 ${count} ${unit}`;
    el.setAttribute('aria-label', `${count} ${unit} d'analyse consécutifs`);
  });
}

/* ── Session « reprendre » ─────────────────────────────────── */

/**
 * @param {object} snapshot
 */
export function saveSession(snapshot) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...snapshot,
      savedAt: Date.now(),
    }));
  } catch {
    /* ignore */
  }
}

export function captureSessionSnapshot() {
  const root = document.querySelector('.app-shell');
  const page = root?.dataset.page || 'home';
  const params = new URLSearchParams(window.location.search);

  const snap = {
    page,
    path: window.location.pathname + window.location.search,
    sym: params.get('sym') || root?.dataset.focusSym || null,
    symA: params.get('symA') || null,
    symB: params.get('symB') || null,
    label: '',
  };

  if (page === 'compare' && snap.symA && snap.symB) {
    snap.label = `${snap.symA} vs ${snap.symB}`;
  } else if (snap.sym) {
    snap.label = snap.sym;
  } else if (page === 'home') {
    snap.label = 'Cockpit';
  } else {
    snap.label = 'TickerView';
  }

  saveSession(snap);
  return snap;
}

export function getRecentSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.savedAt) return null;
    if (Date.now() - data.savedAt > MS_24H) return null;
    return data;
  } catch {
    return null;
  }
}

export function getWelcomeMessage() {
  const streak = getStreakCount();
  if (streak <= 1) {
    return 'Bienvenue sur TickerView — le flux ne ment pas.';
  }
  return `Bon retour — série de ${streak} jour${streak > 1 ? 's' : ''} d'analyse.`;
}

export function initSessionTracking() {
  updateStreakBadge();

  captureSessionSnapshot();

  const save = () => captureSessionSnapshot();
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}

/**
 * Bannière « Reprendre » sur l'accueil.
 */
export function initResumeBanner() {
  if (document.querySelector('.app-shell')?.dataset.page !== 'home') return;

  const session = getRecentSession();
  const hero = document.querySelector('.cockpit-hero__copy');
  if (!hero || !session) return;

  const existing = document.getElementById('home-resume-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'home-resume-banner';
  banner.className = 'home-resume-banner';
  banner.innerHTML = `
    <div class="home-resume-banner__text">
      <span class="home-resume-banner__label">Reprendre où vous en étiez</span>
      <span class="home-resume-banner__meta">${session.label} · il y a moins de 24h</span>
    </div>
    <a href="${session.path || 'stock.html'}" class="home-resume-banner__cta">Continuer →</a>
  `;

  hero.insertBefore(banner, hero.querySelector('.cockpit-hero__eyebrow'));
}

export function initWelcomeLine() {
  if (document.querySelector('.app-shell')?.dataset.page !== 'home') return;
  const eyebrow = document.querySelector('.cockpit-hero__eyebrow');
  if (!eyebrow) return;
  eyebrow.textContent = getWelcomeMessage();
}
