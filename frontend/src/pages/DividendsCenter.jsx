import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';

function SortHeader({ label, sortKey, sortCol, sortDir, onSort }) {
  const active = sortCol === sortKey;
  return (
    <th className="sortable-th" onClick={() => onSort(sortKey)}>
      {label}
      <span className="sort-indicator">
        {active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
      </span>
    </th>
  );
}

function fmt(val, decimals = 2) {
  if (val == null) return '—';
  return Number(val).toFixed(decimals);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString();
}

function ExDateBadge({ dateStr }) {
  if (!dateStr) return <span className="text-muted">—</span>;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const daysAway = Math.round((d - today) / (1000 * 60 * 60 * 24));

  if (daysAway >= 0 && daysAway <= 30) {
    return (
      <span className="badge" style={{ background: 'rgba(99,102,241,.18)', color: 'var(--primary)', fontWeight: 600 }}>
        {fmtDate(dateStr)}
        <span style={{ marginLeft: 4, fontSize: '.7rem', opacity: .8 }}>({daysAway}d)</span>
      </span>
    );
  }
  if (daysAway < 0) {
    return <span className="text-muted text-sm">{fmtDate(dateStr)}</span>;
  }
  return <span className="text-sm">{fmtDate(dateStr)}</span>;
}

export default function DividendsCenter() {
  const { data, loading, error, refresh } = useApi('/dividends');
  const [sortCol, setSortCol] = useState('yield');
  const [sortDir, setSortDir] = useState('desc');

  const dividends = data?.dividends ?? [];

  const onSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const sorted = useMemo(() => {
    return [...dividends].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'symbol')   cmp = a.symbol.localeCompare(b.symbol);
      if (sortCol === 'name')     cmp = (a.name || '').localeCompare(b.name || '');
      if (sortCol === 'rate')     cmp = (a.dividendRate ?? -1) - (b.dividendRate ?? -1);
      if (sortCol === 'yield')    cmp = (a.dividendYield ?? -1) - (b.dividendYield ?? -1);
      if (sortCol === 'ex-date')  cmp = (a.exDividendDate || '').localeCompare(b.exDividendDate || '');
      if (sortCol === 'last-pay') cmp = (a.lastDividendDate || '').localeCompare(b.lastDividendDate || '');
      if (sortCol === 'last-amt') cmp = (a.lastDividendValue ?? -1) - (b.lastDividendValue ?? -1);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [dividends, sortCol, sortDir]);

  // upcoming ex-dates in next 30 days
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return sorted.filter(d => {
      if (!d.exDividendDate) return false;
      const days = Math.round((new Date(d.exDividendDate + 'T00:00:00') - today) / 86400000);
      return days >= 0 && days <= 30;
    });
  }, [sorted]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dividends Center</h1>
          <p className="page-subtitle">
            {dividends.length} dividend-paying stock{dividends.length !== 1 ? 's' : ''} across your portfolios
            {upcoming.length > 0 && (
              <span style={{ marginLeft: 10, color: 'var(--primary)', fontWeight: 600 }}>
                · {upcoming.length} ex-date{upcoming.length !== 1 ? 's' : ''} in next 30 days
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>↺ Refresh</button>
      </div>

      {dividends.length === 0 ? (
        <EmptyState
          icon="$"
          title="No dividend stocks found"
          description="Add dividend-paying stocks to your portfolios to see them here."
        />
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <SortHeader label="Symbol"      sortKey="symbol"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Name"        sortKey="name"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Annual Rate" sortKey="rate"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Yield %"     sortKey="yield"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Ex-Date"     sortKey="ex-date"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Last Pay"    sortKey="last-pay" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Last Amt"    sortKey="last-amt" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.symbol}>
                  <td><Link to={`/stocks/${d.symbol}`} className="ticker">{d.symbol}</Link></td>
                  <td className="text-muted text-sm" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name || '—'}
                  </td>
                  <td>
                    {d.dividendRate != null
                      ? <span style={{ fontWeight: 500 }}>{d.currency ? `${d.currency} ` : ''}{fmt(d.dividendRate)}</span>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td>
                    {d.dividendYield != null
                      ? <span className="change-badge pos">{fmt(d.dividendYield)}%</span>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td><ExDateBadge dateStr={d.exDividendDate} /></td>
                  <td className="text-muted text-sm">{fmtDate(d.lastDividendDate)}</td>
                  <td className="text-sm">
                    {d.lastDividendValue != null
                      ? `${d.currency ? `${d.currency} ` : ''}${fmt(d.lastDividendValue, 4)}`
                      : <span className="text-muted">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
