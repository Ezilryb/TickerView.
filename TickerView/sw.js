/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Service Worker (PWA)
   sw.js — Cache-first for static assets, network-first for data

   v6 : workspaces, streaks, sound design, command palette
══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'tickerview-v6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './stock.html',
  './compare.html',
  './manifest.json',
  './src/styles/tokens-cinematic.css',
  './src/styles/variables.css',
  './src/styles/app-shell.css',
  './src/styles/home.css',
  './src/styles/global.css',
  './src/styles/stock.css',
  './src/styles/terminal.css',
  './src/styles/compare.css',
  './src/styles/command-palette.css',
  './src/js/appShell.js',
  './src/js/shellState.js',
  './src/js/shellFocus.js',
  './src/js/aiDrawer.js',
  './src/js/symbolSearch.js',
  './src/js/commandPalette.js',
  './src/js/keyboardShortcuts.js',
  './src/js/workspaces.js',
  './src/js/streaks.js',
  './src/js/soundDesign.js',
  './src/components/OrderflowStrip/orderflowStrip.js',
  './src/pages/Home/home.js',
  './src/pages/Stock/stock.js',
  './src/pages/Compare/compare.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (
    e.request.url.includes('vercel.app') ||
    e.request.url.includes('api.') ||
    e.request.url.includes('stream.')
  ) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
