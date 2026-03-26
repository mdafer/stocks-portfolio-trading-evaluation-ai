import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';

export default function Lists() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useApi('/lists');
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null); // { id, name }
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const viewCombined = () => {
    if (selected.size < 2) { toast('Select at least 2 lists to compare', 'info'); return; }
    navigate(`/lists/compare?ids=${[...selected].join(',')}`);
  };

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

  const rename = async (id) => {
    const newName = editing?.name?.trim();
    if (!newName) { setEditing(null); return; }
    try {
      await api.put(`/lists/${id}`, { name: newName });
      toast('List renamed', 'success');
      setEditing(null);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete "${name}"? This will also remove all associated stocks and analyses.`)) return;
    try {
      await api.del(`/lists/${id}`);
      toast('List deleted', 'success');
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
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
        {selected.size >= 2 && (
          <button className="btn btn-primary" onClick={viewCombined}>
            View {selected.size} Lists Combined
          </button>
        )}
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
          <>
            {(data?.lists?.length ?? 0) >= 2 && (
              <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                Select multiple lists with the checkbox to view them combined.
              </p>
            )}
            <div className="card-grid">
              {data?.lists?.map((list) => (
                <div key={list.id} className={`list-card ${selected.has(list.id) ? 'list-card-selected' : ''}`} style={{ position: 'relative' }}>
                  <div className="list-card-body">
                    <label className="list-card-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(list.id)}
                        onChange={() => toggleSelect(list.id)}
                      />
                    </label>
                    <Link to={`/lists/${list.id}`} className="list-card-link">
                      <div className="list-card-icon">▤</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editing?.id === list.id ? (
                          <input
                            className="inline-edit-input"
                            value={editing.name}
                            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                            onBlur={() => rename(list.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') rename(list.id);
                              if (e.key === 'Escape') setEditing(null);
                            }}
                            onClick={(e) => e.preventDefault()}
                            autoFocus
                          />
                        ) : (
                          <h3>{list.name}</h3>
                        )}
                        {list.description && <p className="text-muted">{list.description}</p>}
                      </div>
                    </Link>
                  </div>
                  <div className="list-card-footer">
                    <span className="text-muted text-sm">{new Date(list.created_at).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.preventDefault(); setEditing({ id: list.id, name: list.name }); }}
                        title="Rename list"
                      >
                        Rename
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-danger"
                        onClick={(e) => { e.preventDefault(); remove(list.id, list.name); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
