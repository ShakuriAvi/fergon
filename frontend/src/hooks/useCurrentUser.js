/* Resolve the current user (#34/#43).
   When a token is present we load identity from /auth/me; otherwise null.
   Exposes loading, error and a reload() so login/logout can refresh. */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getSession } from '../lib/auth.js';

export function useCurrentUser() {
  const [state, setState] = useState({ user: null, loading: true, error: null });

  const reload = useCallback(() => {
    const session = getSession();
    if (!session) {
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
