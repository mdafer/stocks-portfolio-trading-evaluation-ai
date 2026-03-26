import { useState } from 'react';
import api from '../api/client';

/**
 * Hook to manage analysis message state + auto-save logic.
 * Returns: { msg, setMsg, saveNew, setSaveNew, maybeSave }
 *
 * Call maybeSave(msg) after a successful analysis to save the message if checkbox was checked.
 */
export function usePromptMessage() {
  const [msg, setMsg] = useState('');
  const [saveNew, setSaveNew] = useState(true);

  const maybeSave = async (message) => {
    if (!saveNew || !message?.trim()) return;
    const body = message.trim();
    // Auto-generate title from first ~40 chars
    const title = body.length > 40 ? body.slice(0, 40).trim() + '…' : body;
    try {
      await api.post('/settings/prompts', { title, body });
    } catch {
      // silently fail — prompt saving is best-effort
    }
  };

  const reset = () => {
    setMsg('');
    setSaveNew(true);
  };

  return { msg, setMsg, saveNew, setSaveNew, maybeSave, reset };
}
