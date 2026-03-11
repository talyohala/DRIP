import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Activity, Flame, Loader2, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { DripCoin } from './ui/DripCoin';

type FeedMode = 'ai' | 'recent' | 'value';

interface DripUserRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  drip_coins: number | null;
}

interface DripAssetRow {
  id: string;
  title: string;
  media_url: string;
  owner_id: string | null;
  creator_id: string | null;
  current_value: number;
  created_at: string;
  last_takeover_at: string | null;
  owner?: DripUserRow | null;
  creator?: DripUserRow | null;
}

interface ComputedAsset extends DripAssetRow {
  hype: number;
  yieldPerSecond: number;
  takeoverCount10m: number;
  isViral: boolean;
  isNew: boolean;
  score: number;
  nextPrice: number;
}

const TAKEOVER_MULTIPLIER = 1.2;
const TAKEOVER_VIRAL_THRESHOLD = 3;
const TAKEOVER_WINDOW_MS = 10 * 60 * 1000;
const DISCOVERY_WINDOW_MS = 5 * 60 * 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isVideoAsset = (url: string) => {
  const clean = url.split('?')[0]?.toLowerCase() ?? '';
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.m4v');
};

const getHype = (fromIso: string, nowMs: number) => {
  const base = new Date(fromIso).getTime();
  if (Number.isNaN(base)) return 100;
  const minutesPassed = Math.floor((nowMs - base) / 60000);
  return clamp(100 - minutesPassed, 0, 100);
};

const getYieldPerSecond = (value: number, hype: number, isViral: boolean) => {
  const baseYield = value * 0.0001 * (hype / 100);
  return isViral ? baseYield * 2 : baseYield;
};

const formatNumber = (value: number) => Math.floor(value).toLocaleString('he-IL');
const formatYield = (value: number) => value.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const getTimeAgoLabel = (iso: string, nowMs: number) => {
  const createdMs = new Date(iso).getTime();
  if (Number.isNaN(createdMs)) return 'עכשיו';
  const diffMinutes = Math.max(0, Math.floor((nowMs - createdMs) / 60000));
  if (diffMinutes <= 0) return 'עכשיו';
  if (diffMinutes < 60) return `לפני ${diffMinutes} דק׳`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
};

const buildDiscoveryFeed = (rankedAssets: ComputedAsset[]) => {
  const discoveryPool = rankedAssets.filter((asset) => asset.isNew);
  const establishedPool = rankedAssets.filter((asset) => !asset.isNew);
  const targetDiscoveryCount = Math.min(discoveryPool.length, Math.floor(rankedAssets.length * 0.2));

  if (targetDiscoveryCount === 0) return rankedAssets;

  const selectedDiscovery = discoveryPool.slice(0, targetDiscoveryCount);
  const remainingDiscovery = discoveryPool.slice(targetDiscoveryCount);
  const mixed = [...establishedPool];

  selectedDiscovery.forEach((asset, index) => {
    const insertionIndex = Math.min(mixed.length, index * 5 + 1);
    mixed.splice(insertionIndex, 0, asset);
  });

  return [...mixed, ...remainingDiscovery];
};

interface FloorCardProps {
  asset: ComputedAsset;
  index: number;
  total: number;
  nowMs: number;
  isMine: boolean;
  canAfford: boolean;
  isBusy: boolean;
  onTakeover: (asset: ComputedAsset) => void;
}

function FloorCard({ asset, index, total, nowMs, isMine, canAfford, isBusy, onTakeover }: FloorCardProps) {
  const mediaIsVideo = isVideoAsset(asset.media_url);
  const ownerName = asset.owner?.username ?? 'בעלים לא זמין';
  const ownerAvatar = asset.owner?.avatar_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ownerName)}`;
  const takeoverDisabled = isMine || !canAfford || isBusy;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 36, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 130, damping: 24, mass: 0.8 }}
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden"
    >
      <div className="absolute inset-0">
        {mediaIsVideo ? (
          <video
            src={asset.media_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={asset.media_url} alt={asset.title} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#02040a]/90 via-[#02040a]/45 to-[#02040a]/25" />

      <div className="absolute left-4 right-4 top-28 flex items-start justify-between">
        <div className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">#{index + 1} / {total}</p>
          <p className="mt-1 text-xs font-semibold text-white/85">{getTimeAgoLabel(asset.created_at, nowMs)}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {asset.isNew && (
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-white/90">
              חדש
            </span>
          )}
          {asset.isViral && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-amber-100/20 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-amber-100">
              <Flame size={12} />
              VIRAL x2
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-4 right-4">
        <div className="rounded-[30px] border border-white/15 bg-black/30 p-4 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-white">{asset.title}</p>
              <button
                onClick={() => {
                  if (asset.owner_id) window.location.hash = `user_${asset.owner_id}`;
                }}
                className="mt-1 flex items-center gap-2 text-xs text-white/75 transition-colors hover:text-white"
              >
                <img src={ownerAvatar} alt={ownerName} className="h-6 w-6 rounded-full border border-white/20 object-cover" />
                <span className="truncate">{ownerName}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">שווי נוכחי</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-white">
                {formatNumber(asset.current_value)}
                <DripCoin className="h-4 w-4" />
              </p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">HYPE</p>
              <p className="mt-1 text-sm font-bold text-white">{asset.hype}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">Yield/sec</p>
              <p className="mt-1 text-sm font-bold text-white">{formatYield(asset.yieldPerSecond)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">10m</p>
              <p className="mt-1 text-sm font-bold text-white">{asset.takeoverCount10m} השתלטויות</p>
            </div>
          </div>

          {isMine ? (
            <div className="rounded-2xl border border-white/20 bg-white/10 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white">
              בבעלותך
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onTakeover(asset)}
              disabled={takeoverDisabled}
              className={`w-full rounded-2xl border py-3.5 px-4 text-left transition-all ${
                takeoverDisabled
                  ? 'border-white/15 bg-white/10 text-white/45'
                  : 'border-white/70 bg-white text-[#04070d] shadow-[0_14px_40px_rgba(15,23,42,0.35)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.25em]">השתלטות</span>
                {isBusy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5 text-[15px] font-black">
                    {formatNumber(asset.current_value)}
                    <DripCoin className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-semibold">
                {canAfford ? (
                  <>
                    ×1.2: {formatNumber(asset.nextPrice)}
                    <DripCoin className="h-3.5 w-3.5" />
                  </>
                ) : (
                  'יתרה לא מספיקה'
                )}
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function TheFloor() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<DripAssetRow[]>([]);
  const [takeoversByAsset, setTakeoversByAsset] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<DripUserRow | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('ai');
  const [activeIndex, setActiveIndex] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!authData.user) {
      setCurrentUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from('drip_users')
      .select('id, username, avatar_url, is_verified, drip_coins')
      .eq('id', authData.user.id)
      .single();

    if (error) throw error;
    const userRow = (data as DripUserRow | null) ?? null;
    setCurrentUser(userRow);
    return userRow;
  }, []);

  const fetchAssets = useCallback(async () => {
    const { data, error } = await supabase
      .from('drip_assets')
      .select(`
        id,
        title,
        media_url,
        owner_id,
        creator_id,
        current_value,
        created_at,
        last_takeover_at,
        owner:drip_users!owner_id(id, username, avatar_url, is_verified, drip_coins),
        creator:drip_users!creator_id(id, username, avatar_url, is_verified, drip_coins)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAssets((data as DripAssetRow[]) ?? []);
  }, []);

  const fetchTakeoverWindow = useCallback(async () => {
    const sinceIso = new Date(Date.now() - TAKEOVER_WINDOW_MS).toISOString();
    const { data, error } = await supabase
      .from('drip_notifications')
      .select('asset_id, created_at, type')
      .eq('type', 'takeover')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(600);

    if (error) {
      setTakeoversByAsset({});
      return;
    }

    const grouped = ((data ?? []) as Array<{ asset_id: string | null }>).reduce<Record<string, number>>((acc, row) => {
      if (!row.asset_id) return acc;
      acc[row.asset_id] = (acc[row.asset_id] ?? 0) + 1;
      return acc;
    }, {});

    setTakeoversByAsset(grouped);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([loadCurrentUser(), fetchAssets(), fetchTakeoverWindow()]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'טעינת הפיד נכשלה';
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();

    const channel = supabase
      .channel('floor-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => {
        void fetchAssets();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drip_notifications' }, (payload) => {
        const row = payload.new as { type?: string };
        if (row?.type === 'takeover') {
          void fetchTakeoverWindow();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drip_users' }, (payload) => {
        const row = payload.new as { id?: string };
        if (row?.id && row.id === currentUserIdRef.current) {
          void loadCurrentUser();
        }
      })
      .subscribe();

    const takeoverPoll = window.setInterval(() => {
      void fetchTakeoverWindow();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(takeoverPoll);
      supabase.removeChannel(channel);
    };
  }, [fetchAssets, fetchTakeoverWindow, loadCurrentUser]);

  const computedAssets = useMemo<ComputedAsset[]>(() => {
    return assets.map((asset) => {
      const sourceTime = asset.last_takeover_at ?? asset.created_at;
      const createdMs = new Date(asset.created_at).getTime();
      const ageMs = Number.isNaN(createdMs) ? 0 : Math.max(0, nowMs - createdMs);
      const ageMinutes = Math.floor(ageMs / 60000);
      const hype = getHype(sourceTime, nowMs);
      const takeoverCount10m = takeoversByAsset[asset.id] ?? 0;
      const isViral = takeoverCount10m >= TAKEOVER_VIRAL_THRESHOLD;
      const isNew = ageMs <= DISCOVERY_WINDOW_MS;
      const yieldPerSecond = getYieldPerSecond(asset.current_value, hype, isViral);

      const valueSignal = Math.log10(Math.max(1, asset.current_value)) * 16;
      const hypeSignal = hype * 0.48;
      const momentumSignal = Math.min(40, takeoverCount10m * 11);
      const freshnessSignal = isNew ? 18 : Math.max(0, 8 - ageMinutes * 0.12);
      const viralSignal = isViral ? 35 : 0;
      const score = valueSignal + hypeSignal + momentumSignal + freshnessSignal + viralSignal;

      return {
        ...asset,
        hype,
        takeoverCount10m,
        isViral,
        isNew,
        yieldPerSecond,
        score,
        nextPrice: Math.floor(asset.current_value * TAKEOVER_MULTIPLIER),
      };
    });
  }, [assets, nowMs, takeoversByAsset]);

  const orderedAssets = useMemo(() => {
    if (feedMode === 'recent') {
      return [...computedAssets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (feedMode === 'value') {
      return [...computedAssets].sort((a, b) => b.current_value - a.current_value);
    }

    const ranked = [...computedAssets].sort((a, b) => b.score - a.score);
    return buildDiscoveryFeed(ranked);
  }, [computedAssets, feedMode]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (orderedAssets.length === 0) return 0;
      return Math.min(prev, orderedAssets.length - 1);
    });
  }, [orderedAssets.length]);

  const onFeedScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || orderedAssets.length === 0) return;
    const nextIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1));
    const safeIndex = clamp(nextIndex, 0, orderedAssets.length - 1);
    setActiveIndex((prev) => (prev === safeIndex ? prev : safeIndex));
  }, [orderedAssets.length]);

  const ownedYieldPerSecond = useMemo(() => {
    if (!currentUser) return 0;
    return computedAssets
      .filter((asset) => asset.owner_id === currentUser.id)
      .reduce((sum, asset) => sum + asset.yieldPerSecond, 0);
  }, [computedAssets, currentUser]);

  const activeAsset = orderedAssets[activeIndex] ?? null;

  const handleTakeover = useCallback(
    async (asset: ComputedAsset) => {
      if (!currentUser) {
        toast.error('נדרש להתחבר מחדש כדי לבצע השתלטות');
        return;
      }
      if (actionId) return;

      setActionId(asset.id);

      try {
        const { data: freshAssetData, error: assetError } = await supabase
          .from('drip_assets')
          .select('id, owner_id, creator_id, current_value')
          .eq('id', asset.id)
          .single();

        if (assetError) throw assetError;

        const freshAsset = freshAssetData as { id: string; owner_id: string | null; creator_id: string | null; current_value: number } | null;
        if (!freshAsset) throw new Error('הנכס לא נמצא');
        if (freshAsset.owner_id === currentUser.id) throw new Error('הנכס כבר בבעלותך');

        const takeoverPrice = Math.floor(freshAsset.current_value);
        const nextPrice = Math.floor(takeoverPrice * TAKEOVER_MULTIPLIER);

        const { data: buyerData, error: buyerError } = await supabase
          .from('drip_users')
          .select('drip_coins')
          .eq('id', currentUser.id)
          .single();

        if (buyerError) throw buyerError;
        const buyerBalance = Number((buyerData as { drip_coins: number | null } | null)?.drip_coins ?? 0);
        if (buyerBalance < takeoverPrice) throw new Error('אין מספיק יתרה בארנק');

        const creditUser = async (userId: string, amount: number) => {
          if (amount <= 0) return;
          const { data: creditTargetData, error: creditReadError } = await supabase
            .from('drip_users')
            .select('drip_coins')
            .eq('id', userId)
            .single();

          if (creditReadError) throw creditReadError;

          const currentCoins = Number((creditTargetData as { drip_coins: number | null } | null)?.drip_coins ?? 0);
          const { error: creditWriteError } = await supabase
            .from('drip_users')
            .update({ drip_coins: currentCoins + amount })
            .eq('id', userId);

          if (creditWriteError) throw creditWriteError;
        };

        const royaltyCut = Math.floor(takeoverPrice * 0.05);
        const ownerCut = takeoverPrice - royaltyCut;

        if (freshAsset.owner_id) {
          await creditUser(freshAsset.owner_id, ownerCut);
        }

        if (freshAsset.creator_id && freshAsset.creator_id !== freshAsset.owner_id) {
          await creditUser(freshAsset.creator_id, royaltyCut);
        }

        const { error: debitError } = await supabase
          .from('drip_users')
          .update({ drip_coins: buyerBalance - takeoverPrice })
          .eq('id', currentUser.id);

        if (debitError) throw debitError;

        const { error: takeoverError } = await supabase
          .from('drip_assets')
          .update({
            owner_id: currentUser.id,
            current_value: nextPrice,
            last_takeover_at: new Date().toISOString(),
          })
          .eq('id', freshAsset.id);

        if (takeoverError) throw takeoverError;

        setCurrentUser((prev) => (prev ? { ...prev, drip_coins: buyerBalance - takeoverPrice } : prev));
        toast.success('ההשתלטות הושלמה בהצלחה');
        await Promise.all([fetchAssets(), fetchTakeoverWindow(), loadCurrentUser()]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'הפעולה נכשלה';
        toast.error(message);
      } finally {
        setActionId(null);
      }
    },
    [actionId, currentUser, fetchAssets, fetchTakeoverWindow, loadCurrentUser],
  );

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#04070d]">
        <Loader2 size={34} className="animate-spin text-white/75" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#04070d] text-white" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-[90vw] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-1/2 h-80 w-[90vw] -translate-x-1/2 rounded-full bg-slate-300/10 blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        className="pointer-events-none fixed left-1/2 top-5 z-40 w-[min(94vw,860px)] -translate-x-1/2"
      >
        <div className="pointer-events-auto rounded-[28px] border border-white/20 bg-black/30 p-2.5 backdrop-blur-3xl shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <Activity size={14} className="text-white/80" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Live Floor</span>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              {[
                { key: 'ai' as const, label: 'אלגוריתם', icon: Sparkles },
                { key: 'recent' as const, label: 'חדש', icon: Activity },
                { key: 'value' as const, label: 'שווי', icon: TrendingUp },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setFeedMode(mode.key)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] transition-all ${
                    feedMode === mode.key ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <mode.icon size={12} />
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <Wallet size={14} className="text-white/80" />
              <div className="text-right leading-tight">
                <p className="text-[10px] text-white/50">ארנק</p>
                <p className="flex items-center gap-1 text-xs font-black">
                  {formatNumber(currentUser?.drip_coins ?? 0)}
                  <DripCoin className="h-3.5 w-3.5" />
                </p>
              </div>
              <div className="h-5 w-px bg-white/20" />
              <div className="text-right leading-tight">
                <p className="text-[10px] text-white/50">Yield/דקה</p>
                <p className="flex items-center gap-1 text-xs font-black">
                  {formatYield(ownedYieldPerSecond * 60)}
                  <DripCoin className="h-3.5 w-3.5" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {orderedAssets.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="rounded-[28px] border border-white/15 bg-black/30 px-8 py-10 text-center backdrop-blur-3xl">
            <p className="text-sm font-semibold text-white/80">אין כרגע נכסים להצגה בפיד</p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} onScroll={onFeedScroll} className="h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar">
          <AnimatePresence initial={false}>
            {orderedAssets.map((asset, index) => {
              const balance = currentUser?.drip_coins ?? 0;
              return (
                <FloorCard
                  key={asset.id}
                  asset={asset}
                  index={index}
                  total={orderedAssets.length}
                  nowMs={nowMs}
                  isMine={asset.owner_id === currentUser?.id}
                  canAfford={balance >= asset.current_value}
                  isBusy={actionId === asset.id}
                  onTakeover={handleTakeover}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {activeAsset && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 23 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-40 w-[min(92vw,560px)] -translate-x-1/2"
        >
          <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-3xl">
            <p className="truncate text-xs font-semibold text-white/85">{activeAsset.title}</p>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-white/70">HYPE {activeAsset.hype}%</span>
              <span className="text-[11px] font-semibold text-white/70">Yield {formatYield(activeAsset.yieldPerSecond)}/s</span>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
