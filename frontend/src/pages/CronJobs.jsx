import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PageError from '../components/PageError';

const PRESETS = [
  { label: 'Daily 9am', value: '0 9 * * 1-5' },
  { label: 'Weekly Mon', value: '0 9 * * 1' },
  { label: 'Mon & Thu', value: '0 9 * * 1,4' },
];

export default function CronJobs() {
  const toast = useToast();
  const { data, loading, error, refresh } = useApi('/cron-jobs');
  const lists = useApi('/lists');
  const [form, setForm] = useState({ list_id: '', schedule: '', user_message: '' });
  const [submitting, setSubmitting] = useState(false);

  const setField = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/cron-jobs', {
        list_id: form.list_id,
        schedule: form.schedule,
        user_message: form.user_message || undefined,
      });
      setForm({ list_id: '', schedule: '', user_message: '' });
      toast('Cron job created', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (job) => {
    try {
      await api.put(`/cron-jobs/${job.id}`, { is_active: !job.is_active });
      toast(job.is_active ? 'Job paused' : 'Job resumed', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async (job) => {
    if (!confirm(`Delete this scheduled job for "${job.list_name}"?`)) return;
    try {
      await api.del(`/cron-jobs/${job.id}`);
      toast('Cron job deleted', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading || lists.loading) return <div className="page"><Spinner center /></div>;
  if (error) return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  const jobs = data?.cronJobs ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scheduled Analyses</h1>
          <p className="page-subtitle">Automate AI portfolio analysis on a recurring schedule</p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">New Schedule</h3>
        <form onSubmit={create} className="cron-form">
          <div className="field">
            <label>List</label>
            <select value={form.list_id} onChange={setField('list_id')} required>
              <option value="">Select a list…</option>
              {lists.data?.lists?.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Cron Schedule
              <span className="presets">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className="preset-btn"
                    onClick={() => setForm((f) => ({ ...f, schedule: p.value }))}
                  >
                    {p.label}
                  </button>
                ))}
              </span>
            </label>
            <input
              placeholder="e.g. 0 9 * * 1-5"
              value={form.schedule}
              onChange={setField('schedule')}
              required
              className="mono"
            />
          </div>

          <div className="field">
            <label>Custom AI Instructions <span className="text-muted">(optional)</span></label>
            <textarea
              placeholder="e.g. Focus on tech sector risks, compare to S&P 500…"
              value={form.user_message}
              onChange={setField('user_message')}
              rows={2}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner size="sm" /> : 'Create Schedule'}
          </button>
        </form>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon="⏱" title="No scheduled analyses" description="Create a schedule above to automate your portfolio analysis." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>List</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Last Run</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td><strong>{job.list_name}</strong></td>
                <td><code className="code">{job.schedule}</code></td>
                <td>
                  <span className={`status-dot ${job.is_active ? 'active' : 'paused'}`}>
                    {job.is_active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="text-muted text-sm">
                  {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}
                </td>
                <td className="table-actions">
                  <button onClick={() => toggle(job)} className="btn btn-ghost btn-sm">
                    {job.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => remove(job)} className="btn btn-ghost btn-sm btn-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
