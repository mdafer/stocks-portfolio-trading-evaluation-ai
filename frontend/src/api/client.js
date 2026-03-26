const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch (err) {
    // Response is not valid JSON (e.g., HTML error page)
    const text = await res.text();
    console.error(`[API Error] ${res.status} ${res.statusText} at ${path}:`, text.slice(0, 500));
    throw new Error(`Server returned ${res.status}: ${res.statusText}`);
  }

  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export default api;
