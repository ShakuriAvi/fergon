/* Current-user context (#43): makes the authenticated user + reload/logout
   available to the shell and consumer views without prop-drilling or mock data. */
import { createContext, useContext } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { api } from '../lib/api.js';
import { clearSession } from '../lib/auth.js';

const Ctx = createContext({ user: null, loading: false, error: null, reload: () => {}, logout: () => {} });

export function CurrentUserProvider({ children, onLogout }) {
  const { user, loading, error, reload } = useCurrentUser();
  const logout = () => {
    // Clear the server cookie too, then drop the local marker.
    api.logout().catch(() => {}).finally(() => {
      clearSession();
      if (onLogout) onLogout();
    });
  };
  return <Ctx.Provider value={{ user, loading, error, reload, logout }}>{children}</Ctx.Provider>;
}

export function useMe() {
  return useContext(Ctx);
}
