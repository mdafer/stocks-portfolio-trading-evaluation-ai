import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import AnalysisModalContent from '../components/AnalysisModalContent';
import PromptPicker from '../components/PromptPicker';
import { usePromptMessage } from '../hooks/usePromptMessage';
import { useToast } from '../components/Toast';

const MOVERS_TABS = [
  { key: 'my', label: 'My Stocks' },
  { key: 'us', label: 'US' },
  { key: 'ca', label: 'Canada' },
];

const ANALYSIS_STEPS = [
  "Fetching live market prices...",
  "Gathering recent news context...",
  "Cross-referencing financial data...",
  "Running AI analysis...",
  "Writing final report...",
];

function AnalyzingProgress({ prefix }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 3800);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="analysis-loading" style={{ gap: 8 }}>
      <Spinner center />
      <p className="text-muted">{prefix}</p>
      <p style={{ marginTop: 4, color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>{ANALYSIS_STEPS[step]}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, loading: loadingSummary, error: errorSummary, refresh: refreshSummary } = useApi('/dashboard/summary');
  const { data: newsData, loading: loadingNews } = useApi('/dashboard/news-feed');
  const toast = useToast();

  const [moversTab, setMoversTab] = useState('my');
  const [moversData, setMoversData] = useState({});
  const [loadingMovers, setLoadingMovers] = useState(false);

  // Analysis modal: { symbols, label, step: 'input'|'loading'|'result', analysis }
  const [analysisModal, setAnalysisModal] = useState(null);
  const dashPrompt = usePromptMessage();

  useEffect(() => {
    let cancelled = false;
    async function fetchMovers() {
      if (moversData[moversTab]) return;
      setLoadingMovers(true);
      try {
        let d;
        if (moversTab === 'my') {
          d = await api.get('/dashboard/movers');
        } else {
          d = await api.get(`/dashboard/market-movers?region=${moversTab}&count=20`);
        }
        if (!cancelled) setMoversData((prev) => ({ ...prev, [moversTab]: d }));
      } catch (err) {
        console.error(`[Dashboard] Failed to fetch movers for ${moversTab}:`, err.message);
        if (!cancelled) setMoversData((prev) => ({ ...prev, [moversTab]: { topPerformers: [], bottomPerformers: [] } }));
      } finally {
        if (!cancelled) setLoadingMovers(false);
      }
    }
    fetchMovers();
    return () => { cancelled = true; };
  }, [moversTab]);

  const openAnalysis = (symbols, label) => {
    dashPrompt.reset();
    setAnalysisModal({ symbols, label, step: 'input', analysis: null });
  };

  const submitAnalysis = async (e) => {
    e.preventDefault();
    const { symbols } = analysisModal;
    if (dashPrompt.msg.trim()) await dashPrompt.maybeSave(dashPrompt.msg);
    setAnalysisModal((prev) => ({ ...prev, step: 'loading' }));
    try {
      const d = await api.post('/analyses/quick', { symbols, label: analysisModal.label, user_message: dashPrompt.msg || undefined });
      setAnalysisModal((prev) => ({ ...prev, step: 'result', analysis: d.analysis }));
    } catch (err) {
      toast(err.message, 'error');
      setAnalysisModal(null);
    }
  };

  const openGroupAnalysis = (group) => {
    const m = moversData[moversTab];
    if (!m) return;
    const symbols = (group === 'gainers' ? m.topPerformers : m.bottomPerformers)?.map(p => p.symbol) || [];
    if (symbols.length === 0) return;
    const tabLabel = MOVERS_TABS.find(t => t.key === moversTab)?.label || moversTab;
    const groupLabel = group === 'gainers' ? 'Gainers' : 'Losers';
    openAnalysis(symbols, `${tabLabel} ${groupLabel} (${symbols.length} stocks)`);
  };

  if (loadingSummary) return <div className="page"><Spinner center /></div>;
  if (errorSummary) return <PageError message={errorSummary} onRetry={refreshSummary} />;

  const hasHoldings = summary.stockCount > 0;
  const currentMovers = moversData[moversTab];
  const isMoversLoading = loadingMovers || !currentMovers;
  const hasMovers = (currentMovers?.topPerformers?.length || 0) + (currentMovers?.bottomPerformers?.length || 0) > 0;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Dashboard</h1>
          <p className="page-subtitle">Combined overview of your portfolios and market activity</p>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Portfolios</span>
          <span className="stat-value">{summary.listCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Portfolio Stocks</span>
          <span className="stat-value">{summary.stockCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estimated Allocation</span>
          <span className="stat-value">${summary.totalValue?.toLocaleString() || '0'}</span>
        </div>
      </div>

      {!hasHoldings && moversTab === 'my' ? (
        <EmptyState
          icon="📊"
          title="Your dashboard is empty"
          description="Add some stocks to your lists to see market performance and news here."
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* ── Top Movers ── */}
            <div className="panel">
              <div className="panel-header" style={{ marginBottom: 0 }}>
                <h3 className="panel-title">Top Movers (24h)</h3>
              </div>
              <div className="segment" style={{ marginTop: 12, marginBottom: 14 }}>
                {MOVERS_TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`segment-btn ${moversTab === t.key ? 'active' : ''}`}
                    onClick={() => setMoversTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ minHeight: '120px', position: 'relative' }}>
                {isMoversLoading ? (
                  <Spinner center />
                ) : !hasMovers ? (
                  <p className="text-muted text-sm">
                    {moversTab === 'my' ? 'No price data for your stocks.' : 'No movers data available.'}
                  </p>
                ) : (
                  <div className="movers-columns">
                    {currentMovers?.topPerformers?.length > 0 && (
                      <div className="movers-col">
                        <div className="movers-col-header">
                          <span className="movers-col-label pos">Gainers ({currentMovers.topPerformers.length})</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '.72rem' }} onClick={() => openGroupAnalysis('gainers')} disabled={!!analysisModal}>◈ Analyze</button>
                        </div>
                        <div className="movers-list">
                          {currentMovers.topPerformers.map(p => (
                            <div key={p.symbol} className="mover-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                <span className="ticker">{p.symbol}</span>
                                {p.name && <span className="text-muted text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>}
                              </div>
                              <span className="change-badge pos">▲ {p.change}%</span>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 6px', flexShrink: 0 }}
                                onClick={() => openAnalysis([p.symbol], p.symbol)}
                                disabled={!!analysisModal}
                                title={`Analyze ${p.symbol}`}
                              >
                                ◈
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentMovers?.bottomPerformers?.length > 0 && (
                      <div className="movers-col">
                        <div className="movers-col-header">
                          <span className="movers-col-label neg">Losers ({currentMovers.bottomPerformers.length})</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '.72rem' }} onClick={() => openGroupAnalysis('losers')} disabled={!!analysisModal}>◈ Analyze</button>
                        </div>
                        <div className="movers-list">
                          {currentMovers.bottomPerformers.map(p => (
                            <div key={p.symbol} className="mover-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                                <span className="ticker">{p.symbol}</span>
                                {p.name && <span className="text-muted text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>}
                              </div>
                              <span className="change-badge neg">▼ {Math.abs(p.change)}%</span>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 6px', flexShrink: 0 }}
                                onClick={() => openAnalysis([p.symbol], p.symbol)}
                                disabled={!!analysisModal}
                                title={`Analyze ${p.symbol}`}
                              >
                                ◈
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── News Feed ── */}
            <div className="panel" style={{ maxWidth: 700 }}>
              <h3 className="panel-title">Daily News Feed</h3>
              <div className="news-feed" style={{ minHeight: '200px', position: 'relative' }}>
                {loadingNews ? (
                  <Spinner center />
                ) : !newsData?.newsFeed || newsData.newsFeed.length === 0 ? (
                  <p className="text-muted">No news found for your stocks.</p>
                ) : (
                  newsData.newsFeed.map((article, i) => (
                    <a key={i} href={article.link} target="_blank" rel="noreferrer" className="feed-article" title={article.title}>
                      <div className="article-meta">
                        <span className="article-source">{article.source}</span>
                        <span className="article-date">{article.pubDate}</span>
                      </div>
                      <h4 className="article-title">{article.title}</h4>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Analysis Modal ── */}
      {analysisModal && (
        <Modal title={`Analysis — ${analysisModal.label}`} onClose={() => setAnalysisModal(null)} size="lg">
          {analysisModal.step === 'input' && (
            <form onSubmit={submitAnalysis} className="modal-form">
              <p className="text-muted">
                The AI will analyze {analysisModal.symbols.length === 1
                  ? <><span className="ticker">{analysisModal.symbols[0]}</span> using current market data.</>
                  : <>{analysisModal.symbols.length} stocks using current market data: <span style={{ fontWeight: 600 }}>{analysisModal.symbols.join(', ')}</span></>
                }
              </p>
              <PromptPicker value={dashPrompt.msg} onChange={dashPrompt.setMsg} saveNew={dashPrompt.saveNew} onSaveNewChange={dashPrompt.setSaveNew} />
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
