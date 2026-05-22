/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — AI Assistant Component  [FIXED v2]
   src/components/AIAssistant/aiAssistant.js
   Fixes:
     1. Welcome message rendered on init → no empty void
     2. Multi-turn history maintained → contextual follow-up questions
     3. Suggestions hidden only after first real send (not on welcome)
══════════════════════════════════════════════════════════════ */

import { STOCK, FINANCIALS } from '../../utils/stockData.js';

const SYSTEM_PROMPT = `Tu es TickerAI, un assistant d'analyse financière expert intégré dans TickerView — un terminal d'analyse orderflow pour traders professionnels. Tu es concis, précis, et tu parles le langage des traders (orderflow, delta, VAH/VAL, POC, imbalances, etc.). Tu analyses les données de marché en temps réel fournies dans le contexte.

Contexte marché actuel :
- Symbole : ${STOCK.sym} (${STOCK.name})
- Prix actuel : $${STOCK.price} (${STOCK.changePct > 0 ? '+' : ''}${STOCK.changePct}%)
- Open : $${STOCK.open} | High : $${STOCK.high} | Low : $${STOCK.low}
- Volume : ${STOCK.volume} vs moy. ${STOCK.avgVolume}
- Market Cap : $${STOCK.marketCap}
- P/E : ${STOCK.pe}× | EPS : $${STOCK.eps} | Beta : ${STOCK.beta}
- 52W High : $${STOCK.week52High} | 52W Low : $${STOCK.week52Low}

Réponds en français, en 2-4 phrases maximum sauf si l'utilisateur demande plus de détails. Structure tes réponses avec des données concrètes.`;

const SUGGESTED = [
  'Analyse le setup technique actuel',
  'Zones de support/résistance clés ?',
  'Que dit le volume aujourd\'hui ?',
  'Risque/reward si je trade long ?',
];

/* Welcome message shown before first user interaction */
const WELCOME_TEXT = `Bonjour — je suis TickerAI. Je lis le flux ${STOCK.sym} en temps réel : prix actuel **$${STOCK.price}** (${STOCK.changePct > 0 ? '+' : ''}${STOCK.changePct}%), volume ${STOCK.volume} vs moy. ${STOCK.avgVolume}. Posez-moi une question sur la configuration technique, les niveaux-clés ou l'orderflow du moment.`;

export function initAIAssistant(){
  const panel  = document.getElementById('ai-panel');
  if(!panel) return;

  const input     = panel.querySelector('#ai-input');
  const sendBtn   = panel.querySelector('#ai-send');
  const msgs      = panel.querySelector('#ai-messages');
  const suggestEl = panel.querySelector('#ai-suggestions');

  /* ── Conversation history for multi-turn context ─────────── */
  const history = []; // { role: 'user'|'assistant', content: string }[]

  /* ── 1. Render welcome message (fills the void) ──────────── */
  appendAssistantMessage(msgs, WELCOME_TEXT, /* isWelcome */ true);

  /* ── 2. Render suggestions ───────────────────────────────── */
  renderSuggestions();

  /* ── Event listeners ─────────────────────────────────────── */
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });

  /* ── Core send function ──────────────────────────────────── */
  async function sendMessage(){
    const text = input.value.trim();
    if(!text) return;
    input.value = '';

    /* Hide suggestions after first real message */
    suggestEl.style.display = 'none';

    /* Add user bubble */
    appendUserMessage(msgs, text);
    history.push({ role: 'user', content: text });

    /* Add thinking bubble */
    const thinkingEl = appendThinking(msgs);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     SYSTEM_PROMPT,
          /* FIX — send full history for multi-turn context */
          messages:   history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data  = await res.json();
      const reply = data.content?.find(b => b.type === 'text')?.text
                    || 'Erreur de réponse API.';

      /* Replace thinking bubble with real reply */
      resolveThinking(thinkingEl, reply);
      history.push({ role: 'assistant', content: reply });

    } catch(err) {
      const errMsg = 'Connexion impossible. Vérifiez votre clé API ou la configuration réseau.';
      resolveThinking(thinkingEl, errMsg);
      /* Don't push error into history — it's not a real assistant turn */
    }

    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Suggestion chips ────────────────────────────────────── */
  function renderSuggestions(){
    suggestEl.innerHTML = SUGGESTED.map(s =>
      `<button class="ai-suggest">${s}</button>`
    ).join('');
    suggestEl.querySelectorAll('.ai-suggest').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.textContent;
        sendMessage();
      });
    });
  }
}

/* ── DOM helpers ─────────────────────────────────────────── */

function appendUserMessage(container, text){
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg-user';
  div.innerHTML = `
    <span class="ai-msg-role">Vous</span>
    <span class="ai-msg-text">${escHtml(text)}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAssistantMessage(container, text, isWelcome = false){
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

function appendThinking(container){
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

function resolveThinking(el, text){
  el.classList.remove('thinking');
  el.querySelector('.ai-msg-text').innerHTML = renderMarkdown(text);
}

/* Minimal markdown: **bold** and line breaks */
function renderMarkdown(text){
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
