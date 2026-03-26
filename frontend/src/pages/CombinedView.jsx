import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import EmptyState from '../components/EmptyState';
import MetricsSummary from '../components/MetricsSummary';

const PERIODS = ['1d', '1w', '1m', '1y', '5y', '10y'];

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', CNY: '\u00A5',
  CHF: 'CHF ', CAD: 'C$', AUD: 'A$', HKD: 'HK$', SGD: 'S$',
  KRW: '\u20A9', INR: '\u20B9', BRL: 'R$', TWD: 'NT$',
};
function csym(currency) { return CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '$'); }

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

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.floor(min / 60)}h ago`;
  return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleDateString();
}

export default function CombinedView() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const ids = searchParams.get('ids') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1m');
  const [refreshing, setRefreshing] = useState(false);
  const [sortCol, setSortCol] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');
  const [expanded, setExpanded] = useState(new Set());

  const fetchData = useCallback(async (p) => {
    try {
      const d = await api.get(`/lists/compare?ids=${ids}&period=${p}`);
      setData(d);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const onSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const toggleExpand = (symbol) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      // Refresh prices for each list
      const listIds = ids.split(',').filter(Boolean);
      for (const listId of listIds) {
        await api.post(`/lists/${listId}/prices/refresh`, { period });
      }
      await fetchData(period);
      toast('Prices refreshed', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Group stocks by symbol, tracking which lists they appear in
  const grouped = useMemo(() => {
    if (!data?.stocks) return [];
    const prices = data.prices || {};

    const bySymbol = {};
    for (const s of data.stocks) {
      if (!bySymbol[s.symbol]) {
        bySymbol[s.symbol] = {
          symbol: s.symbol,
          name: s.name,
          currency: s.currency,
          entries: [],
        };
      }
      bySymbol[s.symbol].entries.push({
        list_id: s.list_id,
        list_name: s.list_name,
        allocation: s.allocation,
        allocation_type: s.allocation_type,
        added_at: s.added_at,
      });
    }

    const rows = Object.values(bySymbol);

    rows.sort((a, b) => {
      let cmp = 0;
      const pa = prices[a.symbol];
      const pb = prices[b.symbol];
      if (sortCol === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortCol === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortCol === 'price') cmp = (pa?.currentPrice ?? 0) - (pb?.currentPrice ?? 0);
      else if (sortCol === 'change') cmp = (pa?.changePercent ?? 0) - (pb?.changePercent ?? 0);
      else if (sortCol === 'lists') cmp = a.entries.length - b.entries.length;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [data, sortCol, sortDir]);

  // Deduplicated stock list for metrics (one per symbol)
  const uniqueStocks = useMemo(() => {
    return grouped.map((row) => ({ symbol: row.symbol, name: row.name, currency: row.currency }));
  }, [grouped]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error) return <div className="page"><PageError message={error} /></div>;

  const prices = data?.prices || {};
  const lists = data?.lists || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/lists" className="breadcrumb">← My Lists</Link>
          <h1 className="page-title">Combined View</h1>
          <p className="page-subtitle">
            Comparing {lists.length} list{lists.length !== 1 ? 's' : ''}: {lists.map((l) => l.name).join(', ')}
          </p>
        </div>
      </div>

      <MetricsSummary stocks={uniqueStocks} prices={prices} period={period} />

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-left">
            <h3 className="panel-title">All Holdings</h3>
            {data?.lastUpdated ? (
              <span className="price-age">Updated {timeAgo(data.lastUpdated)}</span>
            ) : grouped.length > 0 ? (
              <span className="price-age price-age-none">No price data — click Refresh</span>
            ) : null}
          </div>
          <div className="toolbar">
            <div className="segment">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  className={`segment-btn ${p === period ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={refreshPrices}
              className="btn btn-sm"
              disabled={refreshing || grouped.length === 0}
            >
              {refreshing ? <Spinner size="sm" /> : '↻ Refresh'}
            </button>
          </div>
        </div>

        {grouped.length === 0 ? (
          <EmptyState icon="📊" title="No stocks" description="The selected lists have no stocks." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <SortHeader label="Symbol" sortKey="symbol" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Name" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Price" sortKey="price" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label={`Change (${period})`} sortKey="change" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="In Lists" sortKey="lists" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {grouped.map((row) => {
                const p = prices[row.symbol];
                const isPos = p?.changePercent >= 0;
                const multi = row.entries.length > 1;
                const isExpanded = expanded.has(row.symbol);

                return (
                  <Fragment key={row.symbol}>
                    <tr
                      className={multi ? 'expandable-row' : ''}
                      onClick={multi ? () => toggleExpand(row.symbol) : undefined}
                      style={multi ? { cursor: 'pointer' } : undefined}
                    >
                      <td style={{ width: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: '.75rem' }}>
                        {multi ? (isExpanded ? '▾' : '▸') : ''}
                      </td>
                      <td><Link to={`/stocks/${row.symbol}`} className="ticker">{row.symbol}</Link></td>
                      <td className="text-muted">{row.name}</td>
                      <td>
                        {p
                          ? <strong>{csym(p.currency || row.currency)}{p.currentPrice.toFixed(2)}</strong>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {p
                          ? <span className={`change-badge ${isPos ? 'pos' : 'neg'}`}>{isPos ? '▲' : '▼'} {Math.abs(p.changePercent)}%</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {multi ? (
                          <span className="badge badge-subtle">{row.entries.length} lists</span>
                        ) : (
                          <span className="text-muted text-sm">{row.entries[0].list_name}</span>
                        )}
                      </td>
                    </tr>
                    {multi && isExpanded && row.entries.map((entry) => (
                      <tr key={`${row.symbol}-${entry.list_id}`} className="sub-row">
                        <td />
                        <td />
                        <td colSpan={2} style={{ paddingLeft: 20 }}>
                          <span className="sub-row-list">{entry.list_name}</span>
                        </td>
                        <td />
                        <td>
                          {entry.allocation ? (
                            <span className="allocation-pill">
                              {entry.allocation_type === 'value' ? `$${entry.allocation}` : `${entry.allocation}%`}
                            </span>
                          ) : (
                            <span className="text-muted text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
