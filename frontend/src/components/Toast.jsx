import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const ICON = { success: '✓', error: '✕', info: 'ℹ' };

function NotificationPanel({ history, onClose, onClear }) {
  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel">
        <div className="notif-panel-header">
          <span className="notif-panel-title">Notifications</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {history.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear all</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="notif-list">
          {history.length === 0 ? (
            <p className="notif-empty">No notifications yet</p>
          ) : (
            history.map((n) => (
              <div key={n.id} className={`notif-item notif-item-${n.type}`}>
                <span className="notif-item-icon">{ICON[n.type] ?? 'ℹ'}</span>
                <div className="notif-item-body">
                  <span className="notif-item-msg">{n.message}</span>
                  <span className="notif-item-time">{timeAgo(n.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export function ToastProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [active, setActive]   = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const n = { id, message, type, timestamp: new Date().toISOString() };
    setHistory((prev) => [n, ...prev]);
    setActive((prev) => [...prev, n]);
    setUnreadCount((prev) => prev + 1);
    setTimeout(() => setActive((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id) => setActive((prev) => prev.filter((t) => t.id !== id)), []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setUnreadCount(0);
  }, []);

  const closePanel  = useCallback(() => setPanelOpen(false), []);
  const clearHistory = useCallback(() => { setHistory([]); setUnreadCount(0); }, []);

  return (
    <ToastContext.Provider value={{ addToast, history, unreadCount, panelOpen, openPanel, closePanel, clearHistory }}>
      {children}

      {/* Active toast stack */}
      <div className="toast-container">
        {active.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            <span className="toast-icon">{ICON[t.type] ?? 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Notification history panel */}
      {panelOpen && (
        <NotificationPanel history={history} onClose={closePanel} onClear={clearHistory} />
      )}
    </ToastContext.Provider>
  );
}

/** Backward-compatible: returns addToast(message, type) */
export const useToast = () => useContext(ToastContext).addToast;

/** Full notification state for the bell icon / panel trigger */
export const useNotifications = () => {
  const { history, unreadCount, panelOpen, openPanel, closePanel, clearHistory } = useContext(ToastContext);
  return { history, unreadCount, panelOpen, openPanel, closePanel, clearHistory };
};
