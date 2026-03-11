import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Activity, Flame, Gauge, Loader2, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { DripCoin } from './ui/DripCoin';

type FeedMode = 'ai' | 'recent' | 'value';
type LocaleKey = 'he' | 'en';

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

interface UiCopy {
  liveFloor: string;
  algorithm: string;
  recent: string;
  valueMode: string;
  wallet: string;
  yieldPerMin: string;
  owner: string;
  ownerUnavailable: string;
  rank: string;
  currentValue: string;
  statsYield: string;
  statsHype: string;
  statsValue: string;
  newAsset: string;
  viral: string;
  owned: string;
  takeover: string;
  nextPrice: string;
  insufficientBalance: string;
  feedEmpty: string;
  feedLoadFailed: string;
  reconnectRequired: string;
  assetMissing: string;
  alreadyOwned: string;
  walletNotEnough: string;
  actionFailed: string;
  takeoverSuccess: string;
  now: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}

const TAKEOVER_MULTIPLIER = 1.2;
const TAKEOVER_VIRAL_THRESHOLD = 3;
const TAKEOVER_WINDOW_MS = 10 * 60 * 1000;
const DISCOVERY_WINDOW_MS = 5 * 60 * 1000;

const LOCALE_FORMAT: Record<LocaleKey, string> = {
  he: 'he-IL',
  en: 'en-US',
};

const COPY: Record<LocaleKey, UiCopy> = {
  he: {
    liveFloor: 'רצפת המסחר',
    algorithm: 'אלגוריתם',
    recent: 'חדש',
    valueMode: 'שווי',
    wallet: 'ארנק',
    yieldPerMin: 'Yield / דקה',
    owner: 'בעלים',
    ownerUnavailable: 'בעלים לא זמין',
    rank: 'דירוג',
    currentValue: 'שווי נוכחי',
    statsYield: 'Yield',
    statsHype: 'Hype',
    statsValue: 'Value',
    newAsset: 'חדש',
    viral: 'VIRAL x2',
    owned: 'בבעלותך',
    takeover: 'השתלטות',
    nextPrice: 'מחיר הבא',
    insufficientBalance: 'יתרה לא מספיקה',
    feedEmpty: 'אין כרגע נכסים להצגה בפיד',
    feedLoadFailed: 'טעינת הפיד נכשלה',
    reconnectRequired: 'נדרש להתחבר מחדש כדי לבצע השתלטות',
    assetMissing: 'הנכס לא נמצא',
    alreadyOwned: 'הנכס כבר בבעלותך',
    walletNotEnough: 'אין מספיק יתרה בארנק',
    actionFailed: 'הפעולה נכשלה',
    takeoverSuccess: 'ההשתלטות הושלמה בהצלחה',
    now: 'עכשיו',
    minutesAgo: 'לפני {value} דק׳',
    hoursAgo: 'לפני {value} שע׳',
    daysAgo: 'לפני {value} ימים',
  },
  en: {
    liveFloor: 'LIVE FLOOR',
    algorithm: 'ALGO',
    recent: 'RECENT',
    valueMode: 'VALUE',
    wallet: 'WALLET',
    yieldPerMin: 'Yield / Min',
    owner: 'Owner',
    ownerUnavailable: 'Owner unavailable',
    rank: 'RANK',
    currentValue: 'Current Value',
    statsYield: 'Yield',
    statsHype: 'Hype',
    statsValue: 'Value',
    newAsset: 'NEW',
    viral: 'VIRAL x2',
    owned: 'Owned by you',
    takeover: 'Takeover',
    nextPrice: 'Next Price',
    insufficientBalance: 'Insufficient balance',
    feedEmpty: 'No assets to display yet',
    feedLoadFailed: 'Failed to load floor feed',
    reconnectRequired: 'Reconnect required before takeover',
    assetMissing: 'Asset was not found',
    alreadyOwned: 'This asset is already yours',
    walletNotEnough: 'Not enough wallet balance',
    actionFailed: 'Action failed',
    takeoverSuccess: 'Takeover completed successfully',
    now: 'now',
    minutesAgo: '{value}m ago',
    hoursAgo: '{value}h ago',
    daysAgo: '{value}d ago',
  },
};

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

const withCount = (template: string, value: number) => template.replace('{value}', String(value));

const getTimeAgoLabel = (iso: string, nowMs: number, copy: UiCopy) => {
  const createdMs = new Date(iso).getTime();
  if (Number.isNaN(createdMs)) return copy.now;
  const diffMinutes = Math.max(0, Math.floor((nowMs - createdMs) / 60000));
  if (diffMinutes <= 0) return copy.now;
  if (diffMinutes < 60) return withCount(copy.minutesAgo, diffMinutes);
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return withCount(copy.hoursAgo, hours);
  const days = Math.floor(hours / 24);
  return withCount(copy.daysAgo, days);
};

const getDefaultLocale = (): LocaleKey => {
  if (typeof navigator === 'undefined') return 'he';
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'he';
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

function HudOrbIcon({
  icon: Icon,
  className = 'h-7 w-7',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  const shellId = useId();
  const shineId = useId();

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={shellId} cx="30%" cy="26%" r="75%">
            <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.95" />
            <stop offset="38%" stopColor="#bfdbfe" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id={shineId} cx="24%" cy="18%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#${shellId})`} />
        <ellipse cx="36" cy="28" rx="26" ry="16" fill={`url(#${shineId})`} />
      </svg>
      <span className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white/35 to-slate-900/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-8px_10px_rgba(2,6,23,0.9)]" />
      <span className="relative z-10 flex h-full w-full items-center justify-center [filter:drop-shadow(0_2px_3px_rgba(2,6,23,0.9))]">
        <Icon size={14} className="text-cyan-100" />
      </span>
    </span>
  );
}

function CoinDepth({ className = 'h-5 w-5' }: { className?: string }) {
  const ringId = useId();
  const glossId = useId();

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className} [filter:drop-shadow(0_4px_10px_rgba(8,47,73,0.7))_drop-shadow(0_10px_20px_rgba(14,116,144,0.25))]`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={ringId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </radialGradient>
          <radialGradient id={glossId} cx="26%" cy="20%" r="38%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={`url(#${ringId})`} />
        <ellipse cx="34" cy="28" rx="24" ry="12" fill={`url(#${glossId})`} />
      </svg>
      <span className="absolute inset-[2px] rounded-full bg-gradient-to-br from-slate-100/90 via-cyan-100/60 to-slate-900/90 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-8px_10px_rgba(15,23,42,0.88)]" />
      <span className="relative z-10 flex h-[76%] w-[76%] items-center justify-center">
        <DripCoin className="h-full w-full" />
      </span>
    </span>
  );
}

function MediaSlide({
  asset,
  index,
  total,
  nowMs,
  copy,
}: {
  asset: ComputedAsset;
  index: number;
  total: number;
  nowMs: number;
  copy: UiCopy;
}) {
  const mediaIsVideo = isVideoAsset(asset.media_url);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1.05, 1.1, 1.05] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        {mediaIsVideo ? (
          <video
            src={asset.media_url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover [filter:saturate(1.14)_contrast(1.08)_brightness(0.86)]"
          />
        ) : (
          <img
            src={asset.media_url}
            alt={asset.title}
            className="h-full w-full object-cover [filter:saturate(1.14)_contrast(1.08)_brightness(0.86)]"
          />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_20%_90%,rgba(96,165,250,0.14),transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#02040a]/90 via-[#02040a]/20 to-[#02040a]/62" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="pointer-events-none absolute inset-x-0 top-[17dvh] flex justify-center px-5"
      >
        <div className="flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-4 py-1.5 backdrop-blur-3xl shadow-[0_14px_35px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]">
          <span className="text-[10px] font-black tracking-[0.16em] text-cyan-100">
            #{index + 1} / {total}
          </span>
          <span className="h-3 w-px bg-white/20" />
          <span className="text-[10px] font-semibold text-white/80">{getTimeAgoLabel(asset.created_at, nowMs, copy)}</span>
          {asset.isNew && (
            <>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-[10px] font-black tracking-[0.16em] text-white">{copy.newAsset}</span>
            </>
          )}
          {asset.isViral && (
            <>
              <span className="h-3 w-px bg-white/20" />
              <span className="flex items-center gap-1 text-[10px] font-black tracking-[0.14em] text-amber-100">
                <Flame size={11} className="text-amber-200" />
                {copy.viral}
              </span>
            </>
          )}
        </div>
      </motion.div>
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
  const [locale, setLocale] = useState<LocaleKey>('he');
  const [shockwaveId, setShockwaveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const copy = COPY[locale];
  const isEnglish = locale === 'en';
  const textAlign = isEnglish ? 'text-left' : 'text-right';

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    setLocale(getDefaultLocale());
  }, []);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!shockwaveId) return;
    const timer = window.setTimeout(() => setShockwaveId(null), 980);
    return () => window.clearTimeout(timer);
  }, [shockwaveId]);

  const formatNumber = useCallback(
    (value: number) => Math.floor(value).toLocaleString(LOCALE_FORMAT[locale]),
    [locale],
  );

  const formatYield = useCallback(
    (value: number) =>
      value.toLocaleString(LOCALE_FORMAT[locale], {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
    [locale],
  );

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
        const message = err instanceof Error ? err.message : copy.feedLoadFailed;
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();

    const channel = supabase
      .channel('floor-realtime-v3')
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
  }, [copy.feedLoadFailed, fetchAssets, fetchTakeoverWindow, loadCurrentUser]);

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
  const activeOwnerName = activeAsset?.owner?.username ?? copy.ownerUnavailable;
  const activeOwnerAvatar = activeAsset
    ? activeAsset.owner?.avatar_url ??
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeOwnerName)}`
    : '';
  const isMine = Boolean(activeAsset && activeAsset.owner_id === currentUser?.id);
  const canAfford = Boolean(activeAsset && (currentUser?.drip_coins ?? 0) >= activeAsset.current_value);
  const isBusy = Boolean(activeAsset && actionId === activeAsset.id);

  const handleTakeover = useCallback(
    async (asset: ComputedAsset) => {
      if (!currentUser) {
        toast.error(copy.reconnectRequired);
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

        const freshAsset = freshAssetData as {
          id: string;
          owner_id: string | null;
          creator_id: string | null;
          current_value: number;
        } | null;
        if (!freshAsset) throw new Error(copy.assetMissing);
        if (freshAsset.owner_id === currentUser.id) throw new Error(copy.alreadyOwned);

        const takeoverPrice = Math.floor(freshAsset.current_value);
        const nextPrice = Math.floor(takeoverPrice * TAKEOVER_MULTIPLIER);

        const { data: buyerData, error: buyerError } = await supabase
          .from('drip_users')
          .select('drip_coins')
          .eq('id', currentUser.id)
          .single();

        if (buyerError) throw buyerError;
        const buyerBalance = Number((buyerData as { drip_coins: number | null } | null)?.drip_coins ?? 0);
        if (buyerBalance < takeoverPrice) throw new Error(copy.walletNotEnough);

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
        setShockwaveId(`${freshAsset.id}-${Date.now()}`);
        toast.success(copy.takeoverSuccess);
        await Promise.all([fetchAssets(), fetchTakeoverWindow(), loadCurrentUser()]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : copy.actionFailed;
        toast.error(message);
      } finally {
        setActionId(null);
      }
    },
    [actionId, copy, currentUser, fetchAssets, fetchTakeoverWindow, loadCurrentUser],
  );

  const feedModes: Array<{
    key: FeedMode;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { key: 'ai', label: copy.algorithm, icon: Sparkles },
    { key: 'recent', label: copy.recent, icon: Activity },
    { key: 'value', label: copy.valueMode, icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#02040a]">
        <Loader2 size={34} className="animate-spin text-white/75" />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#02040a] text-white" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-80 w-[95vw] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute bottom-[-120px] left-1/2 h-80 w-[95vw] -translate-x-1/2 rounded-full bg-blue-300/10 blur-[140px]" />
      </div>

      {orderedAssets.length === 0 ? (
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-[34px] border border-white/20 bg-white/[0.08] px-8 py-10 text-center backdrop-blur-3xl shadow-[0_25px_60px_rgba(2,6,23,0.55)]"
          >
            <p className="text-sm font-semibold text-white/85">{copy.feedEmpty}</p>
          </motion.div>
        </div>
      ) : (
        <div ref={containerRef} onScroll={onFeedScroll} className="h-full snap-y snap-mandatory overflow-y-scroll no-scrollbar">
          <AnimatePresence initial={false}>
            {orderedAssets.map((asset, index) => (
              <MediaSlide key={asset.id} asset={asset} index={index} total={orderedAssets.length} nowMs={nowMs} copy={copy} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {activeAsset && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none fixed left-1/2 top-4 z-40 w-[min(96vw,860px)] -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-auto rounded-[32px] border border-white/25 bg-white/[0.08] p-2.5 backdrop-blur-3xl shadow-[0_25px_55px_rgba(2,6,23,0.52),inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">{copy.liveFloor}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{activeAsset.title}</p>
                  <button
                    onClick={() => {
                      if (activeAsset.owner_id) window.location.hash = `user_${activeAsset.owner_id}`;
                    }}
                    className="mt-2 flex max-w-full items-center gap-2 text-xs text-white/80 transition-colors hover:text-white"
                  >
                    <img src={activeOwnerAvatar} alt={activeOwnerName} className="h-6 w-6 rounded-full border border-white/25 object-cover" />
                    <span className="truncate">
                      {copy.owner}: {activeOwnerName}
                    </span>
                  </button>
                </div>

                <div className="col-span-5 grid gap-2">
                  <div className="rounded-2xl border border-white/15 bg-black/20 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{copy.rank}</p>
                    <p className="mt-1 text-sm font-black text-cyan-100">
                      #{activeIndex + 1} / {orderedAssets.length}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/15 bg-black/20 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{copy.wallet}</p>
                        <HudOrbIcon icon={Wallet} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-white">
                        {formatNumber(currentUser?.drip_coins ?? 0)}
                        <CoinDepth className="h-4 w-4" />
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-black/20 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{copy.yieldPerMin}</p>
                        <HudOrbIcon icon={Activity} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-white">
                        {formatYield(ownedYieldPerSecond * 60)}
                        <CoinDepth className="h-4 w-4" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-black/20 p-1">
                {feedModes.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setFeedMode(mode.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-black tracking-[0.15em] transition-all ${
                      feedMode === mode.key
                        ? 'bg-white text-[#02040a] shadow-[0_10px_24px_rgba(255,255,255,0.35)]'
                        : 'text-white/75 hover:bg-white/10'
                    }`}
                  >
                    <mode.icon size={12} />
                    {mode.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-[min(95vw,860px)] -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full border border-white/25 bg-white/[0.08] p-1.5 backdrop-blur-3xl shadow-[0_18px_45px_rgba(2,6,23,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              <div className="grid grid-cols-3 rounded-full bg-black/20">
                <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                  <HudOrbIcon icon={Gauge} className="h-6 w-6" />
                  <div className={`${textAlign} leading-tight`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">{copy.statsYield}</p>
                    <p className="text-xs font-black text-white">{formatYield(activeAsset.yieldPerSecond)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 border-x border-white/10 px-3 py-1.5">
                  <HudOrbIcon icon={Activity} className="h-6 w-6" />
                  <div className={`${textAlign} leading-tight`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">{copy.statsHype}</p>
                    <p className="text-xs font-black text-white">{activeAsset.hype}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                  <HudOrbIcon icon={TrendingUp} className="h-6 w-6" />
                  <div className={`${textAlign} leading-tight`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">{copy.statsValue}</p>
                    <p className="flex items-center gap-1 text-xs font-black text-white">
                      {formatNumber(activeAsset.current_value)}
                      <CoinDepth className="h-3.5 w-3.5" />
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2"
          >
            <motion.button
              whileTap={{ scale: 0.985 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleTakeover(activeAsset)}
              disabled={isMine || !canAfford || isBusy}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-full border px-6 py-4 backdrop-blur-3xl transition-all ${
                isMine || !canAfford || isBusy
                  ? 'border-white/20 bg-white/[0.08] text-white/55'
                  : 'border-cyan-100/70 bg-white/[0.18] text-white shadow-[0_24px_60px_rgba(6,182,212,0.28),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-10px_20px_rgba(2,6,23,0.5)]'
              }`}
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.05)_45%,rgba(2,6,23,0.3)_100%)]" />
              <div className="relative flex items-center justify-between gap-4">
                <div className={`${textAlign} min-w-0`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em]">{isMine ? copy.owned : copy.takeover}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-white/80">
                    {canAfford ? `${copy.nextPrice}: ${formatNumber(activeAsset.nextPrice)}` : copy.insufficientBalance}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-lg font-black">
                  {isBusy ? (
                    <Loader2 size={18} className="animate-spin text-cyan-100" />
                  ) : (
                    <>
                      {formatNumber(activeAsset.current_value)}
                      <CoinDepth className="h-6 w-6" />
                    </>
                  )}
                </div>
              </div>
            </motion.button>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {shockwaveId && (
          <motion.div key={shockwaveId} className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
            <motion.span
              initial={{ scale: 0.2, opacity: 0.85 }}
              animate={{ scale: 8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute h-28 w-28 rounded-full border border-cyan-100/85 shadow-[0_0_25px_rgba(34,211,238,0.85)]"
            />
            <motion.span
              initial={{ scale: 0.25, opacity: 0.35 }}
              animate={{ scale: 5.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: 'easeOut' }}
              className="absolute h-48 w-48 rounded-full bg-cyan-200/25 blur-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
