/* App root (#42/#43). Path-based split:
   - /admin  → standalone admin tool (its own login + guard)
   - /        → consumer app (email dev-login → backend-driven feed/profile/…) */
import { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminApp from './components/AdminApp.jsx';
import DevLoginView from './components/DevLoginView.jsx';
import Shell from './components/Shell.jsx';
import FeedView from './components/FeedView.jsx';
import ProfileView from './components/ProfileView.jsx';
import RewardsView from './components/RewardsView.jsx';
import PrincipalView from './components/PrincipalView.jsx';
import GiveModal from './components/GiveModal.jsx';
import { CurrentUserProvider, useMe } from './context/CurrentUser.jsx';
import { isAuthed } from './lib/auth.js';
import { api } from './lib/api.js';
import { VIEW, ROUTE } from './constants.js';
import { I18N } from './components/constants.js';

function isAdminRoute() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith(ROUTE.ADMIN_PREFIX);
}

export default function App() {
  if (isAdminRoute()) return <AdminApp />;
  return <ConsumerApp />;
}

function ConsumerApp() {
  const [version, bump] = useReducer((x) => x + 1, 0);
  if (!isAuthed()) return <DevLoginView onSuccess={bump} />;
  return (
    <CurrentUserProvider key={version} onLogout={bump}>
      <ConsumerShell />
    </CurrentUserProvider>
  );
}

function ConsumerShell() {
  const { t } = useTranslation();
  const { user, loading } = useMe();
  const [view, setView] = useState(VIEW.FEED);
  const [giveOpen, setGiveOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWallet = () => api.wallet().then(setWallet).catch(() => setWallet(null));
  useEffect(() => {
    loadWallet();
  }, [user?.id]);

  const refresh = () => {
    loadWallet();
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink-3">{t(I18N.COMMON_LOADING)}</div>;
  }

  const points = wallet?.points_balance ?? 0;
  const allowanceLeft = wallet?.allowance_remaining ?? 0;
  const go = (v) => {
    setView(v);
    window.scrollTo?.(0, 0);
  };

  return (
    <>
      <Shell active={view} onNavigate={go} onGive={() => setGiveOpen(true)} points={points}>
        {view === VIEW.FEED ? <FeedView onGive={() => setGiveOpen(true)} points={points} allowanceLeft={allowanceLeft} refreshKey={refreshKey} /> : null}
        {view === VIEW.PROFILE ? <ProfileView onGive={() => setGiveOpen(true)} points={points} allowanceLeft={allowanceLeft} refreshKey={refreshKey} /> : null}
        {view === VIEW.REWARDS ? <RewardsView points={points} onRedeemed={refresh} refreshKey={refreshKey} /> : null}
        {view === VIEW.PRINCIPAL ? <PrincipalView refreshKey={refreshKey} /> : null}
      </Shell>
      <GiveModal
        open={giveOpen}
        onClose={() => setGiveOpen(false)}
        onSent={() => { setGiveOpen(false); refresh(); }}
        allowanceLeft={allowanceLeft}
      />
    </>
  );
}
