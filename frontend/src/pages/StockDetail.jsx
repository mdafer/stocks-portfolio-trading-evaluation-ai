import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';

const CHART_PERIODS = ['1d', '1w', '1m', '3m', '1y', '5y', '10y'];

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', CNY: '\u00A5',
  CHF: 'CHF ', CAD: 'C$', AUD: 'A$', HKD: 'HK$', SGD: 'S$',
  KRW: '\u20A9', INR: '\u20B9', BRL: 'R$', TWD: 'NT$',
};
function csym(currency) {
  return CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '$');
}

function fmtDate(iso, period) {
  if (!iso) return '';
  const d = new Date(iso);
  if (period === '1d') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (['1w', '1m', '3m'].includes(period)) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

// ── SVG Line Chart ──────────────────────────────────────────────────────────

function PriceChart({ points, period, color }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);
  const gradId = useRef(`cg-${Math.random().toString(36).slice(2, 7)}`).current;

  if (!points || points.length < 2) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-muted text-sm">No chart data available for this period</span>
      </div>
    );
  }

  const W = 600, H = 190, padT = 20, padB = 4;
  const prices = points.map(p => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || Math.abs(minP) * 0.01 || 1;

  const px = (i) => (i / (points.length - 1)) * W;
  const py = (p) => padT + (1 - (p - minP) / range) * (H - padT - padB);

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.price).toFixed(1)}`
  ).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (points.length - 1));
    setHoverIdx(Math.max(0, Math.min(idx, points.length - 1)));
  };

  const hp = hoverIdx !== null ? points[hoverIdx] : null;
  const hx = hoverIdx !== null ? px(hoverIdx) : null;
  const hy = hp ? py(hp.price) : null;
  const tooltipPct = hx !== null ? Math.min(Math.max((hx / W) * 100, 8), 92) : 50;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Y-axis labels */}
      <div style={{ position: 'absolute', top: padT - 4, right: 6, fontSize: '.7rem', color: 'var(--text-3)', lineHeight: 1 }}>
        {maxP.toFixed(2)}
      </div>
      <div style={{ position: 'absolute', bottom: padB + 2, right: 6, fontSize: '.7rem', color: 'var(--text-3)', lineHeight: 1 }}>
        {minP.toFixed(2)}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        {hx !== null && (
          <>
            <line
              x1={hx} y1={padT} x2={hx} y2={H}
              stroke={color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3,3"
            />
            <circle cx={hx} cy={hy} r="4.5" fill={color} stroke="var(--bg-2)" strokeWidth="2.5" />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hp && (
        <div style={{
          position: 'absolute',
          top: 4,
          left: `${tooltipPct}%`,
          transform: 'translateX(-50%)',
          background: 'var(--bg-3)',
          border: '1px solid var(--border-2)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: '0.78rem',
          fontWeight: 600,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: 'var(--shadow)',
        }}>
          {hp.price.toFixed(2)}
          <span style={{ marginLeft: 6, color: 'var(--text-2)', fontWeight: 400 }}>
            {fmtDate(hp.date, period)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useApi(`/stocks/${symbol}/detail`);

  const [chartPeriod, setChartPeriod] = useState('1m');
  const [chartData, setChartData]     = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError]   = useState(null);

  const fetchChart = useCallback(async (period) => {
    setChartLoading(true);
    setChartError(null);
    try {
      const d = await api.get(`/stocks/${symbol}/chart?period=${period}`);
      setChartData(d.chart);
    } catch (err) {
      setChartError(err.message);
    } finally {
      setChartLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetchChart(chartPeriod); }, [fetchChart, chartPeriod]);

  const quote    = data?.quote;
  const holdings = data?.holdings ?? [];

  const isPos      = (quote?.changePercent ?? 0) >= 0;
  const chartColor = isPos ? '#10b981' : '#f43f5e';

  // Per-holding portfolio %
  const holdingsWithPct = useMemo(() => holdings.map(h => {
    let pct = null;
    if (h.allocation != null) {
      if (h.allocation_type === 'percent') {
        pct = h.allocation;
      } else if (h.list_total_value > 0) {
        pct = (h.allocation / h.list_total_value) * 100;
      }
    }
    return { ...h, pct };
  }), [holdings]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} onRetry={() => navigate(0)} /></div>;

  return (
    <div className="page" style={{ maxWidth: 920 }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            className="breadcrumb"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{symbol}</h1>
            {quote?.name && (
              <span className="text-muted" style={{ fontSize: '1rem' }}>{quote.name}</span>
            )}
          </div>
          {quote?.latestTradingDay && (
            <p className="page-subtitle" style={{ marginTop: 2 }}>
              Last trading day: {quote.latestTradingDay}
            </p>
          )}
        </div>

        {/* Price box */}
        {quote && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>
              {csym(quote.currency)}{quote.price != null ? quote.price.toFixed(2) : '—'}
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`change-badge ${isPos ? 'pos' : 'neg'}`} style={{ fontSize: '0.9rem' }}>
                {isPos ? '▲' : '▼'} {Math.abs(quote.changePercent ?? 0).toFixed(2)}%
                {quote.change != null && (
                  <span style={{ marginLeft: 4, opacity: 0.8 }}>
                    ({isPos ? '+' : ''}{quote.change.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
            {quote.volume != null && (
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                Vol: {quote.volume.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Holdings ── */}
      {holdingsWithPct.length > 0 && (
        <div className="panel">
          <h3 className="panel-title" style={{ marginBottom: 14 }}>Your Holdings</h3>
          <table className="table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>Portfolio</th>
                <th>Allocation</th>
                <th>Portfolio %</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {holdingsWithPct.map(h => (
                <tr key={h.list_id}>
                  <td>
                    <Link to={`/lists/${h.list_id}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                      {h.list_name}
                    </Link>
                  </td>
                  <td>
                    {h.allocation != null ? (
                      <strong>
                        {h.allocation_type === 'value'
                          ? `${csym(quote?.currency)}${Number(h.allocation).toLocaleString()}`
                          : `${h.allocation}%`}
                      </strong>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {h.pct != null ? (
                      <span className="badge" style={{
                        background: 'var(--primary-dim)',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}>
                        {h.pct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted text-sm">
                    {h.added_at
                      ? new Date(h.added_at.replace(' ', 'T')).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {holdingsWithPct.length === 0 && !loading && (
        <div className="panel" style={{ padding: '14px 20px' }}>
          <span className="text-muted text-sm">
            {symbol} is not in any of your portfolios.{' '}
            <Link to="/lists" style={{ color: 'var(--primary)' }}>Add it to a list →</Link>
          </span>
        </div>
      )}

      {/* ── Chart ── */}
      <div className="panel">
        <div className="panel-header" style={{ marginBottom: 12 }}>
          <h3 className="panel-title">Price History</h3>
          <div className="segment">
            {CHART_PERIODS.map(p => (
              <button
                key={p}
                className={`segment-btn ${p === chartPeriod ? 'active' : ''}`}
                onClick={() => setChartPeriod(p)}
                disabled={chartLoading}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: 200 }}>
          {chartLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.15)', borderRadius: 8, zIndex: 2,
            }}>
              <Spinner center />
            </div>
          )}
          {chartError && !chartLoading && (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="text-muted text-sm">Failed to load chart: {chartError}</span>
            </div>
          )}
          {!chartError && (
            <PriceChart points={chartData?.points} period={chartPeriod} color={chartColor} />
          )}
        </div>

        {/* Chart footer stats */}
        {chartData?.points?.length > 1 && (() => {
          const pts = chartData.points;
          const first = pts[0].price;
          const last  = pts[pts.length - 1].price;
          const chg   = last - first;
          const chgPct = (chg / first) * 100;
          const periodPos = chgPct >= 0;
          return (
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <div>
                <div className="text-muted text-sm">Period open</div>
                <div style={{ fontWeight: 600 }}>{csym(chartData.currency)}{first.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted text-sm">Period close</div>
                <div style={{ fontWeight: 600 }}>{csym(chartData.currency)}{last.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted text-sm">Period change</div>
                <div style={{ fontWeight: 600, color: periodPos ? 'var(--green)' : 'var(--red)' }}>
                  {periodPos ? '+' : ''}{chg.toFixed(2)} ({periodPos ? '+' : ''}{chgPct.toFixed(2)}%)
                </div>
              </div>
              <div>
                <div className="text-muted text-sm">Data points</div>
                <div style={{ fontWeight: 600 }}>{pts.length}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
