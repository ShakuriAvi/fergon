/* App root (#44). Email dev-login → backend-driven consumer app. The admin tool
   is web-only (/admin at localhost:5173), so there is no admin screen here. */
import { useEffect, useReducer, useState } from 'react';
import { SafeAreaView, Platform, StatusBar as RNStatusBar, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import DevLoginView from './src/components/DevLoginView';
import Shell from './src/components/Shell';
import FeedView from './src/components/FeedView';
import ProfileView from './src/components/ProfileView';
import RewardsView from './src/components/RewardsView';
import PrincipalView from './src/components/PrincipalView';
import GiveModal from './src/components/GiveModal';
import { colors, fontFamily } from './src/theme';
import { CurrentUserProvider, useMe } from './src/context/CurrentUser';
import { getSession, setSession } from './src/lib/auth';
import { VIEW } from './src/constants';
import { I18N } from './src/components/constants';
import { api } from './src/lib/api';

/* web: load Heebo + base body styles so the canvas matches the Vite build */
function useWebChrome() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('heebo-font')) {
      const pre1 = document.createElement('link');
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre1);
      const link = document.createElement('link');
      link.id = 'heebo-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
    document.title = 'פירגון — הכרה והוקרה לצוותי הוראה';
    document.body.style.backgroundColor = colors.paper;
    document.body.style.margin = '0';
  }, []);
}

export default function App() {
  useWebChrome();
  const [version, bump] = useReducer((x) => x + 1, 0);
  const topInset = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
  const token = getSession()?.token;

  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, paddingTop: topInset }}>
        <StatusBar style="dark" />
        <DevLoginView onSuccess={bump} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, paddingTop: topInset }}>
      <StatusBar style="dark" />
      <CurrentUserProvider key={version} onLogout={bump}>
        <ConsumerShell />
      </CurrentUserProvider>
    </SafeAreaView>
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
  useEffect(() => { loadWallet(); }, [user?.id]);

  const refresh = () => { loadWallet(); setRefreshKey((k) => k + 1); };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily, color: colors.ink3 }}>{t(I18N.COMMON_LOADING)}</Text>
      </View>
    );
  }

  const points = wallet?.points_balance ?? 0;
  const allowanceLeft = wallet?.allowance_remaining ?? 0;

  return (
    <>
      <Shell active={view} onNavigate={setView} onGive={() => setGiveOpen(true)} points={points}>
        {view === VIEW.FEED ? <FeedView onGive={() => setGiveOpen(true)} points={points} allowanceLeft={allowanceLeft} refreshKey={refreshKey} /> : null}
        {view === VIEW.PROFILE ? <ProfileView onGive={() => setGiveOpen(true)} points={points} allowanceLeft={allowanceLeft} refreshKey={refreshKey} /> : null}
        {view === VIEW.REWARDS ? <RewardsView points={points} onRedeemed={refresh} refreshKey={refreshKey} /> : null}
        {view === VIEW.PRINCIPAL ? <PrincipalView refreshKey={refreshKey} /> : null}
      </Shell>
      <GiveModal open={giveOpen} onClose={() => setGiveOpen(false)} onSent={() => { setGiveOpen(false); refresh(); }} allowanceLeft={allowanceLeft} />
    </>
  );
}
