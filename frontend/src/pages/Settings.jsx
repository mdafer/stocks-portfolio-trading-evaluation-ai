import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';

function PromptsManager({ toast }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editing, setEditing] = useState(null); // { id, title, body }

  const load = useCallback(async () => {
    try {
      const d = await api.get('/settings/prompts');
      setPrompts(d.prompts || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await api.post('/settings/prompts', { title: newTitle.trim(), body: newBody.trim() });
      setNewTitle(''); setNewBody('');
      toast('Prompt saved', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const save = async (id) => {
    if (!editing) return;
    try {
      await api.put(`/settings/prompts/${id}`, { title: editing.title, body: editing.body });
      setEditing(null);
      toast('Prompt updated', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this saved prompt?')) return;
    try {
      await api.del(`/settings/prompts/${id}`);
      toast('Prompt deleted', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return <Spinner center />;

  return (
    <div style={{ maxWidth: 600 }}>
      <form onSubmit={create} className="panel" style={{ marginBottom: 20 }}>
        <h3 className="panel-title" style={{ marginBottom: 12 }}>New Prompt</h3>
        <div className="field" style={{ marginBottom: 10 }}>
          <input placeholder="Short title (e.g. Tech Focus)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <textarea placeholder="Full instructions for the AI…" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3} required />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Save Prompt</button>
      </form>

      {prompts.length === 0 ? (
        <p className="text-muted text-sm">No saved prompts yet. Create one above or check "Save this message" when analyzing stocks.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prompts.map((p) => (
            <div key={p.id} className="panel" style={{ padding: '14px 18px' }}>
              {editing?.id === p.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={3} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => save(p.id)}>Save</button>
                    <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <strong style={{ fontSize: '.875rem' }}>{p.title}</strong>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ id: p.id, title: p.title, body: p.body })}>Edit</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(p.id)}>Delete</button>
                    </div>
                  </div>
                  <p className="text-muted text-sm" style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini and more',
    icon: '⬡',
    keyPlaceholder: 'sk-...',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Access 200+ models, including free ones',
    icon: '⬢',
    keyPlaceholder: 'sk-or-v1-...',
    modelSuggestions: [],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
    icon: '⬟',
    keyPlaceholder: 'Your API key',
    modelSuggestions: [],
  },
];

export default function Settings() {
  const toast = useToast();
  const { data, loading, error, refresh } = useApi('/settings');

  const [form, setForm] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [freeModels, setFreeModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [tab, setTab] = useState('ai');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Initialise form once settings load
  useEffect(() => {
    if (data?.settings && !form) setForm({ ...data.settings });
  }, [data, form]);

  if (loading || !form) return <div className="page"><Spinner center /></div>;
  if (error) return <div className="page"><PageError message={error} onRetry={refresh} /></div>;

  const provider = PROVIDERS.find((p) => p.id === form.ai_provider) || PROVIDERS[0];
  const defaults  = data.providerDefaults?.[form.ai_provider] || {};

  const setField = (f) => (e) => {
    setForm((prev) => ({ ...prev, [f]: e.target.value }));
    setTestResult(null);
  };

  const selectProvider = (id) => {
    const def = data.providerDefaults?.[id] || {};
    setForm((prev) => ({
      ...prev,
      ai_provider: id,
      ai_base_url: def.ai_base_url || '',
      ai_model:    def.ai_model    || '',
    }));
    setFreeModels([]);
    setTestResult(null);
  };

  const loadFreeModels = async () => {
    setLoadingModels(true);
    try {
      const d = await api.get('/settings/ai/free-models');
      setFreeModels(d.models || []);
      if (d.models.length === 0) toast('No free models found', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoadingModels(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast('Settings saved', 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const d = await api.post('/settings/ai/test', form);
      setTestResult({ ok: d.ok, message: d.ok ? `Connected · ${d.model}` : d.message });
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your AI provider and credentials</p>
        </div>
      </div>

      {/* Tab strip — extensible */}
      <div className="settings-tabs">
        <button className={`settings-tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>AI Provider</button>
        <button className={`settings-tab ${tab === 'prompts' ? 'active' : ''}`} onClick={() => setTab('prompts')}>Saved Prompts</button>
        <button className={`settings-tab ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>Appearance</button>
      </div>

      {tab === 'ai' && (
      <form onSubmit={save} className="settings-form">

        {/* Provider cards */}
        <div className="settings-section">
          <h3 className="settings-section-title">Provider</h3>
          <div className="provider-cards">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`provider-card ${form.ai_provider === p.id ? 'active' : ''}`}
                onClick={() => selectProvider(p.id)}
              >
                <span className="provider-icon">{p.icon}</span>
                <span className="provider-label">{p.label}</span>
                <span className="provider-desc">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <div className="settings-section">
          <h3 className="settings-section-title">Base URL</h3>
          <div className="field">
            <input
              value={form.ai_base_url}
              onChange={setField('ai_base_url')}
              placeholder={defaults.ai_base_url || 'https://api.example.com/v1'}
            />
            <p className="field-hint">The base URL for API requests. Must be OpenAI-compatible.</p>
          </div>
        </div>

        {/* API Key */}
        <div className="settings-section">
          <h3 className="settings-section-title">API Key</h3>
          <div className="field">
            <div className="input-with-action">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.ai_api_key || ''}
                onChange={setField('ai_api_key')}
                placeholder={provider.keyPlaceholder}
                className="mono"
              />
              <button type="button" className="input-action-btn" onClick={() => setShowKey((v) => !v)}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            {data.settings.ai_api_key_set && (!form.ai_api_key || form.ai_api_key.includes('••••')) && (
              <p className="field-hint field-hint-ok">✓ API key is saved</p>
            )}
            <p className="field-hint">Stored securely on the server, never exposed to the client.</p>
          </div>
        </div>

        {/* Model */}
        <div className="settings-section">
          <h3 className="settings-section-title">Model</h3>
          <div className="field">

            {/* OpenRouter: free model selector */}
            {form.ai_provider === 'openrouter' && (
              <div className="free-models-row">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={loadFreeModels}
                  disabled={loadingModels}
                >
                  {loadingModels ? <Spinner size="sm" /> : '⬢ Load Free Models'}
                </button>
                {freeModels.length > 0 && (
                  <select
                    value={form.ai_model}
                    onChange={setField('ai_model')}
                    className="free-model-select"
                  >
                    <option value="">Select a free model…</option>
                    {freeModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.context ? `· ${(m.context / 1000).toFixed(0)}k ctx` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* OpenAI: suggestions */}
            {provider.modelSuggestions.length > 0 && (
              <div className="model-suggestions">
                {provider.modelSuggestions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`preset-btn ${form.ai_model === m ? 'active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, ai_model: m }))}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            <input
              value={form.ai_model}
              onChange={setField('ai_model')}
              placeholder={defaults.ai_model || 'model-name'}
              className="mono"
            />
            <p className="field-hint">Model identifier sent with every request.</p>
          </div>
        </div>

        {/* Test + Save */}
        <div className="settings-actions">
          <div className="test-area">
            <button type="button" className="btn" onClick={testConnection} disabled={testing}>
              {testing ? <Spinner size="sm" /> : 'Test Connection'}
            </button>
            {testResult && (
              <span className={`test-result ${testResult.ok ? 'ok' : 'fail'}`}>
                {testResult.ok ? '✓' : '✕'} {testResult.message}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save Settings'}
          </button>
        </div>

      </form>
      )}

      {tab === 'prompts' && (
        <PromptsManager toast={toast} />
      )}

      {tab === 'appearance' && (
        <div className="settings-form">
          <div className="settings-section">
            <h3 className="settings-section-title">Theme</h3>
            <div className="field">
              <div className="segment" style={{ width: 'fit-content' }}>
                <button type="button" className={`segment-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => changeTheme('light')}>Light</button>
                <button type="button" className={`segment-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => changeTheme('dark')}>Dark</button>
              </div>
              <p className="field-hint">Choose your preferred visual aesthetic.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
