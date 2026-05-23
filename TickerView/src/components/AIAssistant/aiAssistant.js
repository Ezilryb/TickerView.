/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — AI Assistant Component
   src/components/AIAssistant/aiAssistant.js
   v3 — accepts STOCK param, dynamic system prompt per symbol
══════════════════════════════════════════════════════════════ */

const SUGGESTED = [
  'Analyse le setup technique actuel',
  'Zones de support/résistance clés ?',
  'Que dit le volume aujourd\'hui ?',
  'Risque/reward si je trade long ?',
];

/**
 * @param {object} STOCK - Symbol data from symbolRegistry.getSymbolData()
 */
export function initAIAssistant(STOCK) {
  const panel = document.getElementById('ai-panel');
  if (!panel || !STOCK) return;

  const input     = panel.querySelector('#ai-input');
  const sendBtn   = panel.querySelector('#ai-send');
  const msgs      = panel.querySelector('#ai-messages');
  const suggestEl = panel.querySelector('#ai-suggestions');

  /* ── Build dynamic system prompt ────────────────────────── */
  const fmtPrice = v => v > 100
    ? `$${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${v.toFixed(4)}`;

  const SYSTEM_PROMPT = `Tu es TickerAI, un assistant d'analyse financière expert intégré dans TickerView — un terminal d'analyse orderflow pour traders professionnels. Tu es concis, précis, et tu parles le langage des traders (orderflow, delta, VAH/VAL, POC, imbalances, etc.).

Contexte marché actuel :
- Symbole : ${STOCK.sym} (${STOCK.name})
- Exchange : ${STOCK.exchange} · Secteur : ${STOCK.sector}
- Prix actuel : ${fmtPrice(STOCK.price)} (${STOCK.changePct > 0 ? '+' : ''}${STOCK.changePct}%)
- Open : ${fmtPrice(STOCK.open)} | High : ${fmtPrice(STOCK.high)} | Low : ${fmtPrice(STOCK.low)}
- Volume : ${STOCK.volume} vs moy. ${STOCK.avgVolume}
- Market Cap : ${STOCK.marketCap}
- P/E : ${STOCK.pe !== '—' ? STOCK.pe + '×' : 'N/A'} | EPS : ${STOCK.eps !== '—' ? '$' + STOCK.eps : 'N/A'} | Beta : ${STOCK.beta}
- 52W High : ${fmtPrice(STOCK.week52High)} | 52W Low : ${fmtPrice(STOCK.week52Low)}

Réponds en français, en 2-4 phrases maximum sauf si l'utilisateur demande plus de détails. Structure tes réponses avec des données concrètes tirées du contexte ci-dessus.`;

  const WELCOME_TEXT = `Bonjour — je suis TickerAI. Je lis le flux **${STOCK.sym}** (${STOCK.name}) en temps réel : prix actuel **${fmtPrice(STOCK.price)}** (${STOCK.changePct > 0 ? '+' : ''}${STOCK.changePct}%), volume ${STOCK.volume} vs moy. ${STOCK.avgVolume}. Posez-moi une question sur la configuration technique, les niveaux-clés ou l'orderflow du moment.`;

  /* ── Conversation history ────────────────────────────────── */
  const history = [];

  /* ── Init ────────────────────────────────────────────────── */
  appendAssistantMessage(msgs, WELCOME_TEXT, true);
  renderSuggestions();

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  /* ── Core send ───────────────────────────────────────────── */
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    suggestEl.style.display = 'none';

    appendUserMessage(msgs, text);
    history.push({ role: 'user', content: text });

    const thinkingEl = appendThinking(msgs);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:    'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:   SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data  = await res.json();
      const reply = data.content?.find(b => b.type === 'text')?.text
                    || 'Erreur de réponse API.';

      resolveThinking(thinkingEl, reply);
      history.push({ role: 'assistant', content: reply });

    } catch {
      resolveThinking(thinkingEl, 'Connexion impossible. Vérifiez votre clé API ou la configuration réseau.');
    }

    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderSuggestions() {
    suggestEl.innerHTML = SUGGESTED.map(s =>
      `<button class="ai-suggest">${s}</button>`
    ).join('');
    suggestEl.querySelectorAll('.ai-suggest').forEach(btn => {
      btn.addEventListener('click', () => { input.value = btn.textContent; sendMessage(); });
    });
  }
}

/* ── DOM helpers ─────────────────────────────────────────────── */
function appendUserMessage(container, text) {
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-user';
  div.innerHTML = `
    <span class="ai-msg-role">Vous</span>
    <span class="ai-msg-text">${escHtml(text)}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAssistantMessage(container, text, isWelcome = false) {
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-assistant';
  div.innerHTML = `
    <span class="ai-msg-role"><span class="ai-dot"></span>TickerAI</span>
    <span class="ai-msg-text${isWelcome ? ' ai-welcome-text' : ''}">${renderMarkdown(text)}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function appendThinking(container) {
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-assistant thinking';
  div.innerHTML = `
    <span class="ai-msg-role"><span class="ai-dot"></span>TickerAI</span>
    <span class="ai-msg-text"><span class="ai-spinner">···</span></span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function resolveThinking(el, text) {
  el.classList.remove('thinking');
  el.querySelector('.ai-msg-text').innerHTML = renderMarkdown(text);
}

function renderMarkdown(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
