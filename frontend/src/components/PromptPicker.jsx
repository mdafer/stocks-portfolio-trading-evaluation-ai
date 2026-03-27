import { useState, useEffect } from 'react';
import api from '../api/client';

/**
 * PromptPicker — reusable component for analysis modals.
 *
 * Props:
 *   value        — current textarea value (the custom message)
 *   onChange     — (newValue: string) => void
 *   saveNew      — whether to auto-save new custom messages (controlled externally)
 *   onSaveNewChange — (checked: boolean) => void
 */
export default function PromptPicker({ value, onChange, saveNew, onSaveNewChange }) {
  const [prompts, setPrompts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/settings/prompts').then((d) => {
      if (!cancelled) { setPrompts(d.prompts || []); setLoaded(true); }
    }).catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const togglePrompt = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      // Rebuild textarea from selected prompts
      const selectedBodies = prompts
        .filter((p) => next.has(p.id))
        .map((p) => p.body);
      onChange(selectedBodies.join('\n\n'));

      // Don't auto-save when using existing prompts; re-enable when all deselected
      onSaveNewChange(next.size === 0);

      return next;
    });
  };

  if (!loaded) return null;

  return (
    <div className="prompt-picker">
      {prompts.length > 0 && (
        <div className="prompt-chips">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`prompt-chip ${selected.has(p.id) ? 'active' : ''}`}
              onClick={() => togglePrompt(p.id)}
              title={p.body}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label>Additional instructions <span className="text-muted">(optional)</span></label>
        <textarea
          placeholder="e.g. Focus on tech sector risks, or compare to S&P 500…"
          value={value}
          onChange={(e) => { onChange(e.target.value); setSelected(new Set()); }}
          rows={3}
        />
      </div>

      {value.trim() && selected.size === 0 && (
        <label className="save-prompt-check">
          <input
            type="checkbox"
            checked={saveNew}
            onChange={(e) => onSaveNewChange(e.target.checked)}
          />
          <span className="text-sm">Save this message for future use</span>
        </label>
      )}
    </div>
  );
}
