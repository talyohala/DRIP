import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DripCoinIcon } from './DripCoinIcon';
import { supabase } from '../lib/supabase';

type FloorAsset = {
  id: string;
  mediaUrl: string;
  owner: string;
  hype: number;
  price: number;
};

type TheFloorProps = {
  refreshKey: number;
};

const FALLBACK_ASSETS: FloorAsset[] = [
  {
    id: 'fallback-1',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop',
    owner: 'סטודיו הבית',
    hype: 91,
    price: 1780,
  },
  {
    id: 'fallback-2',
    mediaUrl: 'https://images.unsplash.com/photo-1516239325882-58f5dd6bb4ff?q=80&w=1400&auto=format&fit=crop',
    owner: 'ללא בעלים',
    hype: 65,
    price: 980,
  },
  {
    id: 'fallback-3',
    mediaUrl: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?q=80&w=1400&auto=format&fit=crop',
    owner: 'הילה',
    hype: 84,
    price: 1460,
  },
];

export default function TheFloor({ refreshKey }: TheFloorProps) {
  const [assets, setAssets] = useState<FloorAsset[]>(FALLBACK_ASSETS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  const currentAsset = useMemo(() => assets[currentIndex], [assets, currentIndex]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setToast(''), 1700);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false }).limit(40);

      if (cancelled) {
        return;
      }

      if (error) {
        setAssets(FALLBACK_ASSETS);
        setCurrentIndex(0);
        setToast('לא ניתן לטעון כרגע מהשרת, מוצגת תצוגת דמו.');
        setIsLoading(false);
        return;
      }

      const nextAssets: FloorAsset[] = (data ?? [])
        .map((row, index) => normalizeAsset(row, index))
        .filter((item): item is FloorAsset => item !== null);

      if (nextAssets.length === 0) {
        setAssets(FALLBACK_ASSETS);
      } else {
        setAssets(nextAssets);
      }
      setCurrentIndex(0);
      setIsLoading(false);
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const switchAsset = (delta: number) => {
    setCurrentIndex((prev) => {
      const next = prev + delta;
      if (next < 0 || next > assets.length - 1) {
        return prev;
      }
      return next;
    });
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -85) {
      switchAsset(1);
    } else if (info.offset.y > 85) {
      switchAsset(-1);
    }
  };

  const claimAsset = () => {
    setAssets((prev) =>
      prev.map((asset, index) =>
        index === currentIndex
          ? {
              ...asset,
              owner: 'את/ה',
              hype: Math.min(100, asset.hype + 7),
              price: asset.price + 140,
            }
          : asset,
      ),
    );
    setToast('תפיסה בוצעה בהצלחה.');
  };

  if (isLoading) {
    return <div className="grid h-full place-items-center text-sm text-white/75">טוען פיד...</div>;
  }

  if (!currentAsset) {
    return <div className="grid h-full place-items-center text-sm text-white/75">אין מדיה זמינה כרגע.</div>;
  }

  const isVideo = isVideoUrl(currentAsset.mediaUrl);

  return (
    <section className="relative h-full w-full overflow-hidden text-white">
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={currentAsset.id}
          initial={{ y: 40, opacity: 0.7, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0.5, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 250, damping: 26 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          {isVideo ? (
            <video src={currentAsset.mediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            <img src={currentAsset.mediaUrl} alt="מדיה" className="h-full w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#01030f] via-[#03061170] to-transparent" />

          <div className="absolute right-3 top-5 z-20 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-bold backdrop-blur-2xl">
            {currentIndex + 1} / {assets.length}
          </div>

          <div className="absolute inset-x-2 bottom-0 z-30 pb-20">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/35 px-3 py-2 backdrop-blur-2xl">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 overflow-hidden text-[11px] text-white/85">
                  <span className="truncate">
                    <span className="text-white/55">בעלים:</span> {currentAsset.owner}
                  </span>
                  <span className="shrink-0 flex items-center gap-1">
                    <Flame size={13} className="text-orange-300" />
                    <span>{currentAsset.hype}%</span>
                  </span>
                  <span className="shrink-0 flex items-center gap-1 text-emerald-300">
                    <DripCoinIcon className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold">{currentAsset.price.toLocaleString('he-IL')} DRIPCOIN</span>
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={claimAsset}
                className="rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 px-3 py-1.5 text-xs font-black text-black shadow-[0_0_18px_rgba(52,211,153,0.55)]"
              >
                תפוס
              </motion.button>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100 backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function normalizeAsset(row: Record<string, unknown>, index: number): FloorAsset | null {
  const rawMedia = row.media_url ?? row.mediaUrl ?? row.url ?? row.file_url ?? row.path;
  if (typeof rawMedia !== 'string' || rawMedia.trim().length === 0) {
    return null;
  }

  const mediaUrl = rawMedia.startsWith('http')
    ? rawMedia
    : supabase.storage.from('drip_media').getPublicUrl(rawMedia).data.publicUrl;

  const owner = typeof row.owner === 'string' && row.owner.trim().length > 0 ? row.owner : 'ללא בעלים';
  const hype = normalizeNumericValue(row.hype, 100);
  const price = normalizeNumericValue(row.price, 500);
  const id = row.id ? String(row.id) : `asset-${index}`;

  return { id, mediaUrl, owner, hype, price };
}

function normalizeNumericValue(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return fallback;
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
}
