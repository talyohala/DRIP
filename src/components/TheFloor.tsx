import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowDown, ArrowUp, Flame, Loader2, TrendingUp, UserRound, Wallet, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabase';
import { DripCoin } from './ui/DripCoin';

interface DripUserRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
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
}

interface FloorAsset extends DripAssetRow {
  hype: number;
  yieldPerSecond: number;
  nextPrice: number;
  score: number;
}

const TAKEOVER_MULTIPLIER = 1.2;
const SWIPE_THRESHOLD = 130;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isVideoAsset = (url: string) => {
  const clean = url.split('?')[0]?.toLowerCase() ?? '';
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.m4v');
};

const getDisplayName = (user?: DripUserRow | null) => user?.username?.trim() || 'Anonymous Whale';

const getAvatarUrl = (user?: DripUserRow | null) => {
  const name = getDisplayName(user);
  return user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
};

const getHype = (fromIso: string, nowMs: number) => {
  const source = new Date(fromIso).getTime();
  if (Number.isNaN(source)) return 100;
  const minutes = Math.max(0, (nowMs - source) / 60000);
  return clamp(Math.round(100 - minutes * 1.3), 0, 100);
};

const getYieldPerSecond = (value: number, hype: number) => value * 0.0001 * (hype / 100);

const formatCompact = (value: number) => Math.floor(value).toLocaleString('en-US');

const slideVariants = {
  enter: (direction: number) => ({
    y: direction >= 0 ? '100%' : '-100%',
    opacity: 0.45,
    scale: 0.98,
  }),
  center: {
    y: '0%',
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    y: direction >= 0 ? '-30%' : '30%',
    opacity: 0.12,
    scale: 0.98,
  }),
};

export default function TheFloor() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<DripAssetRow[]>([]);
  const [currentUser, setCurrentUser] = useState<DripUserRow | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [actionAssetId, setActionAssetId] = useState<string | null>(null);
  const [shockwaveKey, setShockwaveKey] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const currentUserIdRef = useRef<string | null>(null);
  const swipeCooldownRef = useRef(0);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!shockwaveKey) return;
    const timer = window.setTimeout(() => setShockwaveKey(null), 950);
    return () => window.clearTimeout(timer);
  }, [shockwaveKey]);

  const loadCurrentUser = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!authData.user) {
      setCurrentUser(null);
      return;
    }

    const { data, error } = await supabase
      .from('drip_users')
      .select('id, username, avatar_url, drip_coins')
      .eq('id', authData.user.id)
      .single();

    if (error) throw error;
    setCurrentUser((data as DripUserRow | null) ?? null);
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
        owner:drip_users!owner_id(id, username, avatar_url, drip_coins)
      `)
      .order('created_at', { ascending: false })
      .limit(180);

    if (error) throw error;
    setAssets((data as DripAssetRow[]) ?? []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      setLoading(true);
      try {
        await Promise.all([loadCurrentUser(), fetchAssets()]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load floor feed';
        toast.error(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    boot();

    const channel = supabase
      .channel('floor-realtime-2026')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => {
        void fetchAssets();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drip_users' }, (payload) => {
        const row = payload.new as { id?: string };
        if (row.id && row.id === currentUserIdRef.current) {
          void loadCurrentUser();
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAssets, loadCurrentUser]);

  const rankedAssets = useMemo<FloorAsset[]>(() => {
    const enriched = assets.map((asset) => {
      const source = asset.last_takeover_at ?? asset.created_at;
      const hype = getHype(source, nowMs);
      const yieldPerSecond = getYieldPerSecond(asset.current_value, hype);
      const freshnessSignal = Math.max(0, 60 - (nowMs - new Date(asset.created_at).getTime()) / 60000);
      const score = Math.log10(Math.max(asset.current_value, 1)) * 15 + hype * 0.7 + freshnessSignal;

      return {
        ...asset,
        hype,
        yieldPerSecond,
        nextPrice: Math.floor(asset.current_value * TAKEOVER_MULTIPLIER),
        score,
      };
    });

    return enriched.sort((a, b) => b.score - a.score);
  }, [assets, nowMs]);

  useEffect(() => {
    setActiveIndex((prev) => clamp(prev, 0, Math.max(0, rankedAssets.length - 1)));
  }, [rankedAssets.length]);

  const activeAsset = rankedAssets[activeIndex] ?? null;
  const isMine = Boolean(activeAsset && currentUser && activeAsset.owner_id === currentUser.id);
  const canAfford = Boolean(activeAsset && (currentUser?.drip_coins ?? 0) >= activeAsset.current_value);
  const isBusy = Boolean(activeAsset && actionAssetId === activeAsset.id);
  const ownedYieldPerSecond = useMemo(() => {
    if (!currentUser) return 0;
    return rankedAssets.filter((asset) => asset.owner_id === currentUser.id).reduce((sum, asset) => sum + asset.yieldPerSecond, 0);
  }, [currentUser, rankedAssets]);

  const paginate = useCallback(
    (nextDirection: number) => {
      if (!rankedAssets.length) return;
      if (Date.now() < swipeCooldownRef.current) return;

      const nextIndex = clamp(activeIndex + nextDirection, 0, rankedAssets.length - 1);
      if (nextIndex === activeIndex) return;

      swipeCooldownRef.current = Date.now() + 280;
      setDirection(nextDirection);
      setActiveIndex(nextIndex);
    },
    [activeIndex, rankedAssets.length],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 24) return;
      paginate(event.deltaY > 0 ? 1 : -1);
    },
    [paginate],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') paginate(1);
      if (event.key === 'ArrowUp') paginate(-1);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paginate]);

  const creditCoins = useCallback(async (userId: string, amount: number) => {
    if (amount <= 0) return;
    const { data, error } = await supabase.from('drip_users').select('drip_coins').eq('id', userId).single();
    if (error) throw error;

    const current = Number((data as { drip_coins: number | null } | null)?.drip_coins ?? 0);
    const { error: updateError } = await supabase
      .from('drip_users')
      .update({ drip_coins: current + amount })
      .eq('id', userId);
    if (updateError) throw updateError;
  }, []);

  const handleTakeover = useCallback(async () => {
    if (!activeAsset) return;
    if (!currentUser) {
      toast.error('Reconnect to execute a takeover');
      return;
    }
    if (actionAssetId) return;

    setActionAssetId(activeAsset.id);

    try {
      const { data: freshAssetData, error: freshAssetError } = await supabase
        .from('drip_assets')
        .select('id, owner_id, creator_id, current_value')
        .eq('id', activeAsset.id)
        .single();
      if (freshAssetError) throw freshAssetError;

      const freshAsset = freshAssetData as
        | { id: string; owner_id: string | null; creator_id: string | null; current_value: number }
        | null;
      if (!freshAsset) throw new Error('Asset was not found');
      if (freshAsset.owner_id === currentUser.id) throw new Error('You already control this asset');

      const takeoverPrice = Math.floor(freshAsset.current_value);
      const nextPrice = Math.floor(takeoverPrice * TAKEOVER_MULTIPLIER);

      const { data: buyerData, error: buyerError } = await supabase
        .from('drip_users')
        .select('drip_coins')
        .eq('id', currentUser.id)
        .single();
      if (buyerError) throw buyerError;

      const buyerBalance = Number((buyerData as { drip_coins: number | null } | null)?.drip_coins ?? 0);
      if (buyerBalance < takeoverPrice) throw new Error('Not enough DripCoin');

      const royaltyCut = Math.floor(takeoverPrice * 0.05);
      const ownerCut = takeoverPrice - royaltyCut;

      if (freshAsset.owner_id) {
        await creditCoins(freshAsset.owner_id, ownerCut);
      }
      if (freshAsset.creator_id && freshAsset.creator_id !== freshAsset.owner_id) {
        await creditCoins(freshAsset.creator_id, royaltyCut);
      }

      const { error: debitError } = await supabase
        .from('drip_users')
        .update({ drip_coins: buyerBalance - takeoverPrice })
        .eq('id', currentUser.id);
      if (debitError) throw debitError;

      const { error: assetUpdateError } = await supabase
        .from('drip_assets')
        .update({
          owner_id: currentUser.id,
          current_value: nextPrice,
          last_takeover_at: new Date().toISOString(),
        })
        .eq('id', freshAsset.id);
      if (assetUpdateError) throw assetUpdateError;

      if (navigator.vibrate) navigator.vibrate([35, 45, 35]);
      setShockwaveKey(Date.now());
      toast.success('Takeover complete. Price surged +20%.');
      await Promise.all([fetchAssets(), loadCurrentUser()]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Takeover failed';
      toast.error(message);
    } finally {
      setActionAssetId(null);
    }
  }, [actionAssetId, activeAsset, creditCoins, currentUser, fetchAssets, loadCurrentUser]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#030712]">
        <Loader2 size={34} className="animate-spin text-cyan-100/80" />
      </div>
    );
  }

  return (
    <section
      className="relative h-[100dvh] overflow-hidden bg-[#030712] text-white [touch-action:pan-y]"
      onWheel={handleWheel}
      aria-label="The Floor"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(34,211,238,0.22),transparent_42%),radial-gradient(circle_at_20%_88%,rgba(56,189,248,0.16),transparent_46%)]" />
      </div>

      {!activeAsset ? (
        <div className="relative z-20 flex h-full items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/10 px-6 py-10 text-center backdrop-blur-3xl"
          >
            <p className="text-sm font-semibold text-white/90">No assets in circulation yet.</p>
          </motion.div>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.article
              key={activeAsset.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 280, damping: 34, mass: 0.9 }}
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.14}
              onDragEnd={(_, info) => {
                const swipePower = Math.abs(info.offset.y) * info.velocity.y;
                if (swipePower < -SWIPE_THRESHOLD) paginate(1);
                if (swipePower > SWIPE_THRESHOLD) paginate(-1);
              }}
              className="absolute inset-0"
            >
              <motion.div
                animate={{ scale: [1.03, 1.08, 1.03] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {isVideoAsset(activeAsset.media_url) ? (
                  <video
                    src={activeAsset.media_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover [filter:saturate(1.15)_contrast(1.05)_brightness(0.88)]"
                  />
                ) : (
                  <img
                    src={activeAsset.media_url}
                    alt={activeAsset.title}
                    className="h-full w-full object-cover [filter:saturate(1.15)_contrast(1.05)_brightness(0.88)]"
                  />
                )}
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/25 to-[#030712]/55" />
            </motion.article>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
            <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2">
              <div className="rounded-full border border-white/25 bg-[#0b1222]/45 px-3.5 py-2 backdrop-blur-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">Live Floor</p>
                <p className="mt-0.5 text-xs font-semibold text-white/90">
                  #{activeIndex + 1} / {rankedAssets.length}
                </p>
              </div>

              <div className="rounded-full border border-white/25 bg-[#0b1222]/45 px-3.5 py-2 backdrop-blur-2xl">
                <div className="flex items-center gap-1.5 text-[11px] font-black">
                  <Wallet size={13} className="text-cyan-100" />
                  {formatCompact(currentUser?.drip_coins ?? 0)}
                  <DripCoin className="h-3.5 w-3.5" />
                </div>
                <p className="mt-0.5 text-[10px] text-white/65">Yield/min {ownedYieldPerSecond * 60 > 0 ? (ownedYieldPerSecond * 60).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-3 top-1/2 z-30 -translate-y-1/2">
            <div className="flex flex-col items-center gap-2.5 rounded-[1.3rem] border border-white/15 bg-[#0b1222]/45 p-2.5 backdrop-blur-2xl">
              <button
                onClick={() => {
                  if (activeAsset.owner_id) window.location.hash = `user_${activeAsset.owner_id}`;
                }}
                className="pointer-events-auto relative h-10 w-10 overflow-hidden rounded-full border border-white/30"
                title={`Owner: ${getDisplayName(activeAsset.owner)}`}
              >
                <img src={getAvatarUrl(activeAsset.owner)} alt={getDisplayName(activeAsset.owner)} className="h-full w-full object-cover" />
              </button>

              <div className="w-12 rounded-xl border border-white/15 bg-black/25 p-1.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/60">Hype</p>
                <p className="mt-1 text-xs font-black text-white">{activeAsset.hype}%</p>
              </div>

              <div className="w-12 rounded-xl border border-white/15 bg-black/25 p-1.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/60">Yield</p>
                <p className="mt-1 text-xs font-black text-white">{activeAsset.yieldPerSecond.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-3 top-1/2 z-30 -translate-y-1/2">
            <div className="rounded-full border border-white/15 bg-[#0b1222]/45 px-2 py-2 backdrop-blur-2xl">
              <button
                onClick={() => paginate(-1)}
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
              >
                <ArrowUp size={14} />
              </button>
              <div className="my-1 h-px bg-white/15" />
              <button
                onClick={() => paginate(1)}
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 z-40 px-4 bottom-[calc(env(safe-area-inset-bottom)+5.65rem)]">
            <motion.div
              key={activeAsset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="pointer-events-auto mx-auto w-full max-w-md rounded-[1.8rem] border border-white/20 bg-[#0b1222]/65 p-3.5 backdrop-blur-3xl shadow-[0_20px_45px_rgba(2,6,23,0.5)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black">{activeAsset.title}</p>
                  <button
                    onClick={() => {
                      if (activeAsset.owner_id) window.location.hash = `user_${activeAsset.owner_id}`;
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/75 transition-colors hover:text-white"
                  >
                    <UserRound size={12} />
                    {getDisplayName(activeAsset.owner)}
                  </button>
                </div>

                <div className="rounded-xl border border-white/20 bg-black/20 px-2 py-1 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">Passive / sec</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-black text-white">
                    {activeAsset.yieldPerSecond.toFixed(3)} <DripCoin className="h-3.5 w-3.5" />
                  </p>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.13em] text-white/70">
                  <span className="flex items-center gap-1">
                    <Activity size={11} />
                    Hype
                  </span>
                  <span>{activeAsset.hype}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500"
                    initial={false}
                    animate={{ width: `${activeAsset.hype}%` }}
                    transition={{ type: 'spring', stiffness: 210, damping: 25 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/15 bg-black/20 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">Current Value</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-black">
                    <TrendingUp size={14} className="text-cyan-100" />
                    {formatCompact(activeAsset.current_value)}
                    <DripCoin className="h-4 w-4" />
                  </p>
                </div>
                <div className="rounded-xl border border-white/15 bg-black/20 p-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">Next Price</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-black">
                    <Flame size={14} className="text-orange-200" />
                    {formatCompact(activeAsset.nextPrice)}
                    <DripCoin className="h-4 w-4" />
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={handleTakeover}
                disabled={isMine || !canAfford || isBusy}
                className={`mt-3 w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
                  isMine || !canAfford || isBusy
                    ? 'border-white/20 bg-white/10 text-white/55'
                    : 'border-cyan-100/80 bg-gradient-to-r from-cyan-400/40 to-sky-400/30 text-white shadow-[0_16px_35px_rgba(56,189,248,0.32)]'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.16em]">
                      {isMine ? 'You Control This Asset' : 'Takeover'}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-white/80">
                      {canAfford ? 'Price increases +20% instantly' : 'Insufficient balance'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-lg font-black">
                    {isBusy ? (
                      <Loader2 size={18} className="animate-spin text-cyan-100" />
                    ) : (
                      <>
                        <Zap size={16} />
                        {formatCompact(activeAsset.current_value)}
                      </>
                    )}
                  </div>
                </div>
              </motion.button>
            </motion.div>
          </div>
        </>
      )}

      <AnimatePresence>
        {shockwaveKey && (
          <motion.div key={shockwaveKey} className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0.9, scale: 0.2 }}
              animate={{ opacity: 0, scale: 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute h-24 w-24 rounded-full border border-cyan-100/90 shadow-[0_0_35px_rgba(56,189,248,0.95)]"
            />
            <motion.span
              initial={{ opacity: 0.3, scale: 0.25 }}
              animate={{ opacity: 0, scale: 5.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.88, ease: 'easeOut' }}
              className="absolute h-48 w-48 rounded-full bg-cyan-300/30 blur-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
