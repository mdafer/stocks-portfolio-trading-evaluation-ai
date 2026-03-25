import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';

export default function Lists() {
  const toast = useToast();
  const { data, loading, error, refresh } = useApi('/lists');
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/lists', { name: form.name, description: form.description || undefined });
      setForm({ name: '', description: '' });
      toast('List created', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete "${name}"? This will also remove all associated stocks and analyses.`)) return;
    try {
      await api.del(`/lists/${id}`);
      toast('List deleted', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Lists</h1>
          <p className="page-subtitle">Organize and track your stock portfolios</p>
        </div>
      </div>

      <div className="create-panel">
        <h3>New List</h3>
        <form onSubmit={create} className="create-form">
          <input
            placeholder="List name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : 'Create List'}
          </button>
        </form>
      </div>

      {loading && <Spinner center />}
      {error && <PageError message={error} onRetry={refresh} />}

      {!loading && !error && (
        data?.lists?.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No lists yet"
            description="Create your first list to start tracking stocks."
          />
        ) : (
          <div className="card-grid">
            {data?.lists?.map((list) => (
              <Link key={list.id} to={`/lists/${list.id}`} className="list-card">
                <div className="list-card-body">
                  <div className="list-card-icon">▤</div>
                  <div>
                    <h3>{list.name}</h3>
                    {list.description && <p className="text-muted">{list.description}</p>}
                  </div>
                </div>
                <div className="list-card-footer">
                  <span className="text-muted text-sm">{new Date(list.created_at).toLocaleDateString()}</span>
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={(e) => { e.preventDefault(); remove(list.id, list.name); }}
                  >
                    Delete
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
