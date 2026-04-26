import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';
import Modal from '../components/Modal';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtRevenue(val) {
  if (val == null) return '—';
  const abs = Math.abs(val);
  if (abs >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

function fmtUtcTime(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d)) return null;
  // Skip if timestamp is exactly 00:00:00 UTC — that signals a date-only estimate.
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) return null;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

function ReportDateBadge({ dateStr, isEstimate, dateTimeUTC }) {
  if (!dateStr) return <span className="text-muted">—</span>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const daysAway = Math.round((d - today) / 86400000);
  const utcTime = fmtUtcTime(dateTimeUTC);

  let style = {};
  if (daysAway >= 0 && daysAway <= 7) {
    style = { background: 'rgba(239,68,68,.18)', color: 'var(--danger, #ef4444)', fontWeight: 600 };
  } else if (daysAway > 7 && daysAway <= 30) {
    style = { background: 'rgba(99,102,241,.18)', color: 'var(--primary)', fontWeight: 600 };
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: 1.2 }}>
      <span className="badge" style={style}>
        {fmtDate(dateStr)}
        {daysAway >= 0 && (
          <span style={{ marginLeft: 4, fontSize: '.7rem', opacity: .8 }}>
            ({daysAway === 0 ? 'today' : `${daysAway}d`})
          </span>
        )}
        {isEstimate && (
          <span style={{ marginLeft: 4, fontSize: '.65rem', opacity: .7, fontStyle: 'italic' }}>
            est.
          </span>
        )}
      </span>
      {utcTime && (
        <span className="mono text-muted" style={{ fontSize: '.7rem' }}>
          {utcTime}
        </span>
      )}
    </span>
  );
}

function SymbolCell({ r }) {
  return (
    <td onClick={(e) => e.stopPropagation()} style={{ width: 90 }}>
      <Link to={`/stocks/${r.symbol}`} className="ticker">{r.symbol}</Link>
    </td>
  );
}

function NameCell({ r }) {
  return (
    <td className="text-muted text-sm" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {r.name || '—'}
    </td>
  );
}

function UpcomingTable({ rows, onSelect }) {
  if (rows.length === 0) {
    return <EmptyState icon="📅" title="No matching reports" description="Try clearing the search or switching tabs." />;
  }
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Report Date</th>
            <th>EPS Estimate</th>
            <th>EPS Range</th>
            <th>Revenue Estimate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} onClick={() => onSelect(r)} style={{ cursor: 'pointer' }} title="View past reports">
              <SymbolCell r={r} />
              <NameCell r={r} />
              <td>
                <ReportDateBadge dateStr={r.earningsDate} isEstimate={r.isEstimate} dateTimeUTC={r.earningsDateTimeUTC} />
                {r.earningsDateEnd && (
                  <span className="text-muted text-sm" style={{ marginLeft: 6 }}>
                    – {fmtDate(r.earningsDateEnd)}
                  </span>
                )}
              </td>
              <td>{r.epsAvg != null ? r.epsAvg.toFixed(2) : <span className="text-muted">—</span>}</td>
              <td className="text-sm text-muted">
                {r.epsLow != null && r.epsHigh != null
                  ? `${r.epsLow.toFixed(2)} – ${r.epsHigh.toFixed(2)}`
                  : '—'}
              </td>
              <td className="text-sm">{fmtRevenue(r.revenueAvg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PastTable({ rows, onSelect }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No reports in the last 90 days"
        description="Either no companies in this list have reported recently, or the data isn't available yet."
      />
    );
  }
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Quarter Ended</th>
            <th>EPS Estimate</th>
            <th>EPS Actual</th>
            <th>Difference</th>
            <th>Surprise %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const beat = r.surprisePercent != null && r.surprisePercent > 0;
            const miss = r.surprisePercent != null && r.surprisePercent < 0;
            return (
              <tr key={`${r.symbol}-${r.quarter}`} onClick={() => onSelect(r)} style={{ cursor: 'pointer' }} title="View full report history">
                <SymbolCell r={r} />
                <NameCell r={r} />
                <td>{fmtDate(r.quarter)}</td>
                <td>{r.epsEstimate != null ? r.epsEstimate.toFixed(2) : '—'}</td>
                <td><strong>{r.epsActual != null ? r.epsActual.toFixed(2) : '—'}</strong></td>
                <td style={{ color: beat ? 'var(--green)' : miss ? 'var(--red)' : 'inherit', fontWeight: 500 }}>
                  {r.epsDifference != null
                    ? (r.epsDifference > 0 ? '+' : '') + r.epsDifference.toFixed(2)
                    : '—'}
                </td>
                <td>
                  {r.surprisePercent != null ? (
                    <span className={`change-badge ${beat ? 'pos' : miss ? 'neg' : ''}`}>
                      {r.surprisePercent > 0 ? '+' : ''}{r.surprisePercent.toFixed(2)}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryModal({ row, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    api.get(`/earnings/${encodeURIComponent(row.symbol)}/history`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row.symbol]);

  const upcoming = data?.upcoming;
  const history  = data?.history ?? [];

  return (
    <Modal title={`${row.symbol} — Earnings Reports`} onClose={onClose} size="lg">
      {loading && <Spinner center />}
      {error && <PageError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '.85rem', textTransform: 'uppercase', color: 'var(--text-2)', letterSpacing: '.5px' }}>
              Next Report
            </h4>
            <div className="panel" style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
              <ReportDateBadge dateStr={upcoming?.earningsDate} isEstimate={upcoming?.isEstimate} dateTimeUTC={upcoming?.earningsDateTimeUTC} />
              <div className="text-sm">
                <span className="text-muted">EPS estimate: </span>
                <strong>{upcoming?.epsAvg != null ? upcoming.epsAvg.toFixed(2) : '—'}</strong>
                {upcoming?.epsLow != null && upcoming?.epsHigh != null && (
                  <span className="text-muted"> ({upcoming.epsLow.toFixed(2)} – {upcoming.epsHigh.toFixed(2)})</span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted">Revenue estimate: </span>
                <strong>{fmtRevenue(upcoming?.revenueAvg)}</strong>
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 8px', fontSize: '.85rem', textTransform: 'uppercase', color: 'var(--text-2)', letterSpacing: '.5px' }}>
            Past Reports
          </h4>

          {history.length === 0 ? (
            <EmptyState icon="📊" title="No historical earnings data" description="Yahoo Finance hasn't returned past quarterly results for this symbol." />
          ) : (
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Quarter Ended</th>
                    <th>EPS Estimate</th>
                    <th>EPS Actual</th>
                    <th>Difference</th>
                    <th>Surprise %</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const beat = h.surprisePercent != null && h.surprisePercent > 0;
                    const miss = h.surprisePercent != null && h.surprisePercent < 0;
                    return (
                      <tr key={`${h.quarter}-${i}`}>
                        <td>{fmtDate(h.quarter)}</td>
                        <td>{h.epsEstimate != null ? h.epsEstimate.toFixed(2) : '—'}</td>
                        <td><strong>{h.epsActual != null ? h.epsActual.toFixed(2) : '—'}</strong></td>
                        <td style={{ color: beat ? 'var(--green)' : miss ? 'var(--red)' : 'inherit', fontWeight: 500 }}>
                          {h.epsDifference != null
                            ? (h.epsDifference > 0 ? '+' : '') + h.epsDifference.toFixed(2)
                            : '—'}
                        </td>
                        <td>
                          {h.surprisePercent != null ? (
                            <span className={`change-badge ${beat ? 'pos' : miss ? 'neg' : ''}`}>
                              {h.surprisePercent > 0 ? '+' : ''}{h.surprisePercent.toFixed(2)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Link to={`/stocks/${row.symbol}`} className="btn btn-ghost btn-sm" onClick={onClose}>
              View full stock detail →
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function EarningsCenter() {
  const { data, loading, error, refresh } = useApi('/earnings');
  const [period, setPeriod] = useState('upcoming'); // 'upcoming' | 'past'
  const [group, setGroup]   = useState('portfolio'); // 'portfolio' | 'top'
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const portfolio = data?.portfolio ?? { upcoming: [], past: [] };
  const top       = data?.top       ?? { upcoming: [], past: [] };

  const portfolioUpcomingSoon = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (portfolio.upcoming || []).filter(r => {
      if (!r.earningsDate) return false;
      const days = Math.round((new Date(r.earningsDate + 'T00:00:00') - today) / 86400000);
      return days >= 0 && days <= 30;
    });
  }, [portfolio.upcoming]);

  const baseRows = useMemo(() => {
    const groupData = group === 'portfolio' ? portfolio : top;
    return groupData[period] || [];
  }, [group, period, portfolio, top]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseRows;
    return baseRows.filter(r =>
      r.symbol.toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q)
    );
  }, [baseRows, search]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings Calendar</h1>
          <p className="page-subtitle">
            Upcoming and past financial reports for your holdings and the largest US-listed companies.
            {portfolioUpcomingSoon.length > 0 && (
              <span style={{ marginLeft: 10, color: 'var(--primary)', fontWeight: 600 }}>
                · {portfolioUpcomingSoon.length} of yours in next 30 days
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>↺ Refresh</button>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${period === 'upcoming' ? 'active' : ''}`}
          onClick={() => setPeriod('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`settings-tab ${period === 'past' ? 'active' : ''}`}
          onClick={() => setPeriod('past')}
        >
          Previous (90 days)
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn btn-sm ${group === 'portfolio' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setGroup('portfolio')}
          >
            My Holdings <span style={{ opacity: .7, marginLeft: 4 }}>({portfolio[period]?.length ?? 0})</span>
          </button>
          <button
            className={`btn btn-sm ${group === 'top' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setGroup('top')}
          >
            Top Companies <span style={{ opacity: .7, marginLeft: 4 }}>({top[period]?.length ?? 0})</span>
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Search by symbol or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>
        )}
        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
          {rows.length} of {baseRows.length}
        </span>
      </div>

      {group === 'portfolio' && baseRows.length === 0 && !search ? (
        <EmptyState
          icon={period === 'upcoming' ? '📅' : '📊'}
          title={period === 'upcoming' ? 'No upcoming reports for your holdings' : 'No reports from your holdings in the last 90 days'}
          description="Add stocks to a portfolio, or check back later."
        />
      ) : period === 'upcoming' ? (
        <UpcomingTable rows={rows} onSelect={setSelected} />
      ) : (
        <PastTable rows={rows} onSelect={setSelected} />
      )}

      {selected && <HistoryModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
