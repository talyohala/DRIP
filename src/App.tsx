import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Home, Plus, Store, User } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import TheFloor from './components/TheFloor';
import { DripCoinIcon } from './components/DripCoinIcon';
import { supabase } from './lib/supabase';

type TabKey = 'feed' | 'shop' | 'alerts' | 'profile';

const TABS: Array<{ key: TabKey; label: string; icon: typeof Home }> = [
  { key: 'feed', label: 'פיד', icon: Home },
  { key: 'shop', label: 'חנות', icon: Store },
  { key: 'alerts', label: 'התראות', icon: Bell },
  { key: 'profile', label: 'פרופיל', icon: User },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('feed');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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

    if (tab === 'alerts') {
      return <AlertsScreen />;
    }

    return <ProfileScreen />;
  }, [tab, feedRefreshKey]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#02030a]" style={{ direction: 'rtl' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.23),transparent_42%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.16),transparent_38%)]" />
      <div className="relative z-10 h-full">{screen}</div>

      <BottomNavigation currentTab={tab} onTabChange={setTab} onUploadClick={() => setIsUploadOpen(true)} />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {
          setTab('feed');
          setFeedRefreshKey((prev) => prev + 1);
          setIsUploadOpen(false);
        }}
      />
    </main>
  );
}

function BottomNavigation({
  currentTab,
  onTabChange,
  onUploadClick,
}: {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full border border-white/15 bg-black/55 p-2 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-1">
          {TABS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={14} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onUploadClick}
          className="grid h-14 w-14 place-items-center rounded-full border border-emerald-200/50 bg-gradient-to-b from-emerald-300 via-cyan-300 to-fuchsia-300 text-black shadow-[0_0_28px_rgba(52,211,153,0.75)]"
          aria-label="העלאה"
        >
          <Plus size={28} strokeWidth={2.8} />
        </motion.button>

        <div className="flex items-center gap-1">
          {TABS.slice(2).map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={14} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function UploadModal({
  isOpen,
  onClose,
  onUploaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isVideo = file?.type.startsWith('video/');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const reset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setError('');
    setSuccess('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    reset();
    onClose();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      return;
    }

    if (!nextFile.type.startsWith('image/') && !nextFile.type.startsWith('video/')) {
      setError('אפשר להעלות רק תמונה או וידאו.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('צריך לבחור קובץ לפני העלאה.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const randomId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const storagePath = `uploads/${Date.now()}-${randomId}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('drip_media').upload(storagePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from('drip_media').getPublicUrl(storagePath);
      const mediaUrl = publicData.publicUrl;

      const attempts: Array<Record<string, unknown>> = [
        { media_url: mediaUrl, owner: 'את/ה', price: 500, hype: 100, media_type: file.type },
        { media_url: mediaUrl, owner: 'את/ה', price: 500, hype: 100 },
        { media_url: mediaUrl, price: 500, hype: 100 },
      ];

      let lastError: Error | null = null;
      for (const payload of attempts) {
        const { error: insertError } = await supabase.from('assets').insert(payload);
        if (!insertError) {
          lastError = null;
          break;
        }
        lastError = insertError;
      }

      if (lastError) {
        throw lastError;
      }

      setSuccess('הקובץ הועלה ונוסף לפיד בהצלחה.');
      window.setTimeout(() => {
        reset();
        onUploaded();
      }, 350);
    } catch (unknownError) {
      const fallbackMessage = unknownError instanceof Error && unknownError.message.includes('row-level security')
        ? 'אין הרשאה להוספה לטבלה. בדוק/י את מדיניות הגישה.'
        : 'ההעלאה נכשלה. נסה/י שוב בעוד רגע.';
      setError(fallbackMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/75 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-white/15 bg-black/65 p-4 backdrop-blur-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">העלאת מדיה חדשה</h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80"
              >
                סגור
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block rounded-2xl border border-dashed border-white/25 bg-white/5 p-3 text-sm text-white/85">
                <span className="mb-2 block font-semibold">בחר/י תמונה או וידאו</span>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full text-xs" />
              </label>

              {previewUrl && (
                <div className="overflow-hidden rounded-2xl border border-white/15">
                  {isVideo ? (
                    <video src={previewUrl} controls className="max-h-64 w-full bg-black object-contain" />
                  ) : (
                    <img src={previewUrl} alt="תצוגה מקדימה" className="max-h-64 w-full bg-black object-contain" />
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
                נכס חדש ייווצר עם מחיר פתיחה 500 DRIPCOIN והייפ 100.
              </div>

              {error && <div className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200">{error}</div>}
              {success && (
                <div className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100">{success}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 px-4 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(52,211,153,0.6)]"
              >
                {isSubmitting ? 'מעלה עכשיו...' : 'העלה עכשיו'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShopScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-6">
      <h1 className="mb-3 text-2xl font-black text-white">חנות</h1>
      <div className="space-y-3">
        {[
          { title: 'בוסט הייפ', price: 120 },
          { title: 'תצוגת פרימיום', price: 260 },
          { title: 'הדגשה לשעה', price: 420 },
        ].map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white">{item.title}</div>
              <div className="flex items-center gap-1 text-emerald-300">
                <DripCoinIcon className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-black">{item.price} DRIPCOIN</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AlertsScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-6">
      <h1 className="mb-3 text-2xl font-black text-white">התראות</h1>
      <div className="space-y-3">
        {['קיבלת לייק חדש על נכס.', 'המחיר של נכס במעקב עלה.', 'הועלתה מדיה חדשה לפיד.'].map((text, index) => (
          <article key={`${text}-${index}`} className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-xl">
            <p className="text-sm text-white/90">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileScreen() {
  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-6">
      <h1 className="mb-3 text-2xl font-black text-white">פרופיל</h1>
      <article className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-xl">
        <div className="text-sm text-white/75">שם משתמש</div>
        <div className="mt-1 text-lg font-black text-white">את/ה</div>
        <div className="mt-4 flex items-center gap-2 text-emerald-300">
          <DripCoinIcon className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold">יתרה: 5,000 DRIPCOIN</span>
        </div>
      </article>
    </section>
  );
}
