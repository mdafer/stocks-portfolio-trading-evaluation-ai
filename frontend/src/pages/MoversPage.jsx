import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import Modal from '../components/Modal';
import AnalysisModalContent from '../components/AnalysisModalContent';
import PromptPicker from '../components/PromptPicker';
import { usePromptMessage } from '../hooks/usePromptMessage';
import { useToast } from '../components/Toast';

const REGION_TABS = [
  { key: 'US', label: 'United States' },
  { key: 'CA', label: 'Canada' },
];

const DAYS_PRESETS = [
  { label: 'Today',     value: 0 },
  { label: 'Yesterday', value: 1 },
  { label: '2 days',    value: 2 },
  { label: '3 days',    value: 3 },
  { label: '5 days',    value: 5 },
  { label: '1 week',    value: 7 },
];

const ANALYSIS_STEPS = [
  'Fetching live market prices...',
  'Gathering recent news context...',
  'Cross-referencing financial data...',
  'Running AI analysis...',
  'Writing final report...',
];

function AnalyzingProgress({ prefix }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="analysis-loading" style={{ gap: 8 }}>
      <Spinner center />
      <p className="text-muted">{prefix}</p>
      <p style={{ marginTop: 4, color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>{ANALYSIS_STEPS[step]}</p>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MoversPage() {
  const toast = useToast();
  const prompt = usePromptMessage();

  const [region, setRegion]         = useState('US');
  const [daysBack, setDaysBack]     = useState(0);
  const [customDays, setCustomDays] = useState('');
  const [useCustom, setUseCustom]   = useState(false);

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Cache per region+daysBack to avoid re-fetching on tab switch
  const [cache, setCache] = useState({});

  const effectiveDays = useCustom ? (parseInt(customDays) || 0) : daysBack;
  const cacheKey = `${region}-${effectiveDays}`;

  const fetchMovers = useCallback(async () => {
    if (cache[cacheKey]) {
      setData(cache[cacheKey]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await api.get(`/movers?region=${region}&daysBack=${effectiveDays}&count=20`);
      setData(d);
      setCache(prev => ({ ...prev, [cacheKey]: d }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [region, effectiveDays, cacheKey, cache]);

  useEffect(() => {
    fetchMovers();
  }, [region, effectiveDays]);

  const refresh = () => {
    setCache(prev => { const next = { ...prev }; delete next[cacheKey]; return next; });
    setData(null);
    fetchMovers();
  };

  // Analysis modal
  const [analysisModal, setAnalysisModal] = useState(null);

  const openAnalysis = (symbols, label) => {
    prompt.reset();
    setAnalysisModal({ symbols, label, step: 'input', analysis: null });
  };

  const submitAnalysis = async (e) => {
    e.preventDefault();
    if (prompt.msg.trim()) await prompt.maybeSave(prompt.msg);
    setAnalysisModal(prev => ({ ...prev, step: 'loading' }));
    try {
      const d = await api.post('/analyses/quick', {
        symbols: analysisModal.symbols,
        label: analysisModal.label,
        user_message: prompt.msg || undefined,
      });
      setAnalysisModal(prev => ({ ...prev, step: 'result', analysis: d.analysis }));
    } catch (err) {
      toast(err.message, 'error');
      setAnalysisModal(null);
    }
  };

  const openGroup = (group) => {
    if (!data) return;
    const symbols = (group === 'gainers' ? data.topPerformers : data.bottomPerformers)?.map(p => p.symbol) || [];
    if (symbols.length === 0) return;
    const regionLabel = REGION_TABS.find(t => t.key === region)?.label || region;
    const dayLabel = effectiveDays === 0 ? 'Today' : effectiveDays === 1 ? 'Yesterday' : `${effectiveDays}d ago`;
    openAnalysis(symbols, `${regionLabel} ${group === 'gainers' ? 'Gainers' : 'Losers'} — ${dayLabel}`);
  };

  const gainers = data?.topPerformers || [];
  const losers  = data?.bottomPerformers || [];
  const hasData = gainers.length > 0 || losers.length > 0;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Top Movers</h1>
          <p className="page-subtitle">
            {data?.date ? formatDate(data.date) : 'Top gainers and losers by market'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>↺ Refresh</button>
      </div>

      {/* ── Controls ── */}
      <div className="movers-controls">
        {/* Region */}
        <div className="segment">
          {REGION_TABS.map(t => (
            <button
              key={t.key}
              className={`segment-btn ${region === t.key ? 'active' : ''}`}
              onClick={() => setRegion(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Day presets */}
        <div className="segment">
          {DAYS_PRESETS.map(p => (
            <button
              key={p.value}
              className={`segment-btn ${!useCustom && daysBack === p.value ? 'active' : ''}`}
              onClick={() => { setUseCustom(false); setDaysBack(p.value); }}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`segment-btn ${useCustom ? 'active' : ''}`}
            onClick={() => setUseCustom(true)}
          >
            Custom
          </button>
        </div>

        {/* Custom days input */}
        {useCustom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={0}
              max={365}
              value={customDays}
              onChange={e => setCustomDays(e.target.value)}
              placeholder="days back"
              className="input"
              style={{ width: 110 }}
            />
            <span className="text-muted text-sm">days ago</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="panel" style={{ minHeight: 220, position: 'relative' }}>
        {loading ? (
          <Spinner center />
        ) : error ? (
          <PageError message={error} onRetry={refresh} />
        ) : !hasData ? (
          <p className="text-muted text-sm" style={{ padding: '1rem 0' }}>
            No movers data available for this date and region.
          </p>
        ) : (
          <div className="movers-columns">
            {/* Gainers */}
            <div className="movers-col">
              <div className="movers-col-header">
                <span className="movers-col-label pos">Gainers ({gainers.length})</span>
                {gainers.length > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '.72rem' }}
                    onClick={() => openGroup('gainers')}
                    disabled={!!analysisModal}
                  >
                    ◈ Analyze
                  </button>
                )}
              </div>
              <div className="movers-list">
                {gainers.map(p => (
                  <div key={p.symbol} className="mover-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <Link to={`/stocks/${p.symbol}`} className="ticker">{p.symbol}</Link>
                      {p.name && (
                        <span className="text-muted text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {p.price != null && (
                        <span className="text-muted text-sm">${p.price.toFixed(2)}</span>
                      )}
                      <span className="change-badge pos">▲ {p.change}%</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '3px 6px' }}
                        onClick={() => openAnalysis([p.symbol], p.symbol)}
                        disabled={!!analysisModal}
                        title={`Analyze ${p.symbol}`}
                      >
                        ◈
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div className="movers-col">
              <div className="movers-col-header">
                <span className="movers-col-label neg">Losers ({losers.length})</span>
                {losers.length > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '.72rem' }}
                    onClick={() => openGroup('losers')}
                    disabled={!!analysisModal}
                  >
                    ◈ Analyze
                  </button>
                )}
              </div>
              <div className="movers-list">
                {losers.map(p => (
                  <div key={p.symbol} className="mover-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <Link to={`/stocks/${p.symbol}`} className="ticker">{p.symbol}</Link>
                      {p.name && (
                        <span className="text-muted text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {p.price != null && (
                        <span className="text-muted text-sm">${p.price.toFixed(2)}</span>
                      )}
                      <span className="change-badge neg">▼ {Math.abs(p.change)}%</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '3px 6px' }}
                        onClick={() => openAnalysis([p.symbol], p.symbol)}
                        disabled={!!analysisModal}
                        title={`Analyze ${p.symbol}`}
                      >
                        ◈
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Analysis Modal ── */}
      {analysisModal && (
        <Modal title={`Analysis — ${analysisModal.label}`} onClose={() => setAnalysisModal(null)} size="lg">
          {analysisModal.step === 'input' && (
            <form onSubmit={submitAnalysis} className="modal-form">
              <p className="text-muted">
                {analysisModal.symbols.length === 1
                  ? <>Analyzing <span className="ticker">{analysisModal.symbols[0]}</span> using current market data.</>
                  : <>Analyzing {analysisModal.symbols.length} stocks: <span style={{ fontWeight: 600 }}>{analysisModal.symbols.join(', ')}</span></>
                }
              </p>
              <PromptPicker
                value={prompt.msg}
                onChange={prompt.setMsg}
                saveNew={prompt.saveNew}
                onSaveNewChange={prompt.setSaveNew}
              />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setAnalysisModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Run Analysis</button>
              </div>
            </form>
          )}
          {analysisModal.step === 'loading' && (
            <AnalyzingProgress prefix={`Analyzing ${analysisModal.symbols.length} stock${analysisModal.symbols.length !== 1 ? 's' : ''}...`} />
          )}
          {analysisModal.step === 'result' && (
            <div>
              <AnalysisModalContent analysis={analysisModal.analysis} />
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setAnalysisModal(null)}>Done</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
