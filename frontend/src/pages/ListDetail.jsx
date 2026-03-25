import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';
import AnalysisModalContent from '../components/AnalysisModalContent';

const PERIODS = ['1d', '1w', '1m', '1y', '5y', '10y'];

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
  const [listMsg, setListMsg]       = useState('');
  const [listAnalysis, setListAnalysis] = useState(null);
  const [analyzingList, setAnalyzingList] = useState(false);

  // Per-stock analysis modal
  const [stockModal, setStockModal] = useState(null);
  // { symbol, name, step: 'input'|'loading'|'result', analysis, userMsg }

  const [editingAllocation, setEditingAllocation] = useState(null);
  // { symbol, allocation, allocation_type }

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
      const d = await api.post('/analyses/trigger', {
        list_id: id,
        user_message: listMsg || undefined,
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

  const closeListModal = () => { setListModal(false); setListAnalysis(null); setListMsg(''); };

  // ── Per-stock analysis ──────────────────────────────────────────────────────

  const openStockAnalysis = (symbol, name) =>
    setStockModal({ symbol, name, step: 'input', result: null, userMsg: '' });

  const runStockAnalysis = async (e) => {
    e.preventDefault();
    const { symbol, userMsg } = stockModal;
    setStockModal((prev) => ({ ...prev, step: 'loading' }));
    try {
      const d = await api.post('/analyses/trigger', {
        list_id: id,
        symbol,
        user_message: userMsg || undefined,
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

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} /></div>;
  if (!data?.list) return <div className="page"><PageError message="List not found" /></div>;

  const stocks = data.stocks ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/" className="breadcrumb">← My Lists</Link>
          <h1 className="page-title">{data.list.name}</h1>
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
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change ({period})</th>
                <th>Allocation</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const p = prices[s.symbol];
                const isPos = p?.changePercent >= 0;
                return (
                  <tr key={s.id}>
                    <td><span className="ticker">{s.symbol}</span></td>
                    <td className="text-muted">{s.name}</td>
                    <td>
                      {p
                        ? <strong>${p.currentPrice.toFixed(2)}</strong>
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
              <div className="field">
                <label>Additional instructions <span className="text-muted">(optional)</span></label>
                <textarea
                  placeholder="e.g. Focus on tech sector risks, or compare to S&P 500…"
                  value={listMsg}
                  onChange={(e) => setListMsg(e.target.value)}
                  rows={3}
                />
              </div>
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
                    ${prices[stockModal.symbol].currentPrice.toFixed(2)}
                    {' '}
                    <span className={prices[stockModal.symbol].changePercent >= 0 ? 'green' : 'red'}>
                      {prices[stockModal.symbol].changePercent >= 0 ? '▲' : '▼'}
                      {Math.abs(prices[stockModal.symbol].changePercent)}% ({period})
                    </span>
                  </span>
                )}
              </div>
              <div className="field">
                <label>Additional instructions <span className="text-muted">(optional)</span></label>
                <textarea
                  placeholder="e.g. Focus on near-term earnings risk…"
                  value={stockModal.userMsg}
                  onChange={(e) => setStockModal((prev) => ({ ...prev, userMsg: e.target.value }))}
                  rows={2}
                />
              </div>
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
