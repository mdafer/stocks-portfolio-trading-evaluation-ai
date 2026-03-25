import { useState, useEffect } from 'react';
import api from '../api/client';
import Spinner from './Spinner';

export default function AnalysisModalContent({ analysis }) {
  const [tab, setTab] = useState('analysis');
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (tab === 'news' && news.length === 0) {
      setLoadingNews(true);
      api.get(`/analyses/${analysis.id}/news`)
        .then((d) => setNews(d.articles || []))
        .catch(() => {})
        .finally(() => setLoadingNews(false));
    }
  }, [tab, analysis.id, news.length]);

  return (
    <>
      <div className="modal-tabs">
        <button className={`modal-tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>
          Analysis
        </button>
        <button className={`modal-tab ${tab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')}>
          News Context
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

      {tab === 'news' && (
        <div className="analysis-news">
          {loadingNews ? (
            <Spinner center />
          ) : news.length === 0 ? (
            <div className="text-muted text-center" style={{ padding: '20px' }}>No news were used in this analysis.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {news.map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noreferrer" className="feed-article" style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="ticker">{item.symbol}</span>
                    <span className="text-muted text-sm">{new Date(item.pub_date || item.pubDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontWeight: '500', marginBottom: '4px', color: 'var(--text-1)' }}>{item.title}</div>
                  <div className="text-muted text-sm" style={{ color: 'var(--primary)', fontWeight: '600' }}>{item.source || 'Unknown Source'}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
