import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import './StocksPage.css';

const REGION_LABELS = { us: 'US', ca: 'Canada' };

export default function StocksPage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('us');
  const { data, loading, error } = useApi('/stocks/sectors');
  const sectors = data?.sectors ?? [];

  if (loading) return <div className="page"><Spinner center /></div>;
  if (error)   return <div className="page"><PageError message={error} /></div>;

  return (
    <div className="page stocks-page">
      <div className="stocks-header">
        <div className="stocks-title-group">
          <h1 className="stocks-title">Market Sectors</h1>
          <p className="stocks-subtitle">Explore stocks across {sectors.length} sectors</p>
        </div>
        <div className="region-toggle">
          {Object.entries(REGION_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`region-btn ${region === key ? 'active' : ''}`}
              onClick={() => setRegion(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sectors-grid">
        {sectors.map(s => (
          <button
            key={s.id}
            className="sector-card"
            onClick={() => navigate(`/stocks/sectors/${encodeURIComponent(s.id)}?region=${region}`)}
          >
            <div className="sector-card-inner">
              <div className="sector-icon">{s.icon}</div>
              <div className="sector-content">
                <h3 className="sector-name">{s.name}</h3>
                <p className="sector-description">{s.description}</p>
              </div>
            </div>
            <div className="sector-card-accent"></div>
          </button>
        ))}
      </div>
    </div>
  );
}
