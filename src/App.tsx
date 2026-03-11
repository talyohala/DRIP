import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Market from './components/Market';
import Mint from './components/Mint';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import Settings from './components/Settings';
import TheFloor from './components/TheFloor';
import WarRoom from './components/WarRoom';
import { supabase } from './lib/supabase';

type ViewKey = 'floor' | 'mint' | 'market' | 'warroom' | 'profile' | 'settings';
type PrimaryView = 'floor' | 'mint' | 'market' | 'profile';

const getHashView = (): ViewKey => {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'mint') return 'mint';
  if (hash === 'market') return 'market';
  if (hash === 'warroom') return 'warroom';
  if (hash === 'profile') return 'profile';
  if (hash === 'settings') return 'settings';
  return 'floor';
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewKey>(getHashView());
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';

    const onHashChange = () => setView(getHashView());
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      subscription.unsubscribe();
    };
  }, []);

  const navigate = (nextView: ViewKey) => {
    window.location.hash = nextView;
    setView(nextView);
  };

  const navigatePrimary = (nextView: PrimaryView) => navigate(nextView);

  const screen = useMemo(() => {
    if (view === 'floor') {
      return <TheFloor refreshKey={feedRefreshKey} />;
    }

    if (view === 'market') {
      return <Market onOpenWarRoom={() => navigate('warroom')} onOpenProfile={() => navigate('profile')} />;
    }

    if (view === 'warroom') {
      return <WarRoom />;
    }

    if (view === 'mint') {
      return (
        <Mint
          onMinted={() => {
            navigate('floor');
            setFeedRefreshKey((prev) => prev + 1);
          }}
        />
      );
    }

    if (view === 'settings') {
      return <Settings onClose={() => navigate('profile')} onOpenWarRoom={() => navigate('warroom')} />;
    }

    return <Profile onOpenSettings={() => navigate('settings')} onOpenWarRoom={() => navigate('warroom')} />;
  }, [view, feedRefreshKey]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black" style={{ direction: 'rtl' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1C1C1E',
            color: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
      {!session ? (
        <Auth />
      ) : (
        <>
          <div className="relative z-10 h-full">{screen}</div>
          <Navigation view={view} onChange={navigatePrimary} />
        </>
      )}
    </main>
  );
}
