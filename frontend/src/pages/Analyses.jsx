import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';
import AnalysisModalContent from '../components/AnalysisModalContent';

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

const QUICK_LIST_NAME = '~ Quick Analysis';

function AnalysisLabel({ a }) {
  if (!a.symbol) return <span className="text-muted">Full List</span>;
  // If symbol looks like a label (contains spaces), show as badge-style
  if (a.symbol.includes(' ') || a.symbol.includes('(')) {
    return <span className="badge badge-subtle" style={{ fontSize: '.75rem' }}>{a.symbol}</span>;
  }
  return <span className="ticker">{a.symbol}</span>;
}

export default function Analyses() {
  const { data, loading, error, refresh } = useApi('/analyses');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [tab, setTab] = useState('portfolio');
  const toast = useToast();

  const allAnalyses = data?.analyses ?? [];

  // Split into portfolio vs quick analyses
  const portfolioAnalyses = useMemo(() => allAnalyses.filter(a => a.list_name !== QUICK_LIST_NAME), [allAnalyses]);
  const quickAnalyses = useMemo(() => allAnalyses.filter(a => a.list_name === QUICK_LIST_NAME), [allAnalyses]);

  const analyses = tab === 'portfolio' ? portfolioAnalyses : quickAnalyses;

  const onSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'date' ? 'desc' : 'asc');
    }
  };

  // Group by list (portfolio) or flat by date (quick)
  const groupedByList = useMemo(() => {
    const listGroups = {};
    for (const a of analyses) {
      const listKey = tab === 'quick' ? 'Dashboard Analyses' : (a.list_name || 'Unknown List');
      if (!listGroups[listKey]) listGroups[listKey] = {};
      const dateKey = new Date(a.created_at).toLocaleDateString();
      if (!listGroups[listKey][dateKey]) listGroups[listKey][dateKey] = [];
      listGroups[listKey][dateKey].push(a);
    }

    for (const listKey of Object.keys(listGroups)) {
      for (const dateKey of Object.keys(listGroups[listKey])) {
        listGroups[listKey][dateKey].sort((a, b) => {
          let cmp = 0;
          if (sortCol === 'date') cmp = new Date(a.created_at) - new Date(b.created_at);
          else if (sortCol === 'symbol') cmp = (a.symbol || '').localeCompare(b.symbol || '');
          else if (sortCol === 'model') cmp = (a.model_used || '').localeCompare(b.model_used || '');
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }

    const listEntries = Object.entries(listGroups).map(([listName, dateMap]) => {
      const dateEntries = Object.entries(dateMap).sort((a, b) => {
        const cmp = new Date(b[0]) - new Date(a[0]);
        return sortCol === 'date' && sortDir === 'asc' ? -cmp : cmp;
      });
      return [listName, dateEntries];
    });

    listEntries.sort((a, b) => a[0].localeCompare(b[0]));
    return listEntries;
  }, [analyses, sortCol, sortDir, tab]);

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error) return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  const deleteAnalysis = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    setDeleting(true);
    try {
      await api.del(`/analyses/${id}`);
      toast('Analysis deleted', 'success');
      if (selected?.id === id) setSelected(null);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analyses</h1>
          <p className="page-subtitle">AI-generated reports — grouped by list, divided by date</p>
        </div>
      </div>

      <div className="segment" style={{ marginBottom: 20 }}>
        <button className={`segment-btn ${tab === 'portfolio' ? 'active' : ''}`} onClick={() => setTab('portfolio')}>
          Portfolios {portfolioAnalyses.length > 0 && <span className="text-muted" style={{ marginLeft: 4 }}>({portfolioAnalyses.length})</span>}
        </button>
        <button className={`segment-btn ${tab === 'quick' ? 'active' : ''}`} onClick={() => setTab('quick')}>
          Quick Analysis {quickAnalyses.length > 0 && <span className="text-muted" style={{ marginLeft: 4 }}>({quickAnalyses.length})</span>}
        </button>
      </div>

      {analyses.length === 0 ? (
        <EmptyState
          icon="◈"
          title={tab === 'portfolio' ? 'No portfolio analyses yet' : 'No quick analyses yet'}
          description={tab === 'portfolio'
            ? "Open a list and click 'AI Analysis' to generate your first report."
            : "Use the ◈ buttons on the Dashboard movers to analyze stocks."
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {groupedByList.map(([listName, dateGroups]) => (
            <div key={listName} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{listName}</h3>
              </div>

              {dateGroups.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-2)' }}>{dateKey}</span>
                  </div>
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <SortHeader label={tab === 'quick' ? 'Stocks' : 'Symbol'} sortKey="symbol" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <SortHeader label="Preview" sortKey="preview" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <SortHeader label="Time" sortKey="date" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <SortHeader label="Model" sortKey="model" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a) => (
                        <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(a)}>
                          <td><AnalysisLabel a={a} /></td>
                          <td className="text-muted" style={{ fontSize: '.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.result.slice(0, 120)}
                          </td>
                          <td className="text-muted text-sm">
                            {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td><span className="badge badge-subtle">{a.model_used || 'AI'}</span></td>
                          <td className="table-actions">
                            <button
                              className="btn btn-ghost btn-danger btn-sm"
                              onClick={(e) => deleteAnalysis(a.id, e)}
                              disabled={deleting}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`Analysis — ${selected.symbol || selected.list_name}`} onClose={() => setSelected(null)} size="lg">
          <AnalysisModalContent analysis={selected} />
        </Modal>
      )}
    </div>
  );
}
