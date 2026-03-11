import { AnimatePresence, motion } from 'framer-motion';
import {
  Backpack,
  Briefcase,
  ChevronsDown,
  CloudFog,
  FileText,
  Flame,
  Ghost,
  Hourglass,
  Loader2,
  Lock,
  Share2,
  ShieldAlert,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinBadge } from './DripCoinBadge';
import { POWERS_DICT } from './powers';

type LooseRecord = Record<string, any>;
type FeedMode = 'בשבילך' | 'חם' | 'חדש' | 'ויראלי';

type RankedAsset = {
  asset: LooseRecord;
  score: number;
  hype: number;
  viral: boolean;
  yieldPerSecond: number;
};

const FEED_MODES: FeedMode[] = ['בשבילך', 'חם', 'חדש', 'ויראלי'];

const calculateHype = (asset: LooseRecord) => {
  const start = new Date(asset.last_takeover_at || asset.created_at).getTime();
  const now = new Date().getTime();
  let mins = Math.floor((now - start) / (1000 * 60));
  if (asset.double_decay_until && new Date(asset.double_decay_until) > new Date()) mins *= 2;
  if (asset.time_warp_until && new Date(asset.time_warp_until) > new Date()) return Math.min(100, 50 + mins);
  return Math.max(5, 100 - mins);
};

const isVideo = (url: string) => ['mp4', 'mov', 'webm', 'quicktime'].includes(url.split('.').pop()?.toLowerCase() || '');

const calculateYieldPerSecond = (asset: LooseRecord, hype: number, viral: boolean) => {
  const base = ((asset.current_value ?? 0) * 0.0001) * (hype / 100);
  return viral ? base * 2 : base;
};

const buildRankedAssets = (
  sourceAssets: LooseRecord[],
  mode: FeedMode,
  affinity: { image: number; video: number; owners: Record<string, number> },
) => {
  const now = Date.now();
  const scored: RankedAsset[] = sourceAssets.map((asset) => {
    const hype = calculateHype(asset);
    const mediaType = isVideo(asset.media_url) ? 'video' : 'image';
    const mediaAffinity = (affinity[mediaType] + 1) / (affinity.image + affinity.video + 2);
    const ownerAffinity = Math.min((affinity.owners[asset.owner_id] ?? 0) / 8, 1);

    const minutesSinceCreated = Math.max(1, Math.floor((now - new Date(asset.created_at).getTime()) / 60000));
    const recencyBoost = Math.max(0, 1 - minutesSinceCreated / 240);
    const momentum = (asset.current_value ?? 0) / Math.max(asset.initial_value ?? 500, 1);
    const velocity = (asset.current_value ?? 0) / minutesSinceCreated;
    const liquidity = Math.log10((asset.current_value ?? 0) + 10);
    const underThreat = Boolean(
      (asset.smoked_until && new Date(asset.smoked_until) > new Date()) ||
        (asset.double_decay_until && new Date(asset.double_decay_until) > new Date()) ||
        asset.taxed_by,
    );
    const riskPenalty = underThreat ? 0.25 : 0;
    const viral = velocity > 55 && hype > 70;
    const score = momentum * 0.35 + hype * 0.25 + recencyBoost * 25 + liquidity * 6 + mediaAffinity * 14 + ownerAffinity * 9 + (viral ? 18 : 0) - riskPenalty * 20;
    return {
      asset,
      score,
      hype,
      viral,
      yieldPerSecond: calculateYieldPerSecond(asset, hype, viral),
    };
  });

  if (mode === 'חדש') {
    return scored.sort((a, b) => new Date(b.asset.created_at).getTime() - new Date(a.asset.created_at).getTime());
  }

  if (mode === 'ויראלי') {
    return scored.filter((item) => item.viral).sort((a, b) => b.score - a.score);
  }

  if (mode === 'חם') {
    return scored.sort((a, b) => b.score - a.score);
  }

  const base = [...scored].sort((a, b) => b.score - a.score);
  const discovery = scored
    .filter((item) => Date.now() - new Date(item.asset.created_at).getTime() < 5 * 60 * 1000)
    .sort((a, b) => b.score - a.score);

  const result: RankedAsset[] = [];
  const used = new Set<string>();
  let discoveryIndex = 0;

  base.forEach((item, index) => {
    if (!used.has(item.asset.id)) {
      result.push(item);
      used.add(item.asset.id);
    }
    const shouldInjectDiscovery = (index + 1) % 4 === 0;
    if (shouldInjectDiscovery && discovery[discoveryIndex] && !used.has(discovery[discoveryIndex].asset.id)) {
      result.push(discovery[discoveryIndex]);
      used.add(discovery[discoveryIndex].asset.id);
      discoveryIndex += 1;
    }
  });

  return result;
};

type AssetCardProps = {
  item: RankedAsset;
  currentUser: LooseRecord | null;
  inventory: LooseRecord[];
  setShowArsenal: (assetId: string) => void;
  handleShare: (asset: LooseRecord) => Promise<void>;
  handleTakeover: (asset: LooseRecord, activeValue: number, e: ReactMouseEvent<HTMLButtonElement> | null) => Promise<void>;
  actionId: string | null;
  onSignal: (asset: LooseRecord, weight: number) => void;
};

const AssetCard = ({ item, currentUser, inventory, setShowArsenal, handleShare, handleTakeover, actionId, onSignal }: AssetCardProps) => {
  const { asset, hype, viral, yieldPerSecond } = item;
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [initialDist, setInitialDist] = useState(0);

  const video = isVideo(asset.media_url);
  const isMine = currentUser?.id === asset.owner_id;
  const isCreatorPopular = asset.creator?.is_verified || (asset.creator?.drip_coins ?? 0) > 500000;
  const activeValue = isCreatorPopular ? Math.floor(asset.current_value * 1.15) : asset.current_value;

  const now = new Date();
  const isSmoked = asset.smoked_until && new Date(asset.smoked_until) > now;
  const isFrozen = asset.frozen_until && new Date(asset.frozen_until) > now;
  const isGhosted = asset.ghosted_until && new Date(asset.ghosted_until) > now && !isMine;
  const hasDoubleDecay = asset.double_decay_until && new Date(asset.double_decay_until) > now;
  const hasTimeWarp = asset.time_warp_until && new Date(asset.time_warp_until) > now;
  const isOwnerGodfather = asset.owner?.godfather_until && new Date(asset.owner.godfather_until) > now;
  const hasInsiderInfo = currentUser?.insider_until && new Date(currentUser.insider_until) > now;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onSignal(asset, 0.15);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.muted = false;
            videoRef.current.play().catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                void videoRef.current.play();
              }
            });
          }
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.6 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, [asset, onSignal]);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      setInitialDist(Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY));
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (initialDist > 0) {
        setScale((prev) => Math.max(1, Math.min(prev * (dist / initialDist), 4)));
      }
      setInitialDist(dist);
    }
  };

  const totalInventory = inventory.reduce((acc: number, inv) => acc + inv.quantity, 0);

  return (
    <div ref={cardRef} className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0 z-0 origin-center"
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setScale(1)}
      >
        {video ? (
          <video
            ref={videoRef}
            src={asset.media_url}
            className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[90%] blur-2xl' : ''}`}
            playsInline
            loop
          />
        ) : (
          <img src={asset.media_url} className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[90%] blur-2xl' : ''}`} alt={asset.title || 'נכס'} />
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/35" />
        {isSmoked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CloudFog size={100} className="text-white/25" />
          </div>
        )}

        <div className="pointer-events-auto absolute left-4 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-[#1C1C1E]/85 px-3 py-1.5 backdrop-blur-3xl">
          <Wallet size={14} className="text-[#0A84FF]" />
          <DripCoinBadge amount={(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')} />
        </div>

        <div className="absolute right-4 top-6 flex flex-col items-end gap-2">
          {viral && (
            <div className="flex items-center gap-1 rounded-full border border-[#FF453A]/35 bg-[#FF453A]/12 px-2.5 py-1 backdrop-blur-3xl">
              <Flame size={11} className="text-[#FF453A]" />
              <span className="text-[10px] font-bold text-white">ויראלי</span>
            </div>
          )}
          {isOwnerGodfather && (
            <div className="flex items-center gap-1 rounded-full border border-[#FF453A]/35 bg-[#FF453A]/12 px-2.5 py-1 backdrop-blur-3xl">
              <Briefcase size={10} className="text-[#FF453A]" />
              <span className="text-[10px] font-bold text-white">הסנדק פעיל</span>
            </div>
          )}
          {hasInsiderInfo && asset.taxed_by && (
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 backdrop-blur-3xl">
              <FileText size={10} className="text-[#0A84FF]" />
              <span className="text-[10px] font-bold text-white">מלכודת מס מזוהה</span>
            </div>
          )}
        </div>

        <div className="pointer-events-auto absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <button
            onClick={() => {
              onSignal(asset, 0.6);
              void handleShare(asset);
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#1C1C1E]/80 text-white/90 backdrop-blur-3xl"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSignal(asset, 0.9);
              setShowArsenal(asset.id);
            }}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#1C1C1E]/80 text-white/90 backdrop-blur-3xl"
          >
            <Backpack size={16} />
            {totalInventory > 0 && (
              <div className="absolute -right-1 -top-1 grid h-4.5 w-4.5 place-items-center rounded-full border border-black bg-[#0A84FF] text-[8px] font-bold text-white">
                {totalInventory}
              </div>
            )}
          </button>
        </div>

        <div className="pointer-events-auto absolute bottom-[90px] left-3 right-3">
          <div className="rounded-[1.9rem] border border-white/10 bg-[#1C1C1E]/80 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-3xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{asset.title || 'נכס ללא שם'}</p>
                <p className="truncate text-[11px] text-white/60">{isGhosted ? 'בעלות מוסתרת' : asset.owner?.username || 'משתמש'}</p>
              </div>
              <DripCoinBadge amount={activeValue.toLocaleString('he-IL')} />
            </div>

            <div className="mb-2 flex items-center gap-2 text-[11px] text-white/70">
              <Zap size={12} className="text-[#0A84FF]" />
              <span>תשואה משוערת לשנייה: {yieldPerSecond.toFixed(2)}</span>
              {hasDoubleDecay && <ChevronsDown size={12} className="text-[#FF453A]" />}
              {hasTimeWarp && <Hourglass size={12} className="text-white" />}
              {hype <= 20 && <span className="rounded-full border border-[#FF453A]/35 bg-[#FF453A]/10 px-2 py-0.5 text-[#FF453A]">לחץ זמן</span>}
            </div>

            <div className="mb-3 flex items-center gap-2">
              <span className={`text-xs font-bold ${hype <= 20 ? 'text-[#FF453A]' : 'text-white/80'}`}>{hype}% הייפ</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/45">
                <motion.div className={`${hype <= 20 ? 'bg-[#FF453A]' : 'bg-[#0A84FF]'} h-full`} animate={{ width: `${hype}%` }} />
              </div>
            </div>

            <div>
              {isMine ? (
                <div className="w-full rounded-2xl border border-white/15 bg-white/[0.03] py-2 text-center text-xs font-bold text-white/75">הנכס שלך</div>
              ) : isFrozen ? (
                <div className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#0A84FF]/35 bg-[#0A84FF]/12 py-2 text-xs font-bold text-white">
                  <Lock size={13} />
                  מוגן בחומת מגן
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    onSignal(asset, 1.6);
                    void handleTakeover(asset, activeValue, e);
                  }}
                  disabled={actionId === asset.id || (currentUser?.drip_coins ?? 0) < activeValue}
                  className={`w-full rounded-2xl border py-2 text-xs font-black transition ${
                    actionId === asset.id
                      ? 'border-[#0A84FF] bg-[#0A84FF] text-white'
                      : 'border-[#0A84FF]/40 bg-[#0A84FF]/14 text-white hover:bg-[#0A84FF]/22'
                  }`}
                >
                  {actionId === asset.id ? <Loader2 size={15} className="mx-auto animate-spin" /> : 'השתלטות מיידית'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TheFloorProps = {
  refreshKey?: number;
};

export default function TheFloor({ refreshKey = 0 }: TheFloorProps) {
  const [assets, setAssets] = useState<LooseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [mode, setMode] = useState<FeedMode>('בשבילך');
  const [currentUser, setCurrentUser] = useState<LooseRecord | null>(null);
  const [inventory, setInventory] = useState<LooseRecord[]>([]);
  const [showArsenal, setShowArsenal] = useState<string | null>(null);
  const [affinity, setAffinity] = useState<{ image: number; video: number; owners: Record<string, number> }>({
    image: 1,
    video: 1,
    owners: {},
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventDefaultZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefaultZoom, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaultZoom);
  }, []);

  useEffect(() => {
    void loadUser();
    void fetchAssets();
    const channel = supabase
      .channel('floor-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => void fetchAssets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_inventory' }, () => void fetchInventory())
      .subscribe();
    const hypeInterval = window.setInterval(() => setAssets((prev) => [...prev]), 60000);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(hypeInterval);
    };
  }, [refreshKey]);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
    setCurrentUser(data);
    await fetchInventory(user.id);
  };

  const fetchInventory = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data } = await supabase.from('drip_inventory').select('*').eq('user_id', userId).gt('quantity', 0);
    if (data) setInventory(data);
  };

  const fetchAssets = async () => {
    const query = supabase
      .from('drip_assets')
      .select(
        '*, owner:drip_users!owner_id(username, avatar_url, is_verified, drip_coins, godfather_until, whale_until), creator:drip_users!creator_id(username, is_verified, drip_coins)',
      );
    const { data } = await query;
    setAssets(data ?? []);
    setLoading(false);
  };

  const onSignal = (asset: LooseRecord, weight: number) => {
    const mediaType = isVideo(asset.media_url) ? 'video' : 'image';
    setAffinity((prev) => ({
      image: prev.image + (mediaType === 'image' ? weight : 0),
      video: prev.video + (mediaType === 'video' ? weight : 0),
      owners: {
        ...prev.owners,
        [asset.owner_id]: (prev.owners[asset.owner_id] ?? 0) + weight,
      },
    }));
  };

  const rankedAssets = useMemo(() => buildRankedAssets(assets, mode, affinity), [assets, mode, affinity]);

  const marketPulse = useMemo(() => {
    if (rankedAssets.length === 0) {
      return { marketCap: 0, avgHype: 0, viralCount: 0 };
    }
    const marketCap = rankedAssets.reduce((sum, item) => sum + (item.asset.current_value ?? 0), 0);
    const avgHype = rankedAssets.reduce((sum, item) => sum + item.hype, 0) / rankedAssets.length;
    const viralCount = rankedAssets.filter((item) => item.viral).length;
    return { marketCap, avgHype, viralCount };
  }, [rankedAssets]);

  const handleShare = async (asset: LooseRecord) => {
    try {
      if (!navigator.share) throw new Error('share-not-supported');
      await navigator.share({
        title: `${asset.title} - DRIP`,
        text: `בדקו את הנכס הזה בזירה`,
        url: window.location.href,
      });
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('הקישור הועתק');
      } catch {
        toast.success('הקישור מוכן לשיתוף');
      }
    }
  };

  const handleUsePower = async (powerId: number, asset: LooseRecord | null | undefined) => {
    setShowArsenal(null);
    if (!asset) return toast.error('הנכס לא נמצא');
    const invItem = inventory.find((item) => item.power_id === powerId);
    if (!invItem || invItem.quantity < 1) return toast.error('הכוח לא נמצא בארסנל');

    try {
      onSignal(asset, 1.1);
      setInventory((prev) => prev.map((item) => (item.id === invItem.id ? { ...item, quantity: item.quantity - 1 } : item)));
      const newQuantity = invItem.quantity - 1;
      if (newQuantity > 0) await supabase.from('drip_inventory').update({ quantity: newQuantity }).eq('id', invItem.id);
      else await supabase.from('drip_inventory').delete().eq('id', invItem.id);

      const now = new Date();
      const { data: targetAsset } = await supabase
        .from('drip_assets')
        .select('*, owner:owner_id(godfather_until)')
        .eq('id', asset.id)
        .single();

      if (!targetAsset) throw new Error('הנכס לא נמצא');

      const isGodfather = targetAsset?.owner?.godfather_until && new Date(targetAsset.owner.godfather_until) > now;
      const hasNeonShield = targetAsset?.neon_shield_until && new Date(targetAsset.neon_shield_until) > now;

      const checkImmunity = () => {
        if (isGodfather) {
          toast.error('הבעלים הוא הסנדק, התקפה נחסמה', { icon: '💼' });
          return true;
        }
        if (hasNeonShield) {
          void supabase.from('drip_assets').update({ neon_shield_until: null }).eq('id', asset.id);
          toast.success('מגן הניאון שבר את ההתקפה', { icon: '🛡️' });
          return true;
        }
        return false;
      };

      if (powerId === 7) {
        const cTime = new Date(targetAsset.last_takeover_at || targetAsset.created_at);
        await supabase
          .from('drip_assets')
          .update({ last_takeover_at: new Date(cTime.getTime() + 3 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('שוגר ראש הופעל, הייפ עולה', { icon: '🍬' });
      } else if (powerId === 8) {
        if (checkImmunity()) return fetchAssets();
        await supabase
          .from('drip_assets')
          .update({ smoked_until: new Date(now.getTime() + 30 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('מסך עשן הופעל', { icon: '🌫️' });
      } else if (powerId === 9) {
        if (checkImmunity()) return fetchAssets();
        const cTime = new Date(targetAsset.last_takeover_at || targetAsset.created_at);
        await supabase
          .from('drip_assets')
          .update({ last_takeover_at: new Date(cTime.getTime() - 6 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('שאיבת הייפ בוצעה', { icon: '🧲' });
      } else if (powerId === 4) {
        await supabase.from('drip_assets').update({ last_takeover_at: now.toISOString() }).eq('id', targetAsset.id);
        toast.success('הייפ במקסימום', { icon: '🔥' });
      } else if (powerId === 10) {
        await supabase
          .from('drip_assets')
          .update({ neon_shield_until: new Date(now.getTime() + 24 * 60 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('מגן ניאון הופעל', { icon: '🛡️' });
      } else if (powerId === 1) {
        await supabase
          .from('drip_assets')
          .update({ ghosted_until: new Date(now.getTime() + 24 * 60 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('רוח רפאים הופעלה', { icon: '👻' });
      } else if (powerId === 11) {
        if (checkImmunity()) return fetchAssets();
        await supabase
          .from('drip_assets')
          .update({ double_decay_until: new Date(now.getTime() + 60 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('הכפלת סיכון הופעלה', { icon: '⏬' });
      } else if (powerId === 2) {
        await supabase
          .from('drip_assets')
          .update({ frozen_until: new Date(now.getTime() + 60 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('חומת מגן הופעלה', { icon: '🔒' });
      } else if (powerId === 12) {
        if (!currentUser) throw new Error('נדרש משתמש פעיל');
        if (checkImmunity()) return fetchAssets();
        await supabase.from('drip_assets').update({ taxed_by: currentUser.id }).eq('id', targetAsset.id);
        toast.success('מלכודת מס קריפטו הוטמנה', { icon: '💸' });
      } else if (powerId === 13) {
        if (!currentUser) throw new Error('נדרש משתמש פעיל');
        const { data: cheapest } = await supabase
          .from('drip_assets')
          .select('*')
          .neq('owner_id', currentUser.id)
          .order('current_value', { ascending: true })
          .limit(1)
          .single();
        if (cheapest) {
          toast.success('ניקוי זירה מופעל, משתלט על הנכס הזול ביותר', { icon: '🧹' });
          void handleTakeover(cheapest, cheapest.current_value, null);
          return;
        }
      } else if (powerId === 5) {
        if (checkImmunity()) return fetchAssets();
        await supabase
          .from('drip_assets')
          .update({ current_value: Math.floor(targetAsset.current_value * 0.85) })
          .eq('id', targetAsset.id);
        toast.success('הרעלה הופעלה, ערך הנכס ירד', { icon: '🧪' });
      } else if (powerId === 14) {
        if (!currentUser) throw new Error('נדרש משתמש פעיל');
        await supabase
          .from('drip_users')
          .update({ insider_until: new Date(now.getTime() + 60 * 60000).toISOString() })
          .eq('id', currentUser.id);
        toast.success('מידע פנים הופעל לשעה', { icon: '👁️' });
      } else if (powerId === 15) {
        await supabase
          .from('drip_assets')
          .update({ time_warp_until: new Date(now.getTime() + 60 * 60000).toISOString() })
          .eq('id', targetAsset.id);
        toast.success('עיוות זמן הופעל', { icon: '⏳' });
      } else if (powerId === 3) {
        if (!currentUser) throw new Error('נדרש משתמש פעיל');
        await supabase
          .from('drip_users')
          .update({ whale_until: new Date(now.getTime() + 24 * 60 * 60000).toISOString() })
          .eq('id', currentUser.id);
        toast.success('סטטוס לוויתן הופעל', { icon: '✨' });
      } else if (powerId === 6) {
        toast.success('פצצת EMP הופעלה', { icon: '📻' });
        await Promise.all(
          assets.map(async (item) => {
            if (item.id === targetAsset.id) return;
            const tTime = new Date(item.last_takeover_at || item.created_at);
            await supabase
              .from('drip_assets')
              .update({ last_takeover_at: new Date(tTime.getTime() - 12 * 60000).toISOString() })
              .eq('id', item.id);
          }),
        );
      } else if (powerId === 16) {
        if (!currentUser) throw new Error('נדרש משתמש פעיל');
        await supabase
          .from('drip_users')
          .update({ godfather_until: new Date(now.getTime() + 24 * 60 * 60000).toISOString() })
          .eq('id', currentUser.id);
        toast.success('הסנדק הופעל, חסינות מלאה', { icon: '💼' });
      }
      await fetchAssets();
    } catch (err: any) {
      toast.error(err?.message || 'שגיאה בהפעלת הכוח');
      await fetchInventory();
    }
  };

  const handleTakeover = async (asset: LooseRecord, activeValue: number, e: ReactMouseEvent<HTMLButtonElement> | null) => {
    if (e) e.stopPropagation();
    if (actionId) return;
    if (asset.frozen_until && new Date(asset.frozen_until) > new Date()) return toast.error('הנכס מוגן בחומת מגן');

    setActionId(asset.id);
    try {
      if (!currentUser) throw new Error('נדרשת התחברות');

      const { data: freshAsset } = await supabase
        .from('drip_assets')
        .select('*, owner:owner_id(godfather_until)')
        .eq('id', asset.id)
        .single();
      if (!freshAsset) throw new Error('הנכס לא נמצא');
      if (currentUser.id === freshAsset.owner_id) throw new Error('הנכס כבר בבעלותך');
      if (freshAsset.owner?.godfather_until && new Date(freshAsset.owner.godfather_until) > new Date()) {
        throw new Error('הבעלים הוא הסנדק, אי אפשר להשתלט');
      }

      const { data: buyer } = await supabase.from('drip_users').select('drip_coins').eq('id', currentUser.id).single();
      if (!buyer || buyer.drip_coins < activeValue) throw new Error('אין מספיק DRIPCOIN');

      const nextPrice = Math.floor(activeValue * 1.2);
      const royalties = Math.floor(activeValue * 0.05);
      let ownerCut = activeValue - royalties;

      if (freshAsset.taxed_by && freshAsset.taxed_by !== currentUser.id) {
        const tax = Math.floor(activeValue * 0.1);
        ownerCut -= tax;
        const { data: taxer } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.taxed_by).single();
        if (taxer) await supabase.from('drip_users').update({ drip_coins: taxer.drip_coins + tax }).eq('id', freshAsset.taxed_by);
        toast.success('שולמה עמלת מס קריפטו', { icon: '💸' });
      }

      setCurrentUser((prev) => (prev ? { ...prev, drip_coins: prev.drip_coins - activeValue } : prev));

      if (freshAsset.owner_id) {
        const { data: oldOwner } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.owner_id).single();
        if (oldOwner) await supabase.from('drip_users').update({ drip_coins: oldOwner.drip_coins + ownerCut }).eq('id', freshAsset.owner_id);
      }
      if (freshAsset.creator_id && freshAsset.creator_id !== freshAsset.owner_id) {
        const { data: creator } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.creator_id).single();
        if (creator) await supabase.from('drip_users').update({ drip_coins: creator.drip_coins + royalties }).eq('id', freshAsset.creator_id);
      }

      await supabase.from('drip_users').update({ drip_coins: buyer.drip_coins - activeValue }).eq('id', currentUser.id);
      await supabase
        .from('drip_assets')
        .update({
          owner_id: currentUser.id,
          current_value: nextPrice,
          last_takeover_at: new Date().toISOString(),
          frozen_until: null,
          smoked_until: null,
          taxed_by: null,
          neon_shield_until: null,
          ghosted_until: null,
          double_decay_until: null,
          time_warp_until: null,
        })
        .eq('id', asset.id);

      toast.success('השתלטות הצליחה, הנכס שלך', { icon: '⚡' });
      onSignal(asset, 2.2);
      await fetchAssets();
    } catch (err: any) {
      toast.error(err?.message || 'שגיאה בהשתלטות');
      await fetchAssets();
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center">
        <Loader2 className="animate-spin text-[#0A84FF]" />
      </div>
    );
  }

  const selectedAsset = showArsenal ? rankedAssets.find((item) => item.asset.id === showArsenal)?.asset : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <div className="glass-panel pointer-events-auto flex w-full max-w-xl items-center justify-between rounded-2xl px-3 py-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/55">מנוע מסחר חי</p>
            <p className="text-xs font-bold text-white">אלגוריתם דינמי בסגנון פיד מהיר</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-white/75">
              הייפ ממוצע {marketPulse.avgHype.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[5.4rem] z-40 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#1C1C1E]/80 p-1.5 backdrop-blur-3xl">
          {FEED_MODES.map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${mode === item ? 'bg-[#0A84FF]/20 text-white' : 'text-white/55'}`}
            >
              {item}
            </button>
          ))}
          <div className="mr-auto flex items-center gap-2 text-[11px] text-white/65">
            <span>שווי שוק {marketPulse.marketCap.toLocaleString('he-IL')}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span className="text-[#FF453A]">{marketPulse.viralCount} ויראליים</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="hide-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll pt-[7.8rem]">
        {rankedAssets.map((item) => (
          <AssetCard
            key={item.asset.id}
            item={item}
            currentUser={currentUser}
            inventory={inventory}
            setShowArsenal={setShowArsenal}
            handleShare={handleShare}
            handleTakeover={handleTakeover}
            actionId={actionId}
            onSignal={onSignal}
          />
        ))}
      </div>

      <AnimatePresence>
        {showArsenal && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 210 }}
            className="fixed bottom-[118px] left-4 right-4 z-50 flex h-44 flex-col overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#1C1C1E]/88 shadow-[0_24px_60px_rgba(0,0,0,0.78)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3">
              <span className="text-xs font-black text-white">ארסנל פעיל</span>
              <button onClick={() => setShowArsenal(null)} className="rounded-full border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold text-white/70">
                סגירה
              </button>
            </div>
            <div className="hide-scrollbar flex flex-1 items-center gap-2.5 overflow-x-auto px-4">
              {inventory.length === 0 ? (
                <div className="w-full text-center text-xs text-white/45">הארסנל ריק</div>
              ) : (
                inventory.map((item, index) => {
                  const power = POWERS_DICT[item.power_id];
                  if (!power) return null;
                  const Icon = power.icon as LucideIcon;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => void handleUsePower(item.power_id, selectedAsset)}
                      className="h-24 w-24 shrink-0 rounded-2xl border border-white/10 bg-[#111112] p-2"
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-1">
                        <Icon size={19} className={power.color} />
                        <p className="text-[10px] font-bold text-white">{power.name}</p>
                        <p className="text-[10px] text-white/60">x{item.quantity}</p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
