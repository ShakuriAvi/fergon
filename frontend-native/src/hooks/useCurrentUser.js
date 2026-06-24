/* Resolve the current user (#44, mirrors web). Loads /auth/me when a token is
   present; exposes loading/error/reload. */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getSession } from '../lib/auth';

export function useCurrentUser() {
  const [state, setState] = useState({ user: null, loading: true, error: null });

  const reload = useCallback(() => {
    const session = getSession();
    if (!session?.token) {
      setState({ user: null, loading: false, error: null });
      return Promise.resolve();
    }
    setState((s) => ({ ...s, loading: true }));
    return api
      .me()
      .then((me) => setState({ user: { ...session, ...me }, loading: false, error: null }))
      .catch((error) => setState({ user: session, loading: false, error }));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
