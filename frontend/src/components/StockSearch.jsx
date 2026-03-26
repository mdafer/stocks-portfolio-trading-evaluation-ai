import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function StockSearch() {
  const navigate = useNavigate();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/stocks/search?q=${encodeURIComponent(q)}`);
      setResults(data.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (symbol) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    navigate(`/stocks/${symbol}`);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      go(results[activeIdx].symbol);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="stock-search" ref={wrapRef}>
      <div className="stock-search-box">
        <span className="stock-search-icon">⌕</span>
        <input
          ref={inputRef}
          className="stock-search-input"
          type="text"
          placeholder="Search stocks…"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="stock-search-spinner" />}
        {query && !loading && (
          <button
            className="stock-search-clear"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="stock-search-dropdown">
          {results.map((r, i) => (
            <button
              key={r.symbol}
              className={`stock-search-result ${i === activeIdx ? 'active' : ''}`}
              onMouseDown={e => { e.preventDefault(); go(r.symbol); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="ticker">{r.symbol}</span>
              <span className="stock-search-name">{r.name}</span>
              {r.exchange && <span className="stock-search-exch">{r.exchange}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
