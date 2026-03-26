import { useMemo } from 'react';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', CNY: '\u00A5',
  CHF: 'CHF ', CAD: 'C$', AUD: 'A$', HKD: 'HK$', SGD: 'S$',
  KRW: '\u20A9', INR: '\u20B9', BRL: 'R$', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', TWD: 'NT$', ZAR: 'R', MXN: 'MX$', ILS: '\u20AA',
};

function fmtCurrency(value, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency || '?';
  const abs = Math.abs(value);
  // For JPY/KRW use no decimals
  const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : 2;
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${value < 0 ? '-' : ''}${sym}${formatted}`;
}

/**
 * Computes and displays portfolio metrics grouped by currency.
 *
 * Props:
 *   stocks  — array of stock objects (must have .symbol, optionally .currency)
 *   prices  — { [symbol]: { currentPrice, pastPrice, changePercent, currency? } }
 *   period  — current period label (e.g. "1m")
 */
export default function MetricsSummary({ stocks, prices, period }) {
  const metrics = useMemo(() => {
    // Group by currency
    const byCurrency = {};

    for (const s of stocks) {
      const p = prices[s.symbol];
      if (!p || p.currentPrice == null || p.pastPrice == null) continue;

      const currency = p.currency || s.currency || 'USD';
      if (!byCurrency[currency]) {
        byCurrency[currency] = { currency, totalCurrent: 0, totalPast: 0, count: 0 };
      }
      byCurrency[currency].totalCurrent += p.currentPrice;
      byCurrency[currency].totalPast += p.pastPrice;
      byCurrency[currency].count += 1;
    }

    return Object.values(byCurrency).map((g) => {
      const absChange = g.totalCurrent - g.totalPast;
      const pctChange = g.totalPast !== 0 ? (absChange / g.totalPast) * 100 : 0;
      return {
        currency: g.currency,
        count: g.count,
        totalCurrent: g.totalCurrent,
        totalPast: g.totalPast,
        absChange,
        pctChange: Math.round(pctChange * 100) / 100,
      };
    }).sort((a, b) => b.count - a.count); // most stocks first
  }, [stocks, prices]);

  if (metrics.length === 0) return null;

  return (
    <div className="metrics-bar">
      {metrics.map((m) => {
        const isPos = m.absChange >= 0;
        return (
          <div key={m.currency} className="metric-card">
            <div className="metric-label">
              {m.currency} ({m.count} stock{m.count !== 1 ? 's' : ''}) — {period}
            </div>
            <div className="metric-row">
              <span className="metric-value">{fmtCurrency(m.totalCurrent, m.currency)}</span>
              <span className={`change-badge ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? '▲' : '▼'} {fmtCurrency(m.absChange, m.currency)}
              </span>
              <span className={`change-badge ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? '▲' : '▼'} {Math.abs(m.pctChange)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
