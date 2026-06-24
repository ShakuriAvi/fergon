/* Current-user context (#44, mirrors web). */
import { createContext, useContext } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { clearSession } from '../lib/auth';

const Ctx = createContext({ user: null, loading: false, error: null, reload: () => {}, logout: () => {} });

export function CurrentUserProvider({ children, onLogout }) {
  const { user, loading, error, reload } = useCurrentUser();
  const logout = () => {
    clearSession();
    if (onLogout) onLogout();
  };
  return <Ctx.Provider value={{ user, loading, error, reload, logout }}>{children}</Ctx.Provider>;
}

export function useMe() {
  return useContext(Ctx);
}
