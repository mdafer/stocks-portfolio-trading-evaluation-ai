import { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import Spinner from './Spinner';

function NewsArticle({ item }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className="feed-article" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span className="text-muted text-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.source || 'Unknown'}</span>
        <span className="text-muted text-sm">{item.pub_date || item.pubDate ? new Date(item.pub_date || item.pubDate).toLocaleDateString() : ''}</span>
      </div>
      <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '.85rem', lineHeight: 1.4 }}>{item.title}</div>
    </a>
  );
}

export default function AnalysisModalContent({ analysis }) {
  const [tab, setTab] = useState('analysis');
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsLoaded, setNewsLoaded] = useState(false);

  useEffect(() => {
    if ((tab === 'news' || tab === 'stocks') && !newsLoaded) {
      setLoadingNews(true);
      api.get(`/analyses/${analysis.id}/news`)
        .then((d) => { setNews(d.articles || []); setNewsLoaded(true); })
        .catch(() => { setNewsLoaded(true); })
        .finally(() => setLoadingNews(false));
    }
  }, [tab, analysis.id, newsLoaded]);

  const stocks = useMemo(() => {
    if (analysis.symbol && !analysis.symbol.includes(' ')) {
      return [{ symbol: analysis.symbol, newsCount: news.filter(n => n.symbol === analysis.symbol).length }];
    }
    const symbolMap = {};
    for (const n of news) {
      if (!symbolMap[n.symbol]) symbolMap[n.symbol] = { symbol: n.symbol, newsCount: 0 };
      symbolMap[n.symbol].newsCount++;
    }
    return Object.values(symbolMap).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [news, analysis.symbol]);

  // Group news by symbol
  const newsByStock = useMemo(() => {
    const groups = {};
    for (const n of news) {
      if (!groups[n.symbol]) groups[n.symbol] = [];
      groups[n.symbol].push(n);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [news]);

  return (
    <>
      <div className="modal-tabs">
        <button className={`modal-tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>
          Analysis
        </button>
        <button className={`modal-tab ${tab === 'stocks' ? 'active' : ''}`} onClick={() => setTab('stocks')}>
          Stocks {newsLoaded && stocks.length > 0 ? `(${stocks.length})` : ''}
        </button>
        <button className={`modal-tab ${tab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')}>
          News {newsLoaded && news.length > 0 ? `(${news.length})` : ''}
        </button>
      </div>

      {tab === 'analysis' && (
        <>
          <div className="analysis-meta">
            <span className="text-muted text-sm">{new Date(analysis.created_at).toLocaleString()}</span>
            {analysis.model_used && <span className="badge badge-subtle">{analysis.model_used}</span>}
            {analysis.prompt_tokens && (
              <span className="text-muted text-sm">{analysis.prompt_tokens + analysis.completion_tokens} tokens</span>
            )}
          </div>
          <div className="analysis-result">{analysis.result}</div>
        </>
      )}

      {tab === 'stocks' && (
        <div>
          {loadingNews ? (
            <Spinner center />
          ) : stocks.length === 0 ? (
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>No stock data available for this analysis.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>News Articles</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={s.symbol}>
                    <td><span className="ticker">{s.symbol}</span></td>
                    <td className="text-muted text-sm">{s.newsCount} article{s.newsCount !== 1 ? 's' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div>
          {loadingNews ? (
            <Spinner center />
          ) : news.length === 0 ? (
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>No news were used in this analysis.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {newsByStock.map(([symbol, articles]) => (
                <div key={symbol}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    <span className="ticker">{symbol}</span>
                    <span className="text-muted text-sm">{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {articles.map((item, i) => <NewsArticle key={i} item={item} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
