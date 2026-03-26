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

  // Read body once as text, then parse — avoids the double-consume bug
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[API] Non-JSON response ${res.status} ${res.statusText} at ${path}:`, text.slice(0, 500));
    throw new Error(`Server error ${res.status}: ${res.statusText}`);
  }

  if (!data.success) {
    const msg = data.message || 'Request failed';
    console.error(`[API] ${res.status} at ${path}:`, msg);
    throw new Error(msg);
  }
  return data.data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export default api;
