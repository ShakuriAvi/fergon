/* App root — ported from fergon.html. State-based routing:
   authed gate → Shell + active view, with the give modal overlay. */
import { useState } from 'react';
import LoginView from './components/LoginView.jsx';
import Shell from './components/Shell.jsx';
import FeedView from './components/FeedView.jsx';
import ProfileView from './components/ProfileView.jsx';
import RewardsView from './components/RewardsView.jsx';
import PrincipalView from './components/PrincipalView.jsx';
import AdminView from './components/AdminView.jsx';
import GiveModal from './components/GiveModal.jsx';
import { getUser, ME } from './data/mock.js';

export default function App() {
  const me = getUser(ME);
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState('feed');
  const [giveOpen, setGiveOpen] = useState(false);
  const [allowanceLeft, setAllowanceLeft] = useState(me.allowance - me.given);
  const [points, setPoints] = useState(me.points);

  const go = (v) => {
    setView(v);
    window.scrollTo?.(0, 0);
  };

  if (!authed) {
    return (
      <LoginView
        onLogin={() => {
          setAuthed(true);
          setView('feed');
        }}
      />
    );
  }

  const onSent = (data) => {
    setGiveOpen(false);
    setAllowanceLeft((a) => Math.max(0, a - data.points));
  };

  const onRedeem = (reward) => setPoints((p) => Math.max(0, p - reward.cost));

  const openGive = () => setGiveOpen(true);

  return (
    <>
      <Shell active={view} onNavigate={go} onGive={openGive} points={points}>
        {view === 'feed' ? <FeedView onGive={openGive} points={points} allowanceLeft={allowanceLeft} /> : null}
        {view === 'profile' ? <ProfileView onGive={openGive} points={points} allowanceLeft={allowanceLeft} /> : null}
        {view === 'rewards' ? <RewardsView points={points} onRedeem={onRedeem} /> : null}
        {view === 'principal' ? <PrincipalView /> : null}
        {view === 'admin' ? <AdminView /> : null}
      </Shell>
      <GiveModal open={giveOpen} onClose={() => setGiveOpen(false)} onSent={onSent} allowanceLeft={allowanceLeft} />
    </>
  );
}
