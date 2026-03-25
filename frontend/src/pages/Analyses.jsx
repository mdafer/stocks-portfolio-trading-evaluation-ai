import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';
import AnalysisModalContent from '../components/AnalysisModalContent';

export default function Analyses() {
  const { data, loading, error, refresh } = useApi('/analyses');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [groupBy, setGroupBy] = useState('date');
  const toast = useToast();

  const analyses = data?.analyses ?? [];

  const groupedAnalyses = useMemo(() => {
    const groups = {};
    for (const a of analyses) {
      let key = 'Other';
      if (groupBy === 'date') {
        key = new Date(a.created_at).toLocaleDateString();
      } else {
        key = a.symbol || a.list_name;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return Object.entries(groups).sort((a, b) => {
      if (groupBy === 'date') return new Date(b[0]) - new Date(a[0]);
      return a[0].localeCompare(b[0]);
    });
  }, [analyses, groupBy]);

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
          <p className="page-subtitle">AI-generated portfolio reports</p>
        </div>
        {analyses.length > 0 && (
          <div className="segment">
            <button className={`segment-btn ${groupBy === 'date' ? 'active' : ''}`} onClick={() => setGroupBy('date')}>By Date</button>
            <button className={`segment-btn ${groupBy === 'stock' ? 'active' : ''}`} onClick={() => setGroupBy('stock')}>By Stock</button>
          </div>
        )}
      </div>

      {analyses.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No analyses yet"
          description="Open a list and click 'AI Analysis' to generate your first report."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {groupedAnalyses.map(([groupName, groupItems]) => (
            <div key={groupName}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {groupName}
              </h3>
              <div className="analyses-grid">
                {groupItems.map((a) => (
                  <div key={a.id} className="analysis-card" onClick={() => setSelected(a)} style={{ position: 'relative' }}>
                    <div className="analysis-card-header">
                      <span className="analysis-list-name">{a.symbol ? `${a.symbol} (${a.list_name})` : a.list_name}</span>
                      <button className="btn btn-ghost btn-danger btn-sm" style={{ padding: '2px 6px', position: 'absolute', top: '12px', right: '12px', zIndex: 10 }} onClick={(e) => deleteAnalysis(a.id, e)}>
                        ×
                      </button>
                    </div>
                    <p className="analysis-preview" style={{ marginTop: '8px' }}>{a.result.slice(0, 180)}…</p>
                    <div className="analysis-card-footer">
                      <span className="text-muted text-sm">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="badge badge-subtle">{a.model_used || 'AI'}</span>
                    </div>
                  </div>
                ))}
              </div>
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
