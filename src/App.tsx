import React, { useState, useEffect } from 'react';
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
import Notifications from './components/Notifications'; // הייבוא החדש
import Navigation from './components/Navigation';

function App() {
  const [session, setSession] = useState<any>(null);
  const getHashView = () => window.location.hash.replace('#', '') || 'floor';
  const [view, setView] = useState<string>(getHashView());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    const handleHashChange = () => setView(getHashView());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView: string) => {
    window.location.hash = newView;
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#020202] relative overflow-x-hidden text-white selection:bg-cyan-500/30">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', borderRadius: '16px' } }} />
      
      {!session ? (
        <Auth />
      ) : (
        <>
          <main className="w-full">
            {view === 'floor' && <TheFloor />}
            {view === 'mint' && <Mint />}
            {view === 'market' && <Market />}
            {view === 'warroom' && <WarRoom />}
            {view === 'chat' && <Chat />}
            {view === 'profile' && <Profile />}
            {view === 'notifications' && <Notifications />}
            
            {view.startsWith('room_') && <ChatRoom targetUserId={view.replace('room_', '')} />}
            {view.startsWith('user_') && <PublicProfile targetUserId={view.replace('user_', '')} onClose={() => { window.history.back() }} />}
          </main>
          
          {!view.startsWith('room_') && !view.startsWith('user_') && (
            <Navigation view={view} setView={navigateTo} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
          )}
        </>
      )}
    </div>
  );
}
export default App;
