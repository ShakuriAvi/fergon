/* Generic list-loading hook for admin tables (#37, mirrors the web hook). */
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

export function useList(listFn) {
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return listFn({ q, limit: PAGE_SIZE, offset, include_inactive: includeInactive })
      .then((res) => setData(res || { items: [], total: 0 }))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, offset, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items: data.items,
    total: data.total,
    loading,
    error,
    q,
    setQ: (v) => { setOffset(0); setQ(v); },
    offset,
    setOffset,
    pageSize: PAGE_SIZE,
    includeInactive,
    setIncludeInactive: (v) => { setOffset(0); setIncludeInactive(v); },
    reload: load,
  };
}
