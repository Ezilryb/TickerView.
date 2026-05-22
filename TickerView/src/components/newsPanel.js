/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — News Panel Component
   src/components/NewsPanel/newsPanel.js
══════════════════════════════════════════════════════════════ */

import { NEWS } from '../../utils/stockData.js';

const SENTIMENT_ICON = {
  positive: '▲',
  negative: '▼',
  neutral:  '●',
};
const SENTIMENT_CLASS = {
  positive: 'news-sent-up',
  negative: 'news-sent-dn',
  neutral:  'news-sent-neu',
};

export function renderNews(){
  const el = document.getElementById('news-panel');
  if(!el) return;

  el.innerHTML = NEWS.map(n => `
    <article class="news-item">
      <div class="news-meta">
        <span class="news-source">${n.source}</span>
        <span class="news-tag">${n.tag}</span>
        <span class="news-sent ${SENTIMENT_CLASS[n.sentiment]}" title="Sentiment ${n.sentiment}">${SENTIMENT_ICON[n.sentiment]}</span>
        <span class="news-time">${n.time}</span>
      </div>
      <h4 class="news-title">${n.title}</h4>
      <p class="news-summary">${n.summary}</p>
    </article>
  `).join('');
}
