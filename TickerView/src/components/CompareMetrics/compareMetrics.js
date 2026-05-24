/* ══════════════════════════════════════════════════════════════
   TICKERVIEW — Compare Metrics Component
   src/components/CompareMetrics/compareMetrics.js
   Renders a side-by-side metrics comparison table for two symbols.
══════════════════════════════════════════════════════════════ */

/**
 * Format a price value based on its magnitude.
 */
function fmtPrice(v) {
    if (v === '—' || v === undefined || v === null) return '—';
    if (v > 100) return `$${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${Number(v).toFixed(4)}`;
  }
  
  /**
   * Returns 'a', 'b', or null — which side wins this metric.
   * direction: 'higher' = bigger is better, 'lower' = smaller is better.
   */
  function winner(a, b, direction) {
    const na = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
    const nb = parseFloat(String(b).replace(/[^0-9.-]/g, ''));
    if (isNaN(na) || isNaN(nb)) return null;
    if (na === nb) return null;
    return direction === 'higher'
      ? (na > nb ? 'a' : 'b')
      : (na < nb ? 'a' : 'b');
  }
  
  /**
   * Build the metrics row definitions for two symbol data objects.
   */
  function buildRows(dA, dB) {
    const changeA = `${dA.changePct >= 0 ? '+' : ''}${dA.changePct.toFixed(2)}%`;
    const changeB = `${dB.changePct >= 0 ? '+' : ''}${dB.changePct.toFixed(2)}%`;
  
    return [
      {
        label: 'Prix actuel',
        a: fmtPrice(dA.price),
        b: fmtPrice(dB.price),
        win: null,
      },
      {
        label: 'Variation 24h',
        a: changeA, b: changeB,
        win: winner(dA.changePct, dB.changePct, 'higher'),
      },
      {
        label: 'Market Cap',
        a: dA.marketCap !== '—' ? dA.marketCap : '—',
        b: dB.marketCap !== '—' ? dB.marketCap : '—',
        win: null,
      },
      {
        label: 'Volume 24h',
        a: dA.volume, b: dB.volume,
        win: null,
      },
      {
        label: 'P/E Ratio',
        a: dA.pe !== '—' && dA.pe ? `${dA.pe}×` : '—',
        b: dB.pe !== '—' && dB.pe ? `${dB.pe}×` : '—',
        win: (dA.pe !== '—' && dB.pe !== '—' && dA.pe && dB.pe)
          ? winner(dA.pe, dB.pe, 'lower')
          : null,
      },
      {
        label: 'EPS',
        a: dA.eps !== '—' && dA.eps ? `$${dA.eps}` : '—',
        b: dB.eps !== '—' && dB.eps ? `$${dB.eps}` : '—',
        win: (dA.eps !== '—' && dB.eps !== '—' && dA.eps && dB.eps)
          ? winner(dA.eps, dB.eps, 'higher')
          : null,
      },
      {
        label: 'Gross Margin',
        a: dA.grossMargin !== '—' ? dA.grossMargin : '—',
        b: dB.grossMargin !== '—' ? dB.grossMargin : '—',
        win: (dA.grossMargin !== '—' && dB.grossMargin !== '—')
          ? winner(
              parseFloat(dA.grossMargin),
              parseFloat(dB.grossMargin),
              'higher'
            ) === 'a' ? 'a' : 'b'
          : null,
      },
      {
        label: 'Beta',
        a: String(dA.beta), b: String(dB.beta),
        win: (String(dA.beta) !== '—' && String(dB.beta) !== '—')
          ? winner(dA.beta, dB.beta, 'lower')
          : null,
      },
      {
        label: '52W High',
        a: dA.week52High > 100
          ? `$${Math.round(dA.week52High).toLocaleString('fr-FR')}`
          : `$${Number(dA.week52High).toFixed(4)}`,
        b: dB.week52High > 100
          ? `$${Math.round(dB.week52High).toLocaleString('fr-FR')}`
          : `$${Number(dB.week52High).toFixed(4)}`,
        win: null,
      },
      {
        label: '52W Low',
        a: dA.week52Low > 100
          ? `$${Math.round(dA.week52Low).toLocaleString('fr-FR')}`
          : `$${Number(dA.week52Low).toFixed(4)}`,
        b: dB.week52Low > 100
          ? `$${Math.round(dB.week52Low).toLocaleString('fr-FR')}`
          : `$${Number(dB.week52Low).toFixed(4)}`,
        win: null,
      },
      {
        label: 'Div. Yield',
        a: dA.divYield, b: dB.divYield,
        win: null,
      },
      {
        label: 'Exchange',
        a: dA.exchange, b: dB.exchange,
        win: null,
      },
    ];
  }
  
  /**
   * Render the comparison metrics table.
   * @param {object} dataA – symbol A data from symbolRegistry
   * @param {object} dataB – symbol B data from symbolRegistry
   */
  export function renderCompareMetrics(dataA, dataB) {
    const el = document.getElementById('compare-metrics-table');
    if (!el || !dataA || !dataB) return;
  
    const rows = buildRows(dataA, dataB);
    const isUpA = dataA.changePct >= 0;
    const isUpB = dataB.changePct >= 0;
  
    el.innerHTML = `
      <table class="cm-table">
        <thead>
          <tr>
            <th class="cm-th-label">Métrique</th>
            <th class="cm-th-sym cm-th-a">${dataA.sym}</th>
            <th class="cm-th-sym cm-th-b">${dataB.sym}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr class="cm-row">
              <td class="cm-label">${row.label}</td>
              <td class="cm-val ${row.win === 'a' ? 'cm-win-a' : ''}">${row.a}</td>
              <td class="cm-val ${row.win === 'b' ? 'cm-win-b' : ''}">${row.b}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  /**
   * Render a compact symbol info card in the bottom strip.
   * @param {string}  elId    – element id
   * @param {object}  data    – symbol data
   * @param {string}  side    – 'a' | 'b'  (determines accent color)
   */
  export function renderSymCard(elId, data, side) {
    const el = document.getElementById(elId);
    if (!el || !data) return;
  
    const isUp   = data.changePct >= 0;
    const fmtP   = data.price > 100
      ? `$${data.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${data.price.toFixed(4)}`;
    const color  = side === 'a' ? 'var(--accent)' : 'var(--blue)';
  
    el.innerHTML = `
      <div class="csc-sym" style="color:${color}">${data.sym}</div>
      <div class="csc-name">${data.name}</div>
      <div class="csc-price">${fmtP}</div>
      <div class="csc-badge ${isUp ? 'up' : 'dn'}">
        ${isUp ? '+' : ''}${data.changePct.toFixed(2)}%
      </div>
      <div class="csc-facts">
        <div class="csc-fact"><span>Exchange</span><span>${data.exchange}</span></div>
        <div class="csc-fact"><span>Market Cap</span><span>${data.marketCap}</span></div>
        <div class="csc-fact"><span>Volume</span><span>${data.volume}</span></div>
        <div class="csc-fact"><span>Secteur</span><span>${data.sector}</span></div>
      </div>
    `;
  }