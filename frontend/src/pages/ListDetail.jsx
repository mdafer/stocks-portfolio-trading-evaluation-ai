import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';
import AnalysisModalContent from '../components/AnalysisModalContent';
import MetricsSummary from '../components/MetricsSummary';
import PromptPicker from '../components/PromptPicker';
import { usePromptMessage } from '../hooks/usePromptMessage';

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

const PERIODS = ['1d', '1w', '1m', '1y', '5y', '10y'];

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', CNY: '\u00A5',
  CHF: 'CHF ', CAD: 'C$', AUD: 'A$', HKD: 'HK$', SGD: 'S$',
  KRW: '\u20A9', INR: '\u20B9', BRL: 'R$', TWD: 'NT$',
};
function csym(currency) { return CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '$'); }

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1)    return 'just now';
  if (min < 60)   return `${min}m ago`;
  if (min < 1440) return `${Math.floor(min / 60)}h ago`;
  return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleDateString();
}

const ANALYSIS_STEPS = [
  "Fetching live market prices...",
  "Gathering recent news context...",
  "Cross-referencing financial data...",
  "Booping with AI...",
  "Writing final report...",
];

function AnalyzingProgress({ prefix }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="analysis-loading" style={{ gap: '8px' }}>
      <Spinner center />
      <p className="text-muted">{prefix}</p>
      <p style={{ marginTop: '4px', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
        {ANALYSIS_STEPS[step]}
      </p>
    </div>
  );
}

export default function ListDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(`/lists/${id}`);

  // Search
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  // Prices
  const [prices, setPrices]         = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [period, setPeriod]         = useState('1m');
  const [refreshing, setRefreshing] = useState(false);

  // List-level analysis modal
  const [listModal, setListModal]   = useState(false);
  const listPrompt = usePromptMessage();
  const [listAnalysis, setListAnalysis] = useState(null);
  const [analyzingList, setAnalyzingList] = useState(false);

  // Per-stock analysis modal
  const [stockModal, setStockModal] = useState(null);
  // { symbol, name, step: 'input'|'loading'|'result', analysis }
  const stockPrompt = usePromptMessage();

  const [editingAllocation, setEditingAllocation] = useState(null);
  // { symbol, allocation, allocation_type }

  // Inline rename
  const [editingName, setEditingName] = useState(null);

  const renameList = async () => {
    const newName = editingName?.trim();
    if (!newName) { setEditingName(null); return; }
    try {
      await api.put(`/lists/${id}`, { name: newName });
      toast('List renamed', 'success');
      setEditingName(null);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Sorting
  const [sortCol, setSortCol] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');

  const onSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Load cached prices whenever period or list changes
  const loadCachedPrices = useCallback(async () => {
    try {
      const d = await api.get(`/lists/${id}/prices?period=${period}`);
      setPrices(d.prices || {});
      setLastUpdated(d.lastUpdated || null);
    } catch {
      // silently ignore — prices just won't show until refreshed
    }
  }, [id, period]);

  useEffect(() => {
    if (data?.list) loadCachedPrices();
  }, [data?.list, loadCachedPrices]);

  // ── Stocks ─────────────────────────────────────────────────────────────────

  const searchStocks = async (e) => {
    e.preventDefault();
    setSearching(true);
    setResults([]);
    try {
      const d = await api.get(`/stocks/search?q=${encodeURIComponent(search)}`);
      const r = d.results || [];
      setResults(r);
      if (r.length === 0) toast('No results found', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const addStock = async (symbol, name) => {
    try {
      await api.post(`/stocks/lists/${id}`, { symbol, name });
      toast(`${symbol} added`, 'success');
      setResults([]);
      setSearch('');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const removeStock = async (symbol) => {
    try {
      await api.del(`/stocks/lists/${id}/${symbol}`);
      toast(`${symbol} removed`, 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // ── Prices ─────────────────────────────────────────────────────────────────

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const d = await api.post(`/lists/${id}/prices/refresh`, { period });
      setPrices(d.prices || {});
      setLastUpdated(d.lastUpdated || null);
      if (d.errors?.length) {
        toast(`Updated. ${d.errors.length} failed: ${d.errors.join('; ')}`, 'info');
      } else {
        const count = Object.keys(d.prices || {}).length;
        toast(`${count} price${count !== 1 ? 's' : ''} updated`, 'success');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // ── List analysis ───────────────────────────────────────────────────────────

  const runListAnalysis = async (e) => {
    e.preventDefault();
    setAnalyzingList(true);
    try {
      if (listPrompt.msg.trim()) await listPrompt.maybeSave(listPrompt.msg);
      const d = await api.post('/analyses/trigger', {
        list_id: id,
        user_message: listPrompt.msg || undefined,
        // The backend trigger doesn't currently use specific allocations in its logic
        // but we pass them for future context if the prompt builder is updated.
      });
      setListAnalysis(d.analysis);
    } catch (err) {
      toast(err.message, 'error');
      setListModal(false);
    } finally {
      setAnalyzingList(false);
    }
  };

  const closeListModal = () => { setListModal(false); setListAnalysis(null); listPrompt.reset(); };

  // ── Per-stock analysis ──────────────────────────────────────────────────────

  const openStockAnalysis = (symbol, name) => {
    stockPrompt.reset();
    setStockModal({ symbol, name, step: 'input', result: null });
  };

  const runStockAnalysis = async (e) => {
    e.preventDefault();
    const { symbol } = stockModal;
    if (stockPrompt.msg.trim()) await stockPrompt.maybeSave(stockPrompt.msg);
    setStockModal((prev) => ({ ...prev, step: 'loading' }));
    try {
      const d = await api.post('/analyses/trigger', {
        list_id: id,
        symbol,
        user_message: stockPrompt.msg || undefined,
      });
      setStockModal((prev) => ({ ...prev, step: 'result', analysis: d.analysis }));
    } catch (err) {
      toast(err.message, 'error');
      setStockModal(null);
    }
  };

  const closeStockModal = () => setStockModal(null);

  const updateAllocation = async (e) => {
    e.preventDefault();
    const { symbol, allocation, allocation_type } = editingAllocation;
    try {
      await api.put(`/stocks/lists/${id}/${symbol}`, {
        allocation: parseFloat(allocation),
        allocation_type,
      });
      toast(`Allocation updated for ${symbol}`, 'success');
      setEditingAllocation(null);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Sorted stocks (must be before early returns to preserve hook order)
  const rawStocks = data?.stocks ?? [];

  const stocks = useMemo(() => {
    return [...rawStocks].sort((a, b) => {
      let cmp = 0;
      const pa = prices[a.symbol];
      const pb = prices[b.symbol];
      if (sortCol === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortCol === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortCol === 'price') cmp = (pa?.currentPrice ?? 0) - (pb?.currentPrice ?? 0);
      else if (sortCol === 'change') cmp = (pa?.changePercent ?? 0) - (pb?.changePercent ?? 0);
      else if (sortCol === 'allocation') cmp = (a.allocation ?? 0) - (b.allocation ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rawStocks, prices, sortCol, sortDir]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} /></div>;
  if (!data?.list) return <div className="page"><PageError message="List not found" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/" className="breadcrumb">← My Lists</Link>
          {editingName !== null ? (
            <input
              className="inline-edit-input"
              style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={renameList}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameList();
                if (e.key === 'Escape') setEditingName(null);
              }}
              autoFocus
            />
          ) : (
            <h1 className="page-title" style={{ cursor: 'pointer' }} onClick={() => setEditingName(data.list.name)} title="Click to rename">
              {data.list.name}
            </h1>
          )}
          {data.list.description && <p className="page-subtitle">{data.list.description}</p>}
        </div>
        <button onClick={() => setListModal(true)} className="btn btn-primary" disabled={stocks.length === 0}>
          ◈ Analyze List
        </button>
      </div>

      {/* ── Search ── */}
      <div className="panel">
        <h3 className="panel-title">Add Stocks</h3>
        <form onSubmit={searchStocks} className="search-bar">
          <input
            placeholder="Search by name or ticker symbol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? <Spinner size="sm" /> : 'Search'}
          </button>
        </form>

        {results.length > 0 && (
          <div className="search-results">
            {results.map((r) => (
              <div key={r.symbol} className="search-item">
                <div>
                  <span className="ticker">{r.symbol}</span>
                  <span className="text-muted"> — {r.name}</span>
                  {r.region && <span className="badge badge-ghost">{r.region}</span>}
                </div>
                <button onClick={() => addStock(r.symbol, r.name)} className="btn btn-sm btn-primary">
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Metrics ── */}
      <MetricsSummary stocks={stocks} prices={prices} period={period} />

      {/* ── Holdings ── */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-left">
            <h3 className="panel-title">Holdings</h3>
            {lastUpdated ? (
              <span className="price-age">Updated {timeAgo(lastUpdated)}</span>
            ) : stocks.length > 0 ? (
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
              disabled={refreshing || stocks.length === 0}
              title="Fetch latest prices from API"
            >
              {refreshing ? <Spinner size="sm" /> : '↻ Refresh'}
            </button>
          </div>
        </div>

        {stocks.length === 0 ? (
          <EmptyState icon="📈" title="No stocks yet" description="Search for stocks above and add them to this list." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <SortHeader label="Symbol" sortKey="symbol" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Name" sortKey="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Price" sortKey="price" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label={`Change (${period})`} sortKey="change" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Allocation" sortKey="allocation" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <th />
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const p = prices[s.symbol];
                const isPos = p?.changePercent >= 0;
                const sym = csym(p?.currency || s.currency);
                return (
                  <tr key={s.id}>
                    <td><span className="ticker">{s.symbol}</span></td>
                    <td className="text-muted">{s.name}</td>
                    <td>
                      {p
                        ? <strong>{sym}{p.currentPrice.toFixed(2)}</strong>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      {p
                        ? <span className={`change-badge ${isPos ? 'pos' : 'neg'}`}>{isPos ? '▲' : '▼'} {Math.abs(p.changePercent)}%</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <div className="allocation-cell" onClick={() => setEditingAllocation({ symbol: s.symbol, allocation: s.allocation || '', allocation_type: s.allocation_type || 'value' })}>
                        {s.allocation ? (
                          <span className="allocation-pill">
                            {s.allocation_type === 'value' ? `$${s.allocation}` : `${s.allocation}%`}
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>+ Set</span>
                        )}
                      </div>
                    </td>
                    <td className="table-actions">
                      <button
                        onClick={() => openStockAnalysis(s.symbol, s.name)}
                        className="btn btn-ghost btn-sm"
                        title={`AI analysis for ${s.symbol}`}
                      >
                        ◈ Analyze
                      </button>
                      <button
                        onClick={() => removeStock(s.symbol)}
                        className="btn btn-ghost btn-sm btn-danger"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── List analysis modal ── */}
      {listModal && (
        <Modal title={`Analyze List — ${data.list.name}`} onClose={closeListModal} size="lg">
          {analyzingList && (
            <AnalyzingProgress prefix={`Analyzing ${stocks.length} stock${stocks.length !== 1 ? 's' : ''}…`} />
          )}
          {!analyzingList && !listAnalysis && (
            <form onSubmit={runListAnalysis} className="modal-form">
              <p className="text-muted">The AI will analyze all {stocks.length} holdings using current market data.</p>
              <PromptPicker value={listPrompt.msg} onChange={listPrompt.setMsg} saveNew={listPrompt.saveNew} onSaveNewChange={listPrompt.setSaveNew} />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeListModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Run Analysis</button>
              </div>
            </form>
          )}
          {!analyzingList && listAnalysis && (
            <div>
              <AnalysisModalContent analysis={listAnalysis} />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={closeListModal}>Done</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Per-stock analysis modal ── */}
      {stockModal && (
        <Modal title={`Analyze ${stockModal.symbol}`} onClose={closeStockModal} size="lg">
          {stockModal.step === 'loading' && (
            <AnalyzingProgress prefix={`Analyzing ${stockModal.symbol} — ${stockModal.name}…`} />
          )}
          {stockModal.step === 'input' && (
            <form onSubmit={runStockAnalysis} className="modal-form">
              <div className="stock-analysis-header">
                <span className="ticker">{stockModal.symbol}</span>
                <span className="text-muted">{stockModal.name}</span>
                {prices[stockModal.symbol] && (
                  <span className="stock-analysis-price">
                    {csym(prices[stockModal.symbol].currency)}{prices[stockModal.symbol].currentPrice.toFixed(2)}
                    {' '}
                    <span className={prices[stockModal.symbol].changePercent >= 0 ? 'green' : 'red'}>
                      {prices[stockModal.symbol].changePercent >= 0 ? '▲' : '▼'}
                      {Math.abs(prices[stockModal.symbol].changePercent)}% ({period})
                    </span>
                  </span>
                )}
              </div>
              <PromptPicker value={stockPrompt.msg} onChange={stockPrompt.setMsg} saveNew={stockPrompt.saveNew} onSaveNewChange={stockPrompt.setSaveNew} />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeStockModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Run Analysis</button>
              </div>
            </form>
          )}
          {stockModal.step === 'result' && (
            <div>
              <AnalysisModalContent analysis={stockModal.analysis} />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={closeStockModal}>Done</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Allocation Edit Modal ── */}
      {editingAllocation && (
        <Modal title={`Set Allocation — ${editingAllocation.symbol}`} onClose={() => setEditingAllocation(null)} size="sm">
          <form onSubmit={updateAllocation} className="modal-form">
            <div className="field">
              <label>Holding Amount</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={editingAllocation.allocation}
                  onChange={(e) => setEditingAllocation({ ...editingAllocation, allocation: e.target.value })}
                  autoFocus
                  required
                />
                <select
                  value={editingAllocation.allocation_type}
                  onChange={(e) => setEditingAllocation({ ...editingAllocation, allocation_type: e.target.value })}
                  style={{ width: 'auto' }}
                >
                  <option value="value">USD ($)</option>
                  <option value="percent">Percentage (%)</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditingAllocation(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Update</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
