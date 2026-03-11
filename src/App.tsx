import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabase';

import TheFloor from './components/TheFloor';
import Auth from './components/Auth';
import Mint from './components/Mint';
import Market from './components/Market';
import WarRoom from './components/WarRoom';
import Chat from './components/Chat';
import ChatRoom from './components/ChatRoom';
import Profile from './components/Profile';
import PublicProfile from './components/PublicProfile';
import Notifications from './components/Notifications';
import Navigation from './components/Navigation';

const normalizeView = (rawHash: string) => {
  const cleaned = rawHash.replace('#', '') || 'floor';
  if (cleaned === 'market') return 'arsenal';
  return cleaned;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<string>(normalizeView(window.location.hash));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    const handleHashChange = () => setView(normalizeView(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (nextView: string) => {
    const normalized = nextView === 'market' ? 'arsenal' : nextView;
    window.location.hash = normalized;
    setView(normalized);
  };

  const showBottomNav = !view.startsWith('room_') && !view.startsWith('user_');

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03050b] text-white selection:bg-cyan-400/30">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-52 left-1/2 h-[48vh] w-[95vw] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-[-10vh] left-1/2 h-[45vh] w-[90vw] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(9, 12, 20, 0.94)',
            color: '#fff',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.16)',
          },
        }}
      />

      {!session ? (
        <Auth />
      ) : (
        <>
          <main className="relative z-10 w-full">
            {view === 'floor' && <TheFloor />}
            {view === 'arsenal' && <Market />}
            {view === 'warroom' && <WarRoom />}
            {view === 'profile' && <Profile />}

            {/* Legacy routes stay mounted for deep links or internal redirects. */}
            {view === 'mint' && <Mint />}
            {view === 'chat' && <Chat />}
            {view === 'notifications' && <Notifications />}

            {view.startsWith('room_') && <ChatRoom targetUserId={view.replace('room_', '')} />}
            {view.startsWith('user_') && (
              <PublicProfile targetUserId={view.replace('user_', '')} onClose={() => window.history.back()} />
            )}
          </main>

          {showBottomNav && <Navigation view={view} setView={navigateTo} />}
        </>
      )}
    </div>
  );
}

export default App;
