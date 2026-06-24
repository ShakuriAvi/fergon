/* Standalone admin tool (#42), served at /admin — separate from the consumer
   app. Its own email login (must resolve to an access_level=admin user), then
   the full AdminView; non-admins are denied. */
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import AdminView from './AdminView.jsx';
import DevLoginView from './DevLoginView.jsx';
import { Button } from './primitives.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { api } from '../lib/api.js';
import { clearSession, isAdmin, isAuthed } from '../lib/auth.js';

function Centered({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-paper p-[24px] text-center">{children}</div>;
}

function AdminAuthed({ onLogout }) {
  const { t } = useTranslation();
  const { user, loading } = useCurrentUser();

  if (loading) return <Centered>{t(I18N.COMMON_LOADING)}</Centered>;

  if (!isAdmin(user)) {
    return (
      <Centered>
        <div>
          <h1 className="font-display text-[24px] font-extrabold text-ink">{t('admin.accessDeniedTitle')}</h1>
          <p className="mt-[6px] text-[14px] text-ink-2">{t('admin.accessDeniedBody')}</p>
          <Button variant="primary" size="md" className="mt-[16px]" onClick={onLogout}>{t(I18N.ADMIN_LOGOUT)}</Button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-rule px-[24px] py-[12px]">
        <span className="font-display text-[18px] font-extrabold text-ink">{t('admin.toolTitle')}</span>
        <Button variant="ghost" size="sm" onClick={onLogout}>{t(I18N.ADMIN_LOGOUT)}</Button>
      </header>
      <AdminView />
    </div>
  );
}

export default function AdminApp() {
  const { t } = useTranslation();
  const [version, bump] = useReducer((x) => x + 1, 0);

  if (!isAuthed()) {
    return <DevLoginView heading={t('admin.loginHeading')} onSuccess={bump} />;
  }
  // Clear the server cookie too, then drop the local marker and re-render.
  const logout = () => {
    api.logout().catch(() => {}).finally(() => { clearSession(); bump(); });
  };
  return <AdminAuthed key={version} onLogout={logout} />;
}
