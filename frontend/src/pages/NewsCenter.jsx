import { useState, useMemo } from 'react';
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

export default function NewsCenter() {
  const { data, loading, error, refresh } = useApi('/analyses/news/all');
  const [view, setView] = useState('by-stock'); // 'by-stock' | 'by-date'
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedStocks, setExpandedStocks] = useState(new Set());

  const articles = data?.articles ?? [];

  const onSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir(col === 'date' ? 'desc' : 'asc'); }
  };

  const toggleStock = (symbol) => {
    setExpandedStocks((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol); else next.add(symbol);
      return next;
    });
  };

  // Deduplicate by title+symbol
  const unique = useMemo(() => {
    const seen = new Set();
    return articles.filter((a) => {
      const key = `${a.symbol}|${a.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [articles]);

  // Sorted flat list
  const sorted = useMemo(() => {
    return [...unique].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'date') cmp = new Date(a.pub_date || 0) - new Date(b.pub_date || 0);
      else if (sortCol === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortCol === 'source') cmp = (a.source || '').localeCompare(b.source || '');
      else if (sortCol === 'title') cmp = a.title.localeCompare(b.title);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [unique, sortCol, sortDir]);

  // Grouped by stock
  const groupedByStock = useMemo(() => {
    const groups = {};
    for (const a of sorted) {
      if (!groups[a.symbol]) groups[a.symbol] = [];
      groups[a.symbol].push(a);
    }
    return Object.entries(groups).sort((a, b) => {
      if (sortCol === 'symbol') return sortDir === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
      // Sort groups by most recent article date
      const dateA = new Date(a[1][0]?.pub_date || 0);
      const dateB = new Date(b[1][0]?.pub_date || 0);
      return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [sorted, sortCol, sortDir]);

  // Grouped by date
  const groupedByDate = useMemo(() => {
    const groups = {};
    for (const a of sorted) {
      const dateKey = a.pub_date ? new Date(a.pub_date).toLocaleDateString() : 'Unknown Date';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    }
    return Object.entries(groups);
  }, [sorted]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error) return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  const stockCount = new Set(unique.map(a => a.symbol)).size;

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">News Center</h1>
          <p className="page-subtitle">{unique.length} archived articles across {stockCount} stocks</p>
        </div>
        <div className="segment">
          <button className={`segment-btn ${view === 'by-stock' ? 'active' : ''}`} onClick={() => setView('by-stock')}>By Stock</button>
          <button className={`segment-btn ${view === 'by-date' ? 'active' : ''}`} onClick={() => setView('by-date')}>By Date</button>
        </div>
      </div>

      {unique.length === 0 ? (
        <EmptyState icon="📰" title="No news archived" description="News articles are collected when you run AI analyses on stocks." />
      ) : view === 'by-stock' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groupedByStock.map(([symbol, items]) => {
            const isExpanded = expandedStocks.has(symbol);
            return (
              <div key={symbol} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  className="news-group-header"
                  onClick={() => toggleStock(symbol)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--text-3)', fontSize: '.75rem' }}>{isExpanded ? '▾' : '▸'}</span>
                    <span className="ticker">{symbol}</span>
                    <span className="badge badge-subtle">{items.length} article{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-muted text-sm">
                    Latest: {items[0]?.pub_date ? new Date(items[0].pub_date).toLocaleDateString() : '—'}
                  </span>
                </div>
                {isExpanded && (
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <SortHeader label="Title" sortKey="title" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <SortHeader label="Source" sortKey="source" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <SortHeader label="Date" sortKey="date" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a, i) => (
                        <tr key={i}>
                          <td>
                            {a.link ? (
                              <a href={a.link} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 500, fontSize: '.85rem' }}>{a.title}</a>
                            ) : (
                              <span style={{ fontSize: '.85rem' }}>{a.title}</span>
                            )}
                          </td>
                          <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{a.source || '—'}</td>
                          <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{a.pub_date ? new Date(a.pub_date).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groupedByDate.map(([dateKey, items]) => (
            <div key={dateKey}>
              <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                {dateKey}
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <SortHeader label="Symbol" sortKey="symbol" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortHeader label="Title" sortKey="title" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                    <SortHeader label="Source" sortKey="source" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((a, i) => (
                    <tr key={i}>
                      <td><span className="ticker">{a.symbol}</span></td>
                      <td>
                        {a.link ? (
                          <a href={a.link} target="_blank" rel="noreferrer" style={{ color: 'var(--text)', fontWeight: 500, fontSize: '.85rem' }}>{a.title}</a>
                        ) : (
                          <span style={{ fontSize: '.85rem' }}>{a.title}</span>
                        )}
                      </td>
                      <td className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>{a.source || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
