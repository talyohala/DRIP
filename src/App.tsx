import { motion } from 'framer-motion';
import { Gem, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Mint from './components/Mint';
import Navigation from './components/Navigation';
import TheFloor from './components/TheFloor';
import WarRoom from './components/WarRoom';
import { DripCoinIcon } from './components/DripCoin';

type TabKey = 'feed' | 'shop' | 'warroom' | 'profile' | 'mint';

export default function App() {
  const [tab, setTab] = useState<TabKey>('feed');
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

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

    return <ProfileScreen />;
  }, [tab, feedRefreshKey]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#020202]" style={{ direction: 'rtl' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(7,7,7,0.9)',
            color: '#f8fafc',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(34,211,238,0.14),transparent_42%),radial-gradient(circle_at_80%_12%,rgba(16,185,129,0.12),transparent_36%),radial-gradient(circle_at_50%_90%,rgba(234,179,8,0.1),transparent_40%)]" />
      <div className="relative z-10 h-full">{screen}</div>
      <Navigation view={tab} onChange={setTab} />
    </main>
  );
}

function ShopScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-4 text-2xl font-black text-white">חנות כוחות</h1>
        <div className="space-y-3">
          {[
            { title: 'בוסט הייפ מיידי', price: 120, copy: 'מעלה את המומנטום ומגדיל חשיפה.' },
            { title: 'תצוגת פרימיום', price: 260, copy: 'הדגשה של הנכס בראש הזרם.' },
            { title: 'חבילת טריגר מסחר', price: 420, copy: 'קומבו לשיפור מעורבות והמרות.' },
          ].map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-2xl"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="font-black text-white">{item.title}</div>
                <div className="flex items-center gap-1.5 text-cyan-100">
                  <span className="text-sm font-black">{item.price.toLocaleString('he-IL')}</span>
                  <DripCoinIcon className="h-4" />
                </div>
              </div>
              <p className="text-xs text-white/60">{item.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md space-y-3">
        <h1 className="text-2xl font-black text-white">פרופיל</h1>
        <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
              <UserRound size={22} className="text-cyan-200" />
            </div>
            <div>
              <p className="text-xs text-white/55">חשבון פעיל</p>
              <p className="text-lg font-black text-white">את/ה</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-[11px] text-white/55">יתרה</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm font-black text-white">5,000</span>
                <DripCoinIcon className="h-4" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
              <p className="text-[11px] text-white/55">סטטוס שוק</p>
              <div className="mt-1 flex items-center gap-1.5 text-emerald-200">
                <Gem size={14} />
                <span className="text-sm font-black">פעיל</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/60">הפרופיל שלך הוא מרכז הניהול לכל הנכסים, כוחות והיסטוריית מסחר.</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-2xl">
          <h2 className="mb-1 text-sm font-black text-white">שיפור כלכלה שיווקית</h2>
          <p className="text-xs leading-relaxed text-white/65">
            כדי להגדיל התמכרות חיובית ומעורבות, מומלץ לפרסם הנפקות בשעות עומס, לבנות רצף השתלטויות קצר, ולשלב כוחות שמגדילים הייפ
            לפני מכירה.
          </p>
        </article>
      </div>
    </section>
  );
}
