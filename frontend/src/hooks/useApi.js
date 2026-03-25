import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path, ...deps]);

  useEffect(refresh, [refresh]);

  return { data, loading, error, refresh };
}
