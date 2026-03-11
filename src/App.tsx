import { motion } from 'framer-motion';
import { Gem, LineChart, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Chat from './components/Chat';
import Mint from './components/Mint';
import Navigation from './components/Navigation';
import Notifications from './components/Notifications';
import TheFloor from './components/TheFloor';
import WarRoom from './components/WarRoom';
import { DripCoinIcon } from './components/DripCoinIcon';

type TabKey = 'feed' | 'shop' | 'warroom' | 'profile' | 'mint';
type LooseRecord = Record<string, any>;

export default function App() {
  const [tab, setTab] = useState<TabKey>('feed');
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [profile, setProfile] = useState<LooseRecord | null>(null);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }, []);

  const screen = useMemo(() => {
    if (tab === 'feed') {
      return <TheFloor refreshKey={feedRefreshKey} />;
    }

    if (tab === 'shop') {
      return <ShopScreen />;
    }

    if (tab === 'warroom') {
      return <WarRoom />;
    }

    if (tab === 'mint') {
      return (
        <Mint
          onMinted={() => {
            setTab('feed');
            setFeedRefreshKey((prev) => prev + 1);
          }}
        />
      );
    }

    return <ProfileScreen profile={profile} onProfileChange={setProfile} />;
  }, [tab, feedRefreshKey, profile]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#020202]" style={{ direction: 'rtl' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(17,17,17,0.9)',
            color: '#E5E7EB',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(circle_at_86%_10%,rgba(0,122,255,0.11),transparent_30%)]" />
      <div className="relative z-10 h-full">{screen}</div>
      <Navigation view={tab} onChange={setTab} />
    </main>
  );
}

function ShopScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-4 text-2xl font-semibold text-[#E5E7EB]">חנות כוחות</h1>
        <div className="space-y-3">
          {[
            { title: 'בוסט הייפ מיידי', price: 120, copy: 'מעלה מומנטום ומגדיל חשיפה' },
            { title: 'תצוגת פרימיום', price: 260, copy: 'דחיפה למיקומים בולטים בפיד' },
            { title: 'חבילת טריגר מסחר', price: 420, copy: 'קומבו לשיפור המרות ונראות' },
          ].map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[1.5rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="font-semibold text-[#E5E7EB]">{item.title}</div>
                <div className="flex items-center gap-1.5 text-[#E5E7EB]">
                  <span className="text-sm font-semibold">{item.price.toLocaleString('he-IL')}</span>
                  <DripCoinIcon />
                </div>
              </div>
              <p className="text-xs text-[#E5E7EB]/58">{item.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

type ProfileScreenProps = {
  profile: LooseRecord | null;
  onProfileChange: (profile: LooseRecord | null) => void;
};

function ProfileScreen({ profile, onProfileChange }: ProfileScreenProps) {
  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md space-y-3">
        <h1 className="text-2xl font-semibold text-[#E5E7EB]">פרופיל</h1>

        <article className="rounded-[1.7rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.03]">
              <UserRound size={20} className="text-[#E5E7EB]/82" />
            </div>
            <div>
              <p className="text-xs text-[#E5E7EB]/55">מצב חשבון</p>
              <p className="text-lg font-semibold text-[#E5E7EB]">{profile?.username || 'אורח'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-[11px] text-[#E5E7EB]/55">יתרת DRIPCOIN</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#E5E7EB]">{(profile?.drip_coins ?? 0).toLocaleString('he-IL')}</span>
                <DripCoinIcon />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-[11px] text-[#E5E7EB]/55">סטטוס מסחר</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#007AFF]">
                <Gem size={14} />
                <span className="text-sm font-semibold">פעיל</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#E5E7EB]/55">
            <LineChart size={13} className="text-[#007AFF]" />
            מרכז ניהול לחשבון, התראות וצ׳אט מסחר
          </div>
        </article>

        <Auth onProfileChange={onProfileChange} />
        <Notifications userId={profile?.id} />
        <Chat userId={profile?.id} />
      </div>
    </section>
  );
}
