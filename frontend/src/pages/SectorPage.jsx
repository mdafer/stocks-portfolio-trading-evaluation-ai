import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import PageError from '../components/PageError';
import './SectorPage.css';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
  CHF: 'CHF ', CAD: 'C$', AUD: 'A$', HKD: 'HK$', SGD: 'S$',
  KRW: '₩', INR: '₹', BRL: 'R$', TWD: 'NT$',
};
const csym = (c) => CURRENCY_SYMBOLS[c] || (c ? c + ' ' : '$');

const fmtPrice = (price, currency) =>
  price != null ? `${csym(currency)}${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const fmtCap = (n) => {
  if (n == null) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
};

function ChangePill({ value }) {
  if (value == null) return <span className="text-muted">—</span>;
  const pos = value >= 0;
  return (
    <span className={`change-badge ${pos ? 'pos' : 'neg'}`} style={{ fontSize: '.78rem' }}>
      {pos ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

// All columns are client-side sorted (screener doesn't accept custom sort params)
const COLS = [
  { key: 'symbol',    label: 'Symbol'     },
  { key: 'name',      label: 'Company'    },
  { key: 'industry',  label: 'Industry'   },
  { key: 'price',     label: 'Price'      },
  { key: 'change1d',  label: '1D'         },
  { key: 'change1m',  label: '30D'        },
  { key: 'change1y',  label: '1Y'         },
  { key: 'change5y',  label: '5Y'         },
  { key: 'marketCap', label: 'Market Cap' },
];

const CAP_FILTERS = [
  { key: 'all',   label: 'All Caps' },
  { key: 'mega',  label: 'Mega (200B+)',   min: 200e9 },
  { key: 'large', label: 'Large (10‑200B)', min: 10e9,  max: 200e9 },
  { key: 'mid',   label: 'Mid (2‑10B)',     min: 2e9,   max: 10e9 },
  { key: 'small', label: 'Small (300M‑2B)', min: 300e6, max: 2e9 },
  { key: 'micro', label: 'Micro (<300M)',              max: 300e6 },
];

const PAGE_SIZES = [10, 25, 50];

export default function SectorPage() {
  const { sectorId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const region   = searchParams.get('region')   || 'us';
  const page     = parseInt(searchParams.get('page')     || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');
  const search   = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef(null);
  const [sort, setSort] = useState({ key: 'marketCap', dir: 'desc' });
  const [capFilter, setCapFilter] = useState('all');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Debounce search input → URL param
  const handleSearchChange = (value) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value.trim()) {
        next.set('search', value.trim());
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      setSearchParams(next);
    }, 400);
  };

  // Sync searchInput when URL search param changes externally
  useEffect(() => { setSearchInput(search); }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSort({ key: 'marketCap', dir: 'desc' });
    setCapFilter('all');
    try {
      const params = new URLSearchParams({ region, page, pageSize });
      if (search) params.set('search', search);
      const res = await api.get(`/stocks/sectors/${encodeURIComponent(sectorId)}/stocks?${params}`);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sectorId, region, page, pageSize, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setParam = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => next.set(k, String(v)));
    if ('region' in updates || 'pageSize' in updates) next.set('page', '1');
    setSearchParams(next);
  };

  const handleColSort = (key) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'symbol' || key === 'name' || key === 'industry' ? 'asc' : 'desc' }
    );
  };

  const stocks = useMemo(() => {
    let rows = data?.stocks ?? [];

    // Apply market cap filter
    if (capFilter !== 'all') {
      const cf = CAP_FILTERS.find(f => f.key === capFilter);
      if (cf) {
        rows = rows.filter(s => {
          if (s.marketCap == null) return false;
          if (cf.min != null && s.marketCap < cf.min) return false;
          if (cf.max != null && s.marketCap >= cf.max) return false;
          return true;
        });
      }
    }

    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, capFilter]);

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const decodedSector = decodeURIComponent(sectorId);

  return (
    <div className="page sector-page" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="sector-page-header">
        <div className="sector-page-title-group">
          <button
            className="breadcrumb"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            onClick={() => navigate(`/stocks?region=${region}`)}
          >
            ← Sectors
          </button>
          <h1 className="sector-page-title">{decodedSector}</h1>
          {total > 0 && (
            <p className="sector-page-subtitle">
              {capFilter !== 'all' && stocks.length !== total
                ? `${stocks.length} of ${total.toLocaleString()} stocks`
                : `${total.toLocaleString()} stocks`}
            </p>
          )}
        </div>

        <div className="sector-page-controls">
          <div className="sector-search-box">
            <span className="sector-search-icon">⌕</span>
            <input
              type="text"
              className="sector-search-input"
              placeholder="Search by symbol…"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button className="sector-search-clear" onClick={() => handleSearchChange('')}>×</button>
            )}
          </div>
          <div className="segment">
            {['us', 'ca'].map(r => (
              <button
                key={r}
                className={`segment-btn ${region === r ? 'active' : ''}`}
                onClick={() => setParam({ region: r })}
              >
                {r === 'us' ? 'US' : 'Canada'}
              </button>
            ))}
          </div>
          <select
            value={capFilter}
            onChange={e => setCapFilter(e.target.value)}
            className="page-size-select"
          >
            {CAP_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select
            value={pageSize}
            onChange={e => setParam({ pageSize: e.target.value })}
            className="page-size-select"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s} per page</option>)}
          </select>
        </div>
      </div>

      {/* Table panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spinner center />
            <p className="text-muted text-sm" style={{ marginTop: 16 }}>
              Loading stocks &amp; price history…
            </p>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: 32 }}>
            <PageError message={error} onRetry={fetchData} />
          </div>
        )}

        {!loading && !error && stocks.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="text-muted">
              {search
                ? `No stocks matching "${search}" in this sector.`
                : 'No stocks found for this sector / region.'}
            </span>
            {search && (
              <button
                className="btn btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => handleSearchChange('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {!loading && !error && stocks.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ marginBottom: 0, minWidth: 820 }}>
              <thead>
                <tr>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      className="sortable-th"
                      onClick={() => handleColSort(col.key)}
                      style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    >
                      {col.label}
                      <span className="sort-indicator">
                        {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.symbol}>
                    <td>
                      <Link to={`/stocks/${s.symbol}`} className="ticker" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {s.symbol}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: '.875rem' }}>{s.name}</span>
                    </td>
                    <td>
                      {s.industry
                        ? <span className="badge badge-subtle">{s.industry}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtPrice(s.price, s.currency)}</td>
                    <td><ChangePill value={s.change1d} /></td>
                    <td><ChangePill value={s.change1m} /></td>
                    <td><ChangePill value={s.change1y} /></td>
                    <td><ChangePill value={s.change5y} /></td>
                    <td className="text-muted text-sm">{fmtCap(s.marketCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span className="text-muted text-sm">
            Page {page} of {totalPages} · {total.toLocaleString()} stocks
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setParam({ page: page - 1 })}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`el-${i}`} style={{ padding: '5px 4px', color: 'var(--text-3)', fontSize: '.82rem' }}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : ''}`}
                    onClick={() => setParam({ page: p })}
                  >
                    {p}
                  </button>
                )
              )}
            <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setParam({ page: page + 1 })}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
