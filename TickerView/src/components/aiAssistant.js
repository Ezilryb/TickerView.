/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — AI Assistant Component
   src/components/AIAssistant/aiAssistant.js
   Powered by Claude API — Contextual stock analysis
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

export function initAIAssistant(){
  const panel  = document.getElementById('ai-panel');
  if(!panel) return;

  const input  = panel.querySelector('#ai-input');
  const sendBtn= panel.querySelector('#ai-send');
  const msgs   = panel.querySelector('#ai-messages');
  const suggestEl = panel.querySelector('#ai-suggestions');

  // Render suggestions
  suggestEl.innerHTML = SUGGESTED.map(s =>
    `<button class="ai-suggest">${s}</button>`
  ).join('');

  suggestEl.querySelectorAll('.ai-suggest').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      sendMessage();
    });
  });

  // Send on button or Enter
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });

  async function sendMessage(){
    const text = input.value.trim();
    if(!text) return;
    input.value = '';
    suggestEl.style.display = 'none';
    appendMessage('user', text);
    const thinkingEl = appendMessage('assistant', null); // spinner

    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     SYSTEM_PROMPT,
          messages:   [{ role:'user', content: text }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === 'text')?.text || 'Erreur de réponse.';
      thinkingEl.classList.remove('thinking');
      thinkingEl.querySelector('.ai-msg-text').textContent = reply;
    } catch(err) {
      thinkingEl.classList.remove('thinking');
      thinkingEl.querySelector('.ai-msg-text').textContent = 'Connexion impossible. Vérifiez votre clé API.';
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function appendMessage(role, text){
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}${text === null ? ' thinking' : ''}`;
    div.innerHTML = role === 'user'
      ? `<span class="ai-msg-role">Vous</span><span class="ai-msg-text">${text}</span>`
      : `<span class="ai-msg-role"><span class="ai-dot"></span>TickerAI</span><span class="ai-msg-text">${text ?? '<span class="ai-spinner">···</span>'}</span>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }
}
