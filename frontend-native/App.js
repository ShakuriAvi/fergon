/* App root — RN port of frontend/src/App.jsx. State-based routing:
   auth gate → Shell + active view, with the give modal overlay. */
import { useState, useEffect } from 'react';
import { SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import LoginView from './src/components/LoginView';
import Shell from './src/components/Shell';
import FeedView from './src/components/FeedView';
import ProfileView from './src/components/ProfileView';
import RewardsView from './src/components/RewardsView';
import PrincipalView from './src/components/PrincipalView';
import AdminView from './src/components/AdminView';
import GiveModal from './src/components/GiveModal';
import { getUser, ME } from './src/data/mock';
import { colors } from './src/theme';

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
  const me = getUser(ME);
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState('feed');
  const [giveOpen, setGiveOpen] = useState(false);
  const [allowanceLeft, setAllowanceLeft] = useState(me.allowance - me.given);
  const [points, setPoints] = useState(me.points);

  const go = (v) => setView(v);
  const openGive = () => setGiveOpen(true);
  const onSent = (data) => {
    setGiveOpen(false);
    setAllowanceLeft((a) => Math.max(0, a - data.points));
  };
  const onRedeem = (reward) => setPoints((p) => Math.max(0, p - reward.cost));

  const topInset = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

  if (!authed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, paddingTop: topInset }}>
        <StatusBar style="dark" />
        <LoginView onLogin={() => { setAuthed(true); setView('feed'); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, paddingTop: topInset }}>
      <StatusBar style="dark" />
      <Shell active={view} onNavigate={go} onGive={openGive} points={points}>
        {view === 'feed' ? <FeedView onGive={openGive} points={points} allowanceLeft={allowanceLeft} /> : null}
        {view === 'profile' ? <ProfileView onGive={openGive} points={points} allowanceLeft={allowanceLeft} /> : null}
        {view === 'rewards' ? <RewardsView points={points} onRedeem={onRedeem} /> : null}
        {view === 'principal' ? <PrincipalView /> : null}
        {view === 'admin' ? <AdminView /> : null}
      </Shell>
      <GiveModal open={giveOpen} onClose={() => setGiveOpen(false)} onSent={onSent} allowanceLeft={allowanceLeft} />
    </SafeAreaView>
  );
}
