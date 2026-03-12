import { AnimatePresence, motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import toast from 'react-hot-toast';
import supabase from '../supabase';
import StakeDesk, { type AssetDeskModel } from './StakeDesk';

type FoundingLedger = Record<string, number>;
type MediaKind = 'image' | 'video';
type FeedMode = 'new' | 'hot';
type PanelKey = 'profile' | 'store' | 'powers' | 'rewards' | 'chat' | 'messages' | 'warroom' | 'search' | 'upload';

type FeedAsset = AssetDeskModel & {
  summary: string;
  mediaKind: MediaKind;
  mediaUrl: string;
  paletteA: string;
  paletteB: string;
  foundingLedger: FoundingLedger;
  shareCount: number;
  claimVolume: number;
  watchMinutes: number;
  createdAt: number;
};

type SupabaseFeedRow = Record<string, unknown>;

const USER_ID = 'local-player';
const BASE_BACK_COST = 10;
const DIVIDEND_RATE = 0.1;
const HAS_SUPABASE_CONFIG = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const PALETTES: Array<[string, string]> = [
  ['#4B0CA3', '#FF007F'],
  ['#10002B', '#CCFF00'],
  ['#010114', '#E0E0E0'],
  ['#240046', '#FF007F'],
  ['#03071E', '#CCFF00'],
];

const POWER_NAMES = [
  'סערת ניאון',
  'מכפיל הייפ',
  'גל הדף קהילתי',
  'מגן נזילות',
  'האצת טרנד',
  'פריצת פיד',
  'רימון ויראלי',
  'הקפצת דירוג',
  'לכידת תשומת לב',
  'חומת בעלות',
] as const;

const REWARD_NAMES = [
  'תגית ליגת-על',
  'שדרוג אווטאר',
  'קרן תמיכה',
  'ניצוץ קהילה',
  'חבילת בונוס',
  'כתר שוק',
  'תיבת מומנטום',
  'שובר הנפקה',
  'כספת מהירות',
  'מדליית ויראליות',
] as const;

const STORE_ITEMS = [
  { id: 'store-1', title: 'מכפיל מסחר 2x', price: 280 },
  { id: 'store-2', title: 'מגן ירידת הייפ', price: 360 },
  { id: 'store-3', title: 'בוסט חשיפה יומי', price: 190 },
  { id: 'store-4', title: 'ערכת הנפקה פרימיום', price: 470 },
  { id: 'store-5', title: 'תור מהיר לחדר מלחמה', price: 220 },
  { id: 'store-6', title: 'מודיעין שוק מתקדם', price: 340 },
  { id: 'store-7', title: 'חבילת יוצרים', price: 520 },
  { id: 'store-8', title: 'מנוע AI לניסוח כותרת', price: 420 },
] as const;

const SAMPLE_USERS = [
  'נועה_קפיטל',
  'דניאל_מרקט',
  'יובל_טרנדס',
  'ליאור_דריפ',
  'עדי_סטודיו',
  'רומי_בורסה',
  'תומר_אלפא',
  'שירה_וייב',
  'יהב_שוק',
  'מאיה_קוואנט',
  'אילן_ברוקר',
  'אופק_סקלפ',
];

const PANEL_LABELS: Array<{ key: PanelKey; label: string; icon: string }> = [
  { key: 'profile', label: 'פרופיל', icon: '👤' },
  { key: 'store', label: 'חנות', icon: '🛍️' },
  { key: 'powers', label: 'כוחות', icon: '⚡' },
  { key: 'rewards', label: 'פרסים', icon: '🏆' },
  { key: 'chat', label: 'צ׳אט', icon: '💬' },
  { key: 'messages', label: 'הודעות', icon: '✉️' },
  { key: 'warroom', label: 'חדר מלחמה', icon: '🛡️' },
  { key: 'search', label: 'חיפוש', icon: '🔎' },
  { key: 'upload', label: 'העלאה', icon: '⬆️' },
];

const POWERS = Array.from({ length: 40 }, (_, idx) => ({
  id: `power-${idx + 1}`,
  name: `${POWER_NAMES[idx % POWER_NAMES.length]} ${idx + 1}`,
  price: 70 + idx * 9,
  impact: 6 + (idx % 9) * 2,
}));

const REWARDS = Array.from({ length: 40 }, (_, idx) => ({
  id: `reward-${idx + 1}`,
  name: `${REWARD_NAMES[idx % REWARD_NAMES.length]} ${idx + 1}`,
  requiredClaims: 2 + idx,
  bonus: 35 + idx * 6,
}));

const seedAssets: FeedAsset[] = [
  {
    id: 'pulse-1',
    title: 'הקרנה ניאונית: רחוב לילי',
    creator: 'סטודיו ירח-פלזמה',
    summary: 'סשן ויזואלי חי שהופך כל מעבר תאורה לנכס סחיר בפיד.',
    mediaKind: 'video',
    mediaUrl: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-city-1579/1080p.mp4',
    paletteA: '#4B0CA3',
    paletteB: '#FF007F',
    openingPrice: 520,
    stakePrice: 520,
    viewersLive: 1830,
    hypeLevel: 0.4,
    foundingPool: 0,
    foundingBackers: 0,
    totalClaims: 4,
    averageClaimPrice: 610,
    viralScore: 42,
    transferVelocity: 22,
    marketingScore: 48,
    currentOwner: 'סינדיקט לילה',
    trendScore: 71,
    foundingLedger: {},
    shareCount: 390,
    claimVolume: 2440,
    watchMinutes: 6400,
    createdAt: Date.now() - 1000 * 60 * 180,
  },
  {
    id: 'pulse-2',
    title: 'קצב אקווה: בתנועה רציפה',
    creator: 'מיקה סינט',
    summary: 'פריים דינמי עם רמיקס חי שמושך ציידי טרנדים בזמן אמת.',
    mediaKind: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    paletteA: '#10002B',
    paletteB: '#CCFF00',
    openingPrice: 890,
    stakePrice: 890,
    viewersLive: 2650,
    hypeLevel: 0.5,
    foundingPool: 0,
    foundingBackers: 0,
    totalClaims: 7,
    averageClaimPrice: 1125,
    viralScore: 57,
    transferVelocity: 33,
    marketingScore: 63,
    currentOwner: 'האוס אופנה',
    trendScore: 82,
    foundingLedger: {},
    shareCount: 610,
    claimVolume: 7875,
    watchMinutes: 9200,
    createdAt: Date.now() - 1000 * 60 * 140,
  },
  {
    id: 'pulse-3',
    title: 'אופק קינטי: טיפוגרפיה מרחפת',
    creator: 'איילה פלו',
    summary: 'אסתטיקה הולוגרפית שמגיבה לצפייה משותפת ומאיצה את המחיר.',
    mediaKind: 'video',
    mediaUrl: 'https://cdn.coverr.co/videos/coverr-fashion-model-in-neon-light-9710/1080p.mp4',
    paletteA: '#010114',
    paletteB: '#E0E0E0',
    openingPrice: 1330,
    stakePrice: 1330,
    viewersLive: 3420,
    hypeLevel: 0.61,
    foundingPool: 0,
    foundingBackers: 0,
    totalClaims: 11,
    averageClaimPrice: 1772,
    viralScore: 67,
    transferVelocity: 46,
    marketingScore: 74,
    currentOwner: 'תל אביב וייב',
    trendScore: 93,
    foundingLedger: {},
    shareCount: 980,
    claimVolume: 19492,
    watchMinutes: 15300,
    createdAt: Date.now() - 1000 * 60 * 110,
  },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

const sumLedger = (ledger: FoundingLedger): number => Object.values(ledger).reduce((acc, value) => acc + value, 0);

const normalizeAsset = (asset: FeedAsset): FeedAsset => {
  const opening = Math.max(1, asset.openingPrice);
  const ageMinutes = Math.max(1, (Date.now() - asset.createdAt) / 60000);
  const safeAvgClaim = asset.totalClaims > 0 ? asset.averageClaimPrice : opening;

  const momentumNorm = clamp((asset.stakePrice - opening) / (opening * 2.2), 0, 1);
  const takeoverNorm = clamp(asset.totalClaims / 28, 0, 1);
  const claimPremiumNorm = clamp((safeAvgClaim - opening) / (opening * 1.6), 0, 1);
  const viralityNorm = clamp((asset.shareCount * 9 + asset.viewersLive) / 50000, 0, 1);
  const velocityNorm = clamp((asset.totalClaims / ageMinutes) * 4.9, 0, 1);
  const marketingNorm = clamp((asset.watchMinutes / ageMinutes) / 260, 0, 1);

  const hypeLevel = clamp(
    momentumNorm * 0.2 +
      takeoverNorm * 0.22 +
      claimPremiumNorm * 0.14 +
      viralityNorm * 0.2 +
      velocityNorm * 0.14 +
      marketingNorm * 0.1,
    0.08,
    1,
  );

  return {
    ...asset,
    averageClaimPrice: safeAvgClaim,
    hypeLevel,
    viralScore: Math.round(viralityNorm * 100),
    transferVelocity: Math.round(velocityNorm * 100),
    marketingScore: Math.round((claimPremiumNorm * 0.4 + marketingNorm * 0.6) * 100),
    trendScore: clamp(Math.round(44 + hypeLevel * 72 + momentumNorm * 22 + takeoverNorm * 18), 1, 999),
  };
};

const getBackCost = (asset: FeedAsset): number =>
  BASE_BACK_COST + Math.floor(asset.hypeLevel * 15) + Math.floor(asset.transferVelocity / 24);

const createAssetId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pulse-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const pickPalette = (): [string, string] => PALETTES[Math.floor(Math.random() * PALETTES.length)];

const isToday = (timestamp: number): boolean => {
  const now = new Date();
  const d = new Date(timestamp);
  return (
    now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate()
  );
};

const formatTimeAgo = (timestamp: number): string => {
  const mins = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  return `לפני ${days} ימים`;
};

const computeHotScore = (asset: FeedAsset, wallet: number): number =>
  asset.stakePrice * 0.35 +
  asset.totalClaims * 155 +
  asset.hypeLevel * 2300 +
  asset.shareCount * 1.9 +
  asset.watchMinutes * 0.1 +
  Math.min(wallet, 25000) * 0.05;

const safeNum = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const assetFromRow = (row: SupabaseFeedRow): FeedAsset | null => {
  const id = String(row.id ?? '');
  const title = String(row.title ?? '');
  const creator = String(row.creator ?? '');
  const mediaUrl = String(row.media_url ?? '');
  const summary = String(row.summary ?? '');
  if (!id || !title || !creator || !mediaUrl || !summary) return null;

  const rawKind = String(row.media_kind ?? 'video');
  const mediaKind: MediaKind = rawKind === 'image' ? 'image' : 'video';
  const createdAtValue = row.created_at ? new Date(String(row.created_at)).getTime() : Date.now();

  return normalizeAsset({
    id,
    title,
    creator,
    summary,
    mediaKind,
    mediaUrl,
    paletteA: String(row.palette_a ?? '#4B0CA3'),
    paletteB: String(row.palette_b ?? '#FF007F'),
    openingPrice: safeNum(row.opening_price, 500),
    stakePrice: safeNum(row.stake_price, 500),
    viewersLive: safeNum(row.viewers_live, 250),
    hypeLevel: safeNum(row.hype_level, 0.12),
    foundingPool: safeNum(row.founding_pool, 0),
    foundingBackers: safeNum(row.founding_backers, 0),
    totalClaims: safeNum(row.total_claims, 0),
    averageClaimPrice: safeNum(row.average_claim_price, 500),
    viralScore: safeNum(row.viral_score, 0),
    transferVelocity: safeNum(row.transfer_velocity, 0),
    marketingScore: safeNum(row.marketing_score, 0),
    currentOwner: String(row.current_owner ?? 'היוצר המקורי'),
    trendScore: safeNum(row.trend_score, 1),
    foundingLedger:
      typeof row.founding_ledger === 'object' && row.founding_ledger !== null
        ? (row.founding_ledger as FoundingLedger)
        : {},
    shareCount: safeNum(row.share_count, 0),
    claimVolume: safeNum(row.claim_volume, 0),
    watchMinutes: safeNum(row.watch_minutes, 0),
    createdAt: Number.isFinite(createdAtValue) ? createdAtValue : Date.now(),
  });
};

const rowFromAsset = (asset: FeedAsset) => ({
  id: asset.id,
  title: asset.title,
  creator: asset.creator,
  summary: asset.summary,
  media_kind: asset.mediaKind,
  media_url: asset.mediaUrl,
  palette_a: asset.paletteA,
  palette_b: asset.paletteB,
  opening_price: asset.openingPrice,
  stake_price: asset.stakePrice,
  viewers_live: asset.viewersLive,
  hype_level: asset.hypeLevel,
  founding_pool: asset.foundingPool,
  founding_backers: asset.foundingBackers,
  total_claims: asset.totalClaims,
  average_claim_price: asset.averageClaimPrice,
  viral_score: asset.viralScore,
  transfer_velocity: asset.transferVelocity,
  marketing_score: asset.marketingScore,
  current_owner: asset.currentOwner,
  trend_score: asset.trendScore,
  founding_ledger: asset.foundingLedger,
  share_count: asset.shareCount,
  claim_volume: asset.claimVolume,
  watch_minutes: asset.watchMinutes,
  created_at: new Date(asset.createdAt).toISOString(),
});

function FullscreenPanel({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[70] p-3 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="holo-panel pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/15 bg-black/35"
        initial={{ y: 26, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
            {subtitle && <p className="text-xs text-[#E0E0E0]/70">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/20 bg-black/20 px-3 py-1 text-xs font-semibold text-[#E0E0E0]"
          >
            סגירה
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export default function AetherFeed() {
  const [assets, setAssets] = useState<FeedAsset[]>(() => seedAssets.map((asset) => normalizeAsset(asset)));
  const [activeAssetId, setActiveAssetId] = useState(seedAssets[0]?.id ?? '');
  const [feedMode, setFeedMode] = useState<FeedMode>('new');
  const [wallet, setWallet] = useState(4800);
  const [lifetimeDividends, setLifetimeDividends] = useState(0);
  const [shockwaveAirdrops, setShockwaveAirdrops] = useState(0);
  const [eventLine, setEventLine] = useState('השוק חי: גללו למעלה ולמטה כדי להעביר הייפ בין נכסים.');
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [marketDataOpen, setMarketDataOpen] = useState(false);
  const [isRtl, setIsRtl] = useState(true);
  const [supabaseState, setSupabaseState] = useState<'בדיקה' | 'מחובר' | 'לוקאלי'>('בדיקה');

  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [videoDuration, setVideoDuration] = useState<Record<string, number>>({});
  const [pausedOverlayAssetId, setPausedOverlayAssetId] = useState<string | null>(null);
  const [pausedOverlayTick, setPausedOverlayTick] = useState(0);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftCreator, setDraftCreator] = useState('את/ה');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftMediaKind, setDraftMediaKind] = useState<MediaKind>('video');
  const [draftMediaUrl, setDraftMediaUrl] = useState('');
  const [draftOpeningPrice, setDraftOpeningPrice] = useState('500');
  const [draftInputMode, setDraftInputMode] = useState<'url' | 'file'>('url');
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<string[]>([
    'אלפא_בורסה: אני נכנס לנכס החם בדקה הקרובה.',
    'אור_מומנטום: מי שמזהה טרנד מוקדם מייצר רווח מטורף.',
    'טל_מסחר: תבדקו את לשונית החם, יש שם הפתעות.',
  ]);
  const [userSearch, setUserSearch] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const userPausedRef = useRef<Record<string, boolean>>({});
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const isScrubbingRef = useRef(false);

  useEffect(() => {
    setIsRtl(document.documentElement.dir === 'rtl');
  }, []);

  const displayedAssets = useMemo(() => {
    const list = [...assets];
    if (feedMode === 'new') {
      return list.sort((a, b) => {
        const todayDiff = Number(isToday(b.createdAt)) - Number(isToday(a.createdAt));
        if (todayDiff !== 0) return todayDiff;
        return b.createdAt - a.createdAt;
      });
    }
    return list.sort((a, b) => computeHotScore(b, wallet) - computeHotScore(a, wallet));
  }, [assets, feedMode, wallet]);

  useEffect(() => {
    if (!displayedAssets.length) return;
    if (!displayedAssets.some((asset) => asset.id === activeAssetId)) {
      setActiveAssetId(displayedAssets[0].id);
    }
  }, [displayedAssets, activeAssetId]);

  const activeAsset = useMemo(
    () => displayedAssets.find((asset) => asset.id === activeAssetId) ?? displayedAssets[0],
    [displayedAssets, activeAssetId],
  );

  const activeLedgerTotal = activeAsset ? sumLedger(activeAsset.foundingLedger) : 0;
  const myFoundingStake = activeAsset?.foundingLedger[USER_ID] ?? 0;
  const backCost = activeAsset ? getBackCost(activeAsset) : BASE_BACK_COST;
  const myProjectedDividend = useMemo(() => {
    if (!activeAsset || myFoundingStake <= 0 || activeLedgerTotal <= 0) return 0;
    return Math.round(activeAsset.stakePrice * DIVIDEND_RATE * (myFoundingStake / activeLedgerTotal));
  }, [activeAsset, myFoundingStake, activeLedgerTotal]);

  const canBack = wallet >= backCost;
  const canClaim = wallet >= (activeAsset?.stakePrice ?? Number.MAX_SAFE_INTEGER);
  const activeVideoDuration = activeAsset ? videoDuration[activeAsset.id] ?? 0 : 0;
  const activeVideoTime = activeAsset ? videoProgress[activeAsset.id] ?? 0 : 0;
  const activeVideoRatio = activeVideoDuration > 0 ? clamp(activeVideoTime / activeVideoDuration, 0, 1) : 0;

  const playVideoIfAllowed = useCallback(async (video: HTMLVideoElement, assetId: string) => {
    try {
      await video.play();
      setPausedOverlayAssetId((current) => (current === assetId ? null : current));
      return;
    } catch {
      video.muted = true;
    }

    try {
      await video.play();
      setPausedOverlayAssetId((current) => (current === assetId ? null : current));
    } catch {
      // Browser policy can still block autoplay until user interaction.
    }
  }, []);

  useEffect(() => {
    if (!HAS_SUPABASE_CONFIG) {
      setSupabaseState('לוקאלי');
      return;
    }

    let ignore = false;
    const loadRemoteAssets = async () => {
      const { data, error } = await supabase.from('feed_assets').select('*').order('created_at', { ascending: false }).limit(120);
      if (ignore) return;
      if (error) {
        setSupabaseState('לוקאלי');
        setEventLine('חיבור Supabase לא זמין כרגע, ממשיכים במצב לוקאלי.');
        return;
      }
      const remoteAssets = (data ?? [])
        .map((row) => assetFromRow(row as SupabaseFeedRow))
        .filter((asset): asset is FeedAsset => Boolean(asset));
      if (remoteAssets.length > 0) {
        setAssets((prev) => {
          const map = new Map<string, FeedAsset>();
          prev.forEach((asset) => map.set(asset.id, asset));
          remoteAssets.forEach((asset) => map.set(asset.id, asset));
          return Array.from(map.values()).map((asset) => normalizeAsset(asset));
        });
      }
      setSupabaseState('מחובר');
    };

    void loadRemoteAssets();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-feed-card]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (topEntry) {
          const topAssetId = topEntry.target.getAttribute('data-asset-id');
          if (topAssetId) setActiveAssetId(topAssetId);
        }

        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          const assetId = card.getAttribute('data-asset-id');
          if (!assetId) return;
          const videoEl = videoRefs.current[assetId];
          if (!videoEl) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.68) {
            if (!userPausedRef.current[assetId]) {
              void playVideoIfAllowed(videoEl, assetId);
            }
            return;
          }

          videoEl.pause();
          userPausedRef.current[assetId] = false;
        });
      },
      {
        root,
        threshold: [0.55, 0.68, 0.82],
      },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [displayedAssets.length, playVideoIfAllowed]);

  useEffect(() => {
    setAssets((prevAssets) =>
      prevAssets.map((asset) => {
        const migration = asset.id === activeAssetId ? 210 : -55;
        const viewersLive = clamp(asset.viewersLive + migration, 220, 60000);
        return normalizeAsset({
          ...asset,
          viewersLive,
        });
      }),
    );
  }, [activeAssetId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      let liveHeadline = '';
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          const isActive = asset.id === activeAssetId;
          const viewerSwing = Math.round((Math.random() - 0.45) * (isActive ? 400 : 260));
          const viewersLive = clamp(asset.viewersLive + viewerSwing, 180, 60000);
          const shareBoost = Math.max(0, Math.round(viewersLive / (isActive ? 160 : 260)) + Math.round(Math.random() * 12));
          const watchMinutes = asset.watchMinutes + Math.round(viewersLive / (isActive ? 80 : 120));

          let stakePrice = clamp(
            Math.round(asset.stakePrice * (1 + (asset.hypeLevel - 0.46) * 0.007 + (isActive ? 0.0025 : 0.001))),
            60,
            500000,
          );
          let totalClaims = asset.totalClaims;
          let claimVolume = asset.claimVolume;
          let averageClaimPrice = asset.averageClaimPrice;
          let currentOwner = asset.currentOwner;
          let shareCount = asset.shareCount + shareBoost;

          const autoClaimChance = (isActive ? 0.2 : 0.09) + asset.hypeLevel * 0.08;
          if (Math.random() < autoClaimChance) {
            const autoClaimPrice = Math.round(stakePrice * (1.03 + Math.random() * 0.1 + asset.hypeLevel * 0.06));
            totalClaims += 1;
            claimVolume += autoClaimPrice;
            averageClaimPrice = claimVolume / totalClaims;
            stakePrice = clamp(Math.round(autoClaimPrice * (1.03 + Math.random() * 0.08)), 60, 500000);
            currentOwner = `סינדיקט ${1 + Math.floor(Math.random() * 7)}`;
            shareCount += Math.round(16 + Math.random() * 48);
            if (isActive) {
              liveHeadline = `השתלטות חיה: ${currentOwner} נכנס ב-${formatCoin(autoClaimPrice)} DRIPCOIN`;
            }
          }

          return normalizeAsset({
            ...asset,
            viewersLive,
            shareCount,
            watchMinutes,
            stakePrice,
            totalClaims,
            claimVolume,
            averageClaimPrice,
            currentOwner,
          });
        }),
      );
      if (liveHeadline) setEventLine(liveHeadline);
    }, 2400);

    return () => window.clearInterval(interval);
  }, [activeAssetId]);

  useEffect(() => {
    displayedAssets.forEach((asset) => {
      const videoEl = videoRefs.current[asset.id];
      if (!videoEl) return;
      if (asset.id === activeAsset?.id) {
        if (!userPausedRef.current[asset.id]) {
          void playVideoIfAllowed(videoEl, asset.id);
        }
        return;
      }
      videoEl.pause();
      userPausedRef.current[asset.id] = false;
    });
  }, [activeAsset?.id, displayedAssets, playVideoIfAllowed]);

  useEffect(() => {
    return () => {
      if (draftPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(draftPreviewUrl);
      }
    };
  }, [draftPreviewUrl]);

  const onVideoMetadataLoaded = (assetId: string, videoEl: HTMLVideoElement) => {
    if (!Number.isFinite(videoEl.duration) || videoEl.duration <= 0) return;
    setVideoDuration((prev) => ({
      ...prev,
      [assetId]: videoEl.duration,
    }));
  };

  const onVideoTimeUpdate = (assetId: string, videoEl: HTMLVideoElement) => {
    setVideoProgress((prev) => ({
      ...prev,
      [assetId]: videoEl.currentTime,
    }));
  };

  const toggleAssetPlayback = useCallback(
    async (assetId: string) => {
      const asset = displayedAssets.find((item) => item.id === assetId);
      if (!asset || asset.mediaKind !== 'video') return;
      const videoEl = videoRefs.current[asset.id];
      if (!videoEl) return;

      if (videoEl.paused) {
        userPausedRef.current[asset.id] = false;
        await playVideoIfAllowed(videoEl, asset.id);
        setPausedOverlayAssetId(null);
        return;
      }

      videoEl.pause();
      userPausedRef.current[asset.id] = true;
      setPausedOverlayAssetId(asset.id);
      setPausedOverlayTick(Date.now());
    },
    [displayedAssets, playVideoIfAllowed],
  );

  const seekActiveVideo = useCallback(
    (clientX: number) => {
      if (!activeAsset || activeAsset.mediaKind !== 'video') return;
      const track = scrubberRef.current;
      const videoEl = videoRefs.current[activeAsset.id];
      if (!track || !videoEl || !Number.isFinite(videoEl.duration) || videoEl.duration <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      videoEl.currentTime = videoEl.duration * ratio;
      setVideoProgress((prev) => ({
        ...prev,
        [activeAsset.id]: videoEl.currentTime,
      }));
    },
    [activeAsset],
  );

  const onScrubberPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeAsset || activeAsset.mediaKind !== 'video') return;
    event.preventDefault();
    isScrubbingRef.current = true;
    seekActiveVideo(event.clientX);
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isScrubbingRef.current) return;
      seekActiveVideo(event.clientX);
    };
    const stopScrub = () => {
      isScrubbingRef.current = false;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopScrub);
    window.addEventListener('pointercancel', stopScrub);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopScrub);
      window.removeEventListener('pointercancel', stopScrub);
    };
  }, [seekActiveVideo]);

  const updateShimmer = (clientX: number, clientY: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;
    root.style.setProperty('--mx', `${clamp(x, 0, 100)}%`);
    root.style.setProperty('--my', `${clamp(y, 0, 100)}%`);
  };

  const uploadMedia = async (file: File): Promise<string> => {
    if (!HAS_SUPABASE_CONFIG) {
      return URL.createObjectURL(file);
    }
    const extension = file.name.split('.').pop() ?? 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `feed/${fileName}`;
    const { error } = await supabase.storage.from('feed-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('feed-media').getPublicUrl(filePath);
    if (!data.publicUrl) throw new Error('לא התקבלה כתובת קובץ פומבית');
    return data.publicUrl;
  };

  const submitNewAsset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const openingPrice = Math.round(Number(draftOpeningPrice));
    if (!draftTitle.trim() || !draftCreator.trim() || !draftSummary.trim()) {
      toast.error('יש למלא כותרת, יוצר ותיאור לפני העלאה.');
      return;
    }
    if (!Number.isFinite(openingPrice) || openingPrice <= 0) {
      toast.error('מחיר פתיחה חייב להיות מספר חיובי.');
      return;
    }

    if (draftInputMode === 'url' && !draftMediaUrl.trim()) {
      toast.error('יש להזין קישור תקין למדיה.');
      return;
    }
    if (draftInputMode === 'file' && !draftFile) {
      toast.error('יש לבחור קובץ תמונה או וידאו.');
      return;
    }

    setIsPublishing(true);
    try {
      let mediaUrl = draftMediaUrl.trim();
      if (draftInputMode === 'file' && draftFile) {
        try {
          mediaUrl = await uploadMedia(draftFile);
          setSupabaseState((prev) => (prev === 'לוקאלי' ? prev : 'מחובר'));
        } catch {
          mediaUrl = URL.createObjectURL(draftFile);
          setSupabaseState('לוקאלי');
          toast('הקובץ נטען זמנית בלבד. כדי לשמור קבוע, חבר/י Bucket בשם feed-media ב-Supabase.');
        }
      }

      const [paletteA, paletteB] = pickPalette();
      const created = normalizeAsset({
        id: createAssetId(),
        title: draftTitle.trim(),
        creator: draftCreator.trim(),
        summary: draftSummary.trim(),
        mediaKind: draftMediaKind,
        mediaUrl,
        paletteA,
        paletteB,
        openingPrice,
        stakePrice: openingPrice,
        viewersLive: 240 + Math.round(Math.random() * 500),
        hypeLevel: 0.12,
        foundingPool: 0,
        foundingBackers: 0,
        totalClaims: 0,
        averageClaimPrice: openingPrice,
        viralScore: 8,
        transferVelocity: 0,
        marketingScore: 10,
        currentOwner: 'היוצר המקורי',
        trendScore: 1,
        foundingLedger: {},
        shareCount: 0,
        claimVolume: 0,
        watchMinutes: 0,
        createdAt: Date.now(),
      });

      setAssets((prev) => [created, ...prev]);
      setActiveAssetId(created.id);
      setFeedMode('new');
      setActivePanel(null);
      setDraftTitle('');
      setDraftSummary('');
      setDraftMediaUrl('');
      setDraftMediaKind('video');
      setDraftOpeningPrice('500');
      setDraftInputMode('url');
      setDraftFile(null);
      if (draftPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(draftPreviewUrl);
      }
      setDraftPreviewUrl('');

      setEventLine(`נכס חדש עלה לפיד במחיר פתיחה ${formatCoin(openingPrice)} DRIPCOIN.`);
      toast.success('העלאה בוצעה והנכס נוסף לפיד החדש.');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      if (HAS_SUPABASE_CONFIG) {
        const { error } = await supabase.from('feed_assets').insert(rowFromAsset(created));
        if (error) {
          setSupabaseState('לוקאלי');
          toast('הנכס נשמר מקומית. נדרשת טבלת feed_assets ב-Supabase להעלאה מלאה.');
        } else {
          setSupabaseState('מחובר');
        }
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const onBack = () => {
    const assetId = activeAsset?.id;
    if (!assetId || !activeAsset) return;
    const actionCost = getBackCost(activeAsset);
    if (wallet < actionCost) {
      toast.error('אין מספיק DRIPCOIN לפעולת גיבוי מוקדם.');
      return;
    }

    setWallet((prev) => prev - actionCost);
    setAssets((prevAssets) =>
      prevAssets.map((item) => {
        if (item.id !== assetId) return item;
        const foundingLedger: FoundingLedger = {
          ...item.foundingLedger,
          [USER_ID]: (item.foundingLedger[USER_ID] ?? 0) + actionCost,
        };
        const foundingPool = item.foundingPool + actionCost;
        const foundingBackers = Object.keys(foundingLedger).length;
        const heatBoost = 1 + item.hypeLevel * 0.28 + item.viralScore / 180;
        const stakePrice = Math.round(item.stakePrice + actionCost * heatBoost + 4);
        return normalizeAsset({
          ...item,
          foundingLedger,
          foundingPool,
          foundingBackers,
          stakePrice,
          shareCount: item.shareCount + Math.round(2 + Math.random() * 12),
          watchMinutes: item.watchMinutes + Math.round(item.viewersLive / 120),
        });
      }),
    );

    setEventLine(`בוצע גיבוי: ${formatCoin(actionCost)} DRIPCOIN נכנסו לבריכת המייסדים.`);
    toast.success(`הגיבוי ננעל ב-${formatCoin(actionCost)} DRIPCOIN`);
  };

  const onClaim = () => {
    const assetId = activeAsset?.id;
    if (!assetId || !activeAsset) return;

    const claimPrice = Math.round(activeAsset.stakePrice);
    if (wallet < claimPrice) {
      toast.error('אין מספיק DRIPCOIN לפעולת השתלטות.');
      return;
    }

    const totalLedger = sumLedger(activeAsset.foundingLedger);
    const myStake = activeAsset.foundingLedger[USER_ID] ?? 0;
    const dividendPool = Math.round(claimPrice * DIVIDEND_RATE);
    const myDividend = totalLedger > 0 ? Math.round(dividendPool * (myStake / totalLedger)) : 0;
    const shockwave = Math.round(activeAsset.viewersLive * (0.011 + activeAsset.viralScore / 10000));

    setWallet((prev) => prev - claimPrice + myDividend + shockwave);
    setLifetimeDividends((prev) => prev + myDividend);
    setShockwaveAirdrops((prev) => prev + shockwave);
    setAssets((prevAssets) =>
      prevAssets.map((item) => {
        if (item.id !== assetId) return item;
        const surge = 1.07 + item.hypeLevel * 0.31 + item.transferVelocity / 360;
        const stakePrice = Math.round(item.stakePrice * surge + Math.sqrt(item.viewersLive));
        const viewersLive = clamp(item.viewersLive + Math.round(Math.random() * 700), 320, 24000);
        const totalClaims = item.totalClaims + 1;
        const claimVolume = item.claimVolume + claimPrice;
        const averageClaimPrice = claimVolume / totalClaims;

        return normalizeAsset({
          ...item,
          stakePrice,
          viewersLive,
          totalClaims,
          claimVolume,
          averageClaimPrice,
          currentOwner: 'את/ה',
          shareCount: item.shareCount + Math.round(24 + Math.random() * 90),
          watchMinutes: item.watchMinutes + Math.round(item.viewersLive / 60),
          foundingPool: 0,
          foundingBackers: 0,
          foundingLedger: {},
        });
      }),
    );

    setEventLine(
      `השתלטות הושלמה: דיבידנד אישי ${formatCoin(myDividend)} DRIPCOIN + גל הדף ${formatCoin(shockwave)} DRIPCOIN.`,
    );
    toast.success(`התקבלו ${formatCoin(myDividend + shockwave)} DRIPCOIN חזרה לארנק.`);
  };

  const onShare = () => {
    const assetId = activeAsset?.id;
    if (!assetId || !activeAsset) return;
    setAssets((prevAssets) =>
      prevAssets.map((item) =>
        item.id === assetId
          ? normalizeAsset({
              ...item,
              shareCount: item.shareCount + Math.round(24 + Math.random() * 64),
              watchMinutes: item.watchMinutes + Math.round(120 + Math.random() * 380),
            })
          : item,
      ),
    );
    setEventLine(`בוצע שיתוף: ${activeAsset.title} קיבל דחיפה ויראלית.`);
    toast.success('השיתוף בוצע בהצלחה.');
  };

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    setChatLog((prev) => [`את/ה: ${chatInput.trim()}`, ...prev].slice(0, 30));
    setChatInput('');
  };

  const filteredUsers = useMemo(
    () => SAMPLE_USERS.filter((user) => user.includes(userSearch.trim())),
    [userSearch],
  );

  const sideActions = useMemo(
    () => [
      { key: 'share', label: 'שיתוף', icon: '↗', onClick: onShare },
      { key: 'powers', label: 'כוחות', icon: '⚡', onClick: () => setActivePanel('powers') },
      { key: 'rewards', label: 'פרסים', icon: '🏆', onClick: () => setActivePanel('rewards') },
      { key: 'market', label: 'נתונים', icon: '📊', onClick: () => setMarketDataOpen(true) },
    ],
    [onShare],
  );

  const renderPanelContent = () => {
    if (!activePanel) return null;
    switch (activePanel) {
      case 'profile':
        return (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="holo-panel rounded-2xl p-3">
              <p className="text-xs text-[#E0E0E0]/60">יתרת ארנק</p>
              <p className="biolume-number mt-1 text-xl font-semibold text-white">{formatCoin(wallet)} DRIPCOIN</p>
            </div>
            <div className="holo-panel rounded-2xl p-3">
              <p className="text-xs text-[#E0E0E0]/60">דיבידנדים מצטברים</p>
              <p className="biolume-number mt-1 text-xl font-semibold text-white">
                {formatCoin(lifetimeDividends)} DRIPCOIN
              </p>
            </div>
            <div className="holo-panel rounded-2xl p-3">
              <p className="text-xs text-[#E0E0E0]/60">איירדרופ מצטבר</p>
              <p className="biolume-number mt-1 text-xl font-semibold text-white">
                {formatCoin(shockwaveAirdrops)} DRIPCOIN
              </p>
            </div>
            <div className="holo-panel rounded-2xl p-3 md:col-span-3">
              <h3 className="text-sm font-semibold text-white">הישגים פעילים</h3>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/85">
                  שליטה חכמה: 12 עסקאות רווחיות ברצף
                </p>
                <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/85">
                  יוצר חם: 4 העלאות נכנסו לטופ החם
                </p>
                <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/85">
                  מייסד זהב: תרומה מצטברת גבוהה לבריכות
                </p>
                <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/85">
                  צייד טרנדים: זיהוי מוקדם של 9 פיצוצים
                </p>
              </div>
            </div>
          </div>
        );
      case 'store':
        return (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {STORE_ITEMS.map((item) => (
              <div key={item.id} className="holo-panel rounded-2xl p-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-[#E0E0E0]/70">מחיר: {formatCoin(item.price)} DRIPCOIN</p>
                <button
                  type="button"
                  onClick={() => {
                    if (wallet < item.price) {
                      toast.error('אין מספיק DRIPCOIN לרכישה.');
                      return;
                    }
                    setWallet((prev) => prev - item.price);
                    toast.success('הרכישה בוצעה בהצלחה.');
                  }}
                  className="mt-3 rounded-xl border border-[#CCFF00]/35 bg-[#CCFF00]/15 px-3 py-2 text-xs font-semibold text-[#E8FF9A]"
                >
                  קנייה מהירה
                </button>
              </div>
            ))}
          </div>
        );
      case 'powers':
        return (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {POWERS.map((power) => (
              <div key={power.id} className="holo-panel rounded-2xl p-3">
                <p className="text-sm font-semibold text-white">{power.name}</p>
                <p className="mt-1 text-xs text-[#E0E0E0]/70">
                  השפעה: +{power.impact}% · מחיר: {formatCoin(power.price)} DRIPCOIN
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (wallet < power.price) {
                      toast.error('אין מספיק DRIPCOIN להפעלת כוח.');
                      return;
                    }
                    setWallet((prev) => prev - power.price);
                    setEventLine(`כוח הופעל: ${power.name}. הייפ עולה.`);
                    toast.success('הכוח הופעל בהצלחה.');
                  }}
                  className="mt-2 rounded-xl border border-[#FF007F]/35 bg-[#FF007F]/16 px-3 py-1.5 text-xs font-semibold text-[#FFD3EA]"
                >
                  הפעלה
                </button>
              </div>
            ))}
          </div>
        );
      case 'rewards':
        return (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {REWARDS.map((reward) => (
              <div key={reward.id} className="holo-panel rounded-2xl p-3">
                <p className="text-sm font-semibold text-white">{reward.name}</p>
                <p className="mt-1 text-xs text-[#E0E0E0]/70">
                  דרישת תביעות: {reward.requiredClaims} · בונוס: {formatCoin(reward.bonus)} DRIPCOIN
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWallet((prev) => prev + reward.bonus);
                    toast.success('הפרס נוסף לארנק.');
                  }}
                  className="mt-2 rounded-xl border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold text-[#E0E0E0]"
                >
                  מימוש פרס
                </button>
              </div>
            ))}
          </div>
        );
      case 'chat':
        return (
          <div className="flex h-full flex-col gap-3">
            <form onSubmit={submitChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                className="flex-1 rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
                placeholder="כתבו הודעה לחדר הצ׳אט..."
              />
              <button
                type="submit"
                className="rounded-2xl border border-[#CCFF00]/35 bg-[#CCFF00]/16 px-4 py-2 text-xs font-semibold text-[#E8FF9A]"
              >
                שליחה
              </button>
            </form>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {chatLog.map((line, idx) => (
                <p key={`${line}-${idx}`} className="holo-panel rounded-xl px-3 py-2 text-xs text-[#E0E0E0]/90">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-2">
            {[
              'מערכת: העסקה האחרונה נסגרה בהצלחה.',
              'צוות שוק: פתח/י חדר מלחמה לניטור בזמן אמת.',
              'התראה: נכס שלך נכנס לקטגוריית החם.',
              'קהילה: קיבלת 3 עוקבים חדשים.',
            ].map((msg) => (
              <div key={msg} className="holo-panel rounded-xl px-3 py-2 text-xs text-[#E0E0E0]/90">
                {msg}
              </div>
            ))}
          </div>
        );
      case 'warroom':
        return (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="holo-panel rounded-2xl p-3">
              <p className="text-xs text-[#E0E0E0]/60">יעד יומי</p>
              <p className="mt-1 text-lg font-semibold text-white">+15% צמיחת ארנק</p>
              <p className="mt-2 text-xs text-[#E0E0E0]/75">
                התמקדות בנכסים עם הייפ מעל 70% ונטייה לעליית תביעות.
              </p>
            </div>
            <div className="holo-panel rounded-2xl p-3">
              <p className="text-xs text-[#E0E0E0]/60">פקודות חמות</p>
              <div className="mt-2 space-y-2 text-xs text-[#E0E0E0]/82">
                <p>• חיזוק נכס מוביל עם כוח מהיר.</p>
                <p>• בדיקת טרנד חדש בלשונית חדש.</p>
                <p>• סריקת בעלים על פי פעילות קהילה.</p>
              </div>
            </div>
            <div className="holo-panel rounded-2xl p-3 md:col-span-2">
              <p className="text-sm font-semibold text-white">רשימת תעדוף חמה</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {displayedAssets.slice(0, 6).map((asset, idx) => (
                  <p key={asset.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/90">
                    #{idx + 1} {asset.title} · הייפ {Math.round(asset.hypeLevel * 100)}% · מחיר {formatCoin(asset.stakePrice)} DRIPCOIN
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="space-y-3">
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
              placeholder="חיפוש משתמשים..."
            />
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredUsers.map((user) => (
                <div key={user} className="holo-panel rounded-xl px-3 py-2">
                  <p className="text-sm font-semibold text-white">{user}</p>
                  <p className="mt-1 text-xs text-[#E0E0E0]/72">נכסים חמים: {2 + (user.length % 6)}</p>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-[#E0E0E0]/70">לא נמצאו משתמשים לחיפוש הנוכחי.</p>
              )}
            </div>
          </div>
        );
      case 'upload':
        return (
          <form onSubmit={submitNewAsset} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
                placeholder="כותרת הנכס"
              />
              <input
                value={draftCreator}
                onChange={(event) => setDraftCreator(event.target.value)}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
                placeholder="שם היוצר"
              />
            </div>
            <textarea
              value={draftSummary}
              onChange={(event) => setDraftSummary(event.target.value)}
              rows={2}
              className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
              placeholder="תיאור קצר שמושך צפייה והשתלטויות"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={draftMediaKind}
                onChange={(event) => setDraftMediaKind(event.target.value as MediaKind)}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="video">וידאו</option>
                <option value="image">תמונה</option>
              </select>
              <input
                value={draftOpeningPrice}
                onChange={(event) => setDraftOpeningPrice(event.target.value)}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                placeholder="מחיר פתיחה ב-DRIPCOIN"
                inputMode="numeric"
              />
              <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/80">
                <button
                  type="button"
                  onClick={() => setDraftInputMode('url')}
                  className={`rounded-xl px-2 py-1 ${draftInputMode === 'url' ? 'border border-[#CCFF00]/35 bg-[#CCFF00]/16 text-[#E8FF9A]' : ''}`}
                >
                  קישור
                </button>
                <button
                  type="button"
                  onClick={() => setDraftInputMode('file')}
                  className={`rounded-xl px-2 py-1 ${draftInputMode === 'file' ? 'border border-[#CCFF00]/35 bg-[#CCFF00]/16 text-[#E8FF9A]' : ''}`}
                >
                  קובץ
                </button>
              </div>
            </div>

            {draftInputMode === 'url' ? (
              <input
                value={draftMediaUrl}
                onChange={(event) => {
                  setDraftMediaUrl(event.target.value);
                  setDraftPreviewUrl(event.target.value.trim());
                }}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/40"
                placeholder="קישור ישיר לתמונה או וידאו"
              />
            ) : (
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setDraftFile(file);
                  if (draftPreviewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(draftPreviewUrl);
                  }
                  if (!file) {
                    setDraftPreviewUrl('');
                    return;
                  }
                  const preview = URL.createObjectURL(file);
                  setDraftPreviewUrl(preview);
                  if (file.type.startsWith('image')) setDraftMediaKind('image');
                  if (file.type.startsWith('video')) setDraftMediaKind('video');
                }}
                className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none file:rounded-xl file:border-0 file:bg-[#CCFF00]/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#E8FF9A]"
              />
            )}

            {draftPreviewUrl && (
              <div className="holo-panel rounded-2xl p-2">
                {draftMediaKind === 'video' ? (
                  <video src={draftPreviewUrl} className="h-52 w-full rounded-xl object-cover" muted playsInline loop autoPlay />
                ) : (
                  <img src={draftPreviewUrl} alt="תצוגה מקדימה" className="h-52 w-full rounded-xl object-cover" />
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPublishing}
                className="rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/20 px-4 py-2 text-sm font-semibold text-[#FFD3EA] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPublishing ? 'מעלה עכשיו...' : 'העלאה לפיד החדש'}
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <section
      className="relative h-[100dvh] w-full"
      onPointerMove={(event) => updateShimmer(event.clientX, event.clientY)}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (touch) updateShimmer(touch.clientX, touch.clientY);
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-4 md:p-6">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]/90">
              {eventLine}
            </div>
            <div className="flex items-center gap-2">
              <span className="holo-panel rounded-2xl px-3 py-2 text-[11px] text-[#E0E0E0]/80">
                מצב נתונים: {supabaseState}
              </span>
              <div className="holo-panel flex items-center gap-1 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setFeedMode('new')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${feedMode === 'new' ? 'border border-[#CCFF00]/40 bg-[#CCFF00]/18 text-[#E8FF9A]' : 'text-[#E0E0E0]/75'}`}
                >
                  חדש
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode('hot')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${feedMode === 'hot' ? 'border border-[#FF007F]/40 bg-[#FF007F]/18 text-[#FFD3EA]' : 'text-[#E0E0E0]/75'}`}
                >
                  חם
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="aether-scroll">
        {displayedAssets.map((asset, index) => (
          <article
            key={asset.id}
            data-feed-card
            data-index={index}
            data-asset-id={asset.id}
            className="aether-snap relative h-[100dvh] w-full"
            onClick={() => {
              void toggleAssetPlayback(asset.id);
            }}
          >
            <div className="absolute inset-0">
              {asset.mediaKind === 'video' ? (
                <video
                  ref={(node) => {
                    videoRefs.current[asset.id] = node;
                  }}
                  className="h-full w-full object-cover"
                  src={asset.mediaUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(event) => onVideoMetadataLoaded(asset.id, event.currentTarget)}
                  onTimeUpdate={(event) => onVideoTimeUpdate(asset.id, event.currentTarget)}
                />
              ) : (
                <img src={asset.mediaUrl} alt={asset.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div
              className="pointer-events-none absolute inset-0 opacity-85"
              style={{
                background: `linear-gradient(180deg, rgba(1,1,20,0.35) 0%, rgba(1,1,20,0.08) 28%, rgba(1,1,20,0.75) 100%), radial-gradient(circle at ${index % 2 === 0 ? '18%' : '78%'} 26%, ${asset.paletteB}4D, transparent 48%), radial-gradient(circle at ${index % 2 === 0 ? '82%' : '12%'} 78%, ${asset.paletteA}70, transparent 56%)`,
              }}
            />

            <AnimatePresence>
              {pausedOverlayAssetId === asset.id && (
                <motion.div
                  key={`${asset.id}-${pausedOverlayTick}`}
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="holo-panel rounded-full px-4 py-3 text-2xl font-semibold text-white"
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 0.92, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.08 }}
                    transition={{ duration: 0.24 }}
                  >
                    ▶
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between p-4 md:p-8"
              initial={{ opacity: 0.7, scale: 0.995 }}
              animate={{ opacity: activeAsset?.id === asset.id ? 1 : 0.82, scale: activeAsset?.id === asset.id ? 1 : 0.996 }}
              transition={{ type: 'spring', stiffness: 120, damping: 21, mass: 0.9 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]/90">
                  #{index + 1} · {feedMode === 'new' ? 'חדש' : 'חם'} · {formatTimeAgo(asset.createdAt)}
                </div>
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]">
                  הייפ {Math.round(asset.hypeLevel * 100)}% · מגמה {asset.trendScore}
                </div>
              </div>
              <div className="mb-44 max-w-md">
                <div className="holo-panel rounded-3xl p-3 md:p-4">
                  <h1 className="kinetic-text text-xl font-semibold text-white md:text-3xl">{asset.title}</h1>
                  <p className="mt-1 text-xs text-[#E0E0E0]/80 md:text-sm">{asset.summary}</p>
                  <p className="mt-1 text-[11px] text-[#E0E0E0]/65">יוצר: {asset.creator}</p>
                </div>
              </div>
            </motion.div>
          </article>
        ))}
      </div>

      <div
        className={`pointer-events-none absolute bottom-[13.5rem] z-40 ${isRtl ? 'left-4 md:left-6' : 'right-4 md:right-6'}`}
      >
        <div className="pointer-events-auto flex flex-col gap-4">
          {sideActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className="holo-panel flex min-w-[3.8rem] flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/20 px-2 py-2 text-[10px] font-semibold text-[#E0E0E0]"
            >
              <span className="text-sm leading-none">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeAsset && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 px-4 md:px-8">
          <div className="mx-auto w-full max-w-5xl">
            {activeAsset.mediaKind === 'video' && (
              <div className="pointer-events-auto mb-3">
                <div
                  ref={scrubberRef}
                  onPointerDown={onScrubberPointerDown}
                  className="holo-panel relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full border border-white/15 bg-black/20"
                >
                  <div
                    className="absolute inset-0 bg-[#CCFF00]/70"
                    style={{
                      transform: `scaleX(${activeVideoRatio})`,
                      transformOrigin: isRtl ? 'right center' : 'left center',
                    }}
                  />
                </div>
              </div>
            )}

            <StakeDesk
              asset={activeAsset}
              wallet={wallet}
              myFoundingStake={myFoundingStake}
              myProjectedDividend={myProjectedDividend}
              onBack={onBack}
              onClaim={onClaim}
              backCost={backCost}
              canBack={canBack}
              canClaim={canClaim}
            />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-50 px-4 md:px-8">
        <div className="pointer-events-auto mx-auto w-full max-w-5xl">
          <div className="holo-panel rounded-2xl border border-white/15 bg-black/28 p-2">
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-9">
              {PANEL_LABELS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setActivePanel(entry.key)}
                  className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/25 px-1 py-2 text-[10px] font-semibold text-[#E0E0E0] transition hover:border-white/20"
                >
                  <span className="text-sm leading-none">{entry.icon}</span>
                  <span className="mt-1">{entry.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {marketDataOpen && activeAsset && (
          <FullscreenPanel
            title="מרכז נתוני שוק מלא"
            subtitle="כל מדדי הנכס והמסחר במסך מלא"
            onClose={() => setMarketDataOpen(false)}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['מחיר נוכחי', `${formatCoin(activeAsset.stakePrice)} DRIPCOIN`],
                ['מחיר פתיחה', `${formatCoin(activeAsset.openingPrice)} DRIPCOIN`],
                ['בעלים נוכחי', activeAsset.currentOwner],
                ['יתרת ארנק', `${formatCoin(wallet)} DRIPCOIN`],
                ['צופים חיים', formatCoin(activeAsset.viewersLive)],
                ['הייפ', `${Math.round(activeAsset.hypeLevel * 100)}%`],
                ['תביעות מצטברות', String(activeAsset.totalClaims)],
                ['מחיר תביעה ממוצע', `${formatCoin(activeAsset.averageClaimPrice)} DRIPCOIN`],
                ['שיתופים', formatCoin(activeAsset.shareCount)],
                ['נפח תביעות', `${formatCoin(activeAsset.claimVolume)} DRIPCOIN`],
                ['דקות צפייה', formatCoin(activeAsset.watchMinutes)],
                ['ציון ויראליות', `${activeAsset.viralScore}%`],
                ['מהירות מעבר', `${activeAsset.transferVelocity}%`],
                ['ציון שיווקיות', `${activeAsset.marketingScore}%`],
                ['ציון מגמה', String(activeAsset.trendScore)],
                ['דיבידנד חזוי', `${formatCoin(myProjectedDividend)} DRIPCOIN`],
              ].map(([label, value]) => (
                <div key={label} className="holo-panel rounded-2xl p-3">
                  <p className="text-xs text-[#E0E0E0]/60">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </FullscreenPanel>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel && (
          <FullscreenPanel
            title={PANEL_LABELS.find((entry) => entry.key === activePanel)?.label ?? 'מודול'}
            subtitle="מסך מלא לניהול מהיר"
            onClose={() => setActivePanel(null)}
          >
            {renderPanelContent()}
          </FullscreenPanel>
        )}
      </AnimatePresence>
    </section>
  );
}
