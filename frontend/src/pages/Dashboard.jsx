import { useApi } from '../hooks/useApi';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { data: summary, loading: loadingSummary, error: errorSummary, refresh: refreshSummary } = useApi('/dashboard/summary');
  const { data: movers, loading: loadingMovers } = useApi('/dashboard/movers');
  const { data: newsData, loading: loadingNews } = useApi('/dashboard/news-feed');

  if (loadingSummary) return <div className="page"><Spinner center /></div>;
  if (errorSummary) return <PageError message={errorSummary} onRetry={refreshSummary} />;

  const hasHoldings = summary.stockCount > 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Dashboard</h1>
          <p className="page-subtitle">Combined overview of your portfolios and market activity</p>
        </div>
      </div>

      {/* ── Summary Stats (INSTANT-LOAD) ── */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Portfolios</span>
          <span className="stat-value">{summary.listCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Stocks Tracked</span>
          <span className="stat-value">{summary.stockCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estimated Allocation</span>
          <span className="stat-value">${summary.totalValue?.toLocaleString() || '0'}</span>
        </div>
      </div>

      {!hasHoldings ? (
        <EmptyState 
          icon="📊" 
          title="Your dashboard is empty" 
          description="Add some stocks to your lists to see market performance and news here." 
        />
      ) : (
        <>
          <div className="dashboard-grid">
            {/* ── Performers (LAZY-LOAD) ── */}
            <div className="panel">
              <h3 className="panel-title">Top Movers (24h)</h3>
              <div className="movers-list" style={{ minHeight: '120px', position: 'relative' }}>
                {loadingMovers ? (
                  <Spinner center />
                ) : (
                  <>
                    {(movers?.topPerformers?.length === 0 && movers?.bottomPerformers?.length === 0) ? (
                      <p className="text-muted text-sm">No price data available.</p>
                    ) : (
                      <>
                        {movers.topPerformers?.map(p => (
                          <div key={p.symbol} className="mover-item">
                            <span className="ticker">{p.symbol}</span>
                            <span className="change-badge pos">▲ {p.change}%</span>
                          </div>
                        ))}
                        {movers.bottomPerformers?.map(p => (
                          <div key={p.symbol} className="mover-item">
                            <span className="ticker">{p.symbol}</span>
                            <span className="change-badge neg">▼ {Math.abs(p.change)}%</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── News Feed (LAZY-LOAD) ── */}
            <div className="panel">
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
    </div>
  );
}
