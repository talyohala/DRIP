import { motion } from 'framer-motion';
import {
  ChevronDown,
  FastForward,
  Menu,
  Pause,
  Play,
  Rewind,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import PowerStore, { type PowerItem } from './PowerStore';
import ProfilePanel, { type ProfileMediaItem, type ProfileState } from './ProfilePanel';
import SettingsPanel, { type AppPrefs } from './SettingsPanel';
import StakeDesk, { type AssetDeskModel } from './StakeDesk';
import UploadPanel, { type MediaKind, type PlatformName, type UploadDraft } from './UploadPanel';
import WalletPanel from './WalletPanel';
import { supabase } from '../supabase';

type FoundingLedger = Record<string, number>;
type DockPanel = 'upload' | 'store' | 'profile' | 'settings' | 'wallet' | null;

type FeedAsset = AssetDeskModel & {
  summary: string;
  mediaKind: MediaKind;
  mediaUrl: string;
  sourceLink?: string;
  platform: PlatformName;
  paletteA: string;
  paletteB: string;
  foundingLedger: FoundingLedger;
  shareCount: number;
  claimVolume: number;
  watchMinutes: number;
  createdAt: number;
  uploaderCountry: string;
  uploaderId: string;
};

const USER_ID = 'local-player';
const BASE_BACK_COST = 10;
const DIVIDEND_RATE = 0.1;
const MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET ?? 'drip_media';
const ASSETS_BUCKET = import.meta.env.VITE_SUPABASE_ASSETS_BUCKET ?? 'drip_assets';

const PALETTES: Array<[string, string]> = [
  ['#4B0CA3', '#FF007F'],
  ['#10002B', '#CCFF00'],
  ['#010114', '#E0E0E0'],
  ['#240046', '#FF007F'],
  ['#03071E', '#CCFF00'],
];

const POWER_NAMES = [
  'פולס ניאון',
  'גל סינדיקט',
  'הרמת רצפה',
  'פריצה ויראלית',
  'הדף שיתוף',
  'הכפלת חשיפה',
  'האצת טרנד',
  'הזרמת קונים',
  'נעילת מומנטום',
  'אפקט פרפר',
  'חסימת מתחרים',
  'זינוק מדד',
  'שיגור לייב',
  'חדירת פיד',
  'האצת צפייה',
  'טריגר קהילה',
  'בועת פומו',
  'קפיצת מחיר',
  'ריכוז הייפ',
  'הדלקת קהל',
  'מכפיל מדיה',
  'גל קונים',
  'אחיזת שוק',
  'חדות מותג',
];

const REWARD_NAMES = [
  'תיבת יהלום',
  'תיבת פלזמה',
  'תיבת כספית',
  'בונוס יומי',
  'מענק קהילה',
  'פרס גלישה',
  'קאשבק מהיר',
  'ניצוץ מטבעות',
  'גשם DRIPCOIN',
  'מזל שוק',
  'בוסט ארנק',
  'רווח פתע',
  'קפסולת רווח',
  'פרס מייסדים',
  'פרס טרנד',
  'מענק תבע',
  'מענק גבה',
  'פרס דרגה',
  'בונוס לילה',
  'בונוס השקה',
];

const storeItems: PowerItem[] = [
  ...POWER_NAMES.map((name, index) => ({
    id: `power-${index + 1}`,
    name,
    effect: 'השפעה ישירה על הנכס הפעיל',
    price: 90 + index * 26,
    kind: 'power' as const,
    tier: index < 4 ? 'S' : index < 10 ? 'A' : index < 18 ? 'B' : 'C',
  })),
  ...REWARD_NAMES.map((name, index) => ({
    id: `reward-${index + 1}`,
    name,
    effect: 'רווחים לארנק ברגע איסוף',
    price: 80 + index * 22,
    kind: 'reward' as const,
    tier: index < 3 ? 'S' : index < 8 ? 'A' : index < 14 ? 'B' : 'C',
  })),
];

const seedAssets: FeedAsset[] = [
  {
    id: 'pulse-1',
    title: 'אקו בתנועה',
    creator: 'סטודיו ירח',
    summary: 'פריים חי עם תאורה נוזלית',
    mediaKind: 'video',
    mediaUrl: 'https://cdn.coverr.co/videos/coverr-aerial-view-of-a-city-1579/1080p.mp4',
    platform: 'קישור',
    sourceLink: undefined,
    paletteA: '#4B0CA3',
    paletteB: '#FF007F',
    openingPrice: 520,
    stakePrice: 520,
    viewersLive: 1830,
    hypeLevel: 0.42,
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
    uploaderCountry: 'ישראל',
    uploaderId: 'seed-creator',
  },
  {
    id: 'pulse-2',
    title: 'גל צבע',
    creator: 'מיקה סינט',
    summary: 'ויזואל חד על קצב רץ',
    mediaKind: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    platform: 'קישור',
    sourceLink: undefined,
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
    uploaderCountry: 'צרפת',
    uploaderId: 'seed-creator',
  },
  {
    id: 'pulse-3',
    title: 'אופק זוהר',
    creator: 'איילה פלו',
    summary: 'טיפוגרפיה קינטית בלופ',
    mediaKind: 'video',
    mediaUrl: 'https://cdn.coverr.co/videos/coverr-fashion-model-in-neon-light-9710/1080p.mp4',
    platform: 'קישור',
    sourceLink: undefined,
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
    uploaderCountry: 'ברזיל',
    uploaderId: 'seed-creator',
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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `pulse-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const sanitizeFileName = (name: string): string => name.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
const pickPalette = (): [string, string] => PALETTES[Math.floor(Math.random() * PALETTES.length)];

const uploadFileToBucket = async (bucket: string, folder: string, file: File): Promise<string> => {
  const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default function AetherFeed() {
  const [assets, setAssets] = useState<FeedAsset[]>(() => seedAssets.map((asset) => normalizeAsset(asset)));
  const [activeIndex, setActiveIndex] = useState(0);
  const [wallet, setWallet] = useState(4800);
  const [pendingProfits, setPendingProfits] = useState(0);
  const [lifetimeDividends, setLifetimeDividends] = useState(0);
  const [shockwaveAirdrops, setShockwaveAirdrops] = useState(0);
  const [myClaims, setMyClaims] = useState(0);
  const [eventLine, setEventLine] = useState('גללו. תבעו. הגבּו.');
  const [deskCollapsed, setDeskCollapsed] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState<DockPanel>(null);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<ProfileState>({
    displayName: 'משתמש',
    house: 'בית חופשי',
    tagline: 'על הטרנד הבא',
    country: 'ישראל',
    bio: '',
    avatarUrl: '',
  });
  const [prefs, setPrefs] = useState<AppPrefs>({
    autoPlay: true,
    compactDesk: true,
    lowMotion: false,
  });
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [claimedAssetIds, setClaimedAssetIds] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (prefs.compactDesk) setDeskCollapsed(true);
  }, [prefs.compactDesk]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-feed-card]'));
    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!topEntry) return;
        const nextIndex = Number(topEntry.target.getAttribute('data-index'));
        if (!Number.isNaN(nextIndex)) setActiveIndex(nextIndex);
      },
      { root, threshold: [0.55, 0.68, 0.82] },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [assets.length]);

  useEffect(() => {
    setAssets((prevAssets) =>
      prevAssets.map((asset, idx) => {
        const migration = idx === activeIndex ? 230 : -60;
        const viewersLive = clamp(asset.viewersLive + migration, 220, 60000);
        return normalizeAsset({ ...asset, viewersLive });
      }),
    );
  }, [activeIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      let headline = '';
      setAssets((prevAssets) =>
        prevAssets.map((asset, idx) => {
          const isActive = idx === activeIndex;
          const swingFactor = prefs.lowMotion ? 0.45 : 1;
          const viewerSwing = Math.round((Math.random() - 0.45) * (isActive ? 360 : 220) * swingFactor);
          const viewersLive = clamp(asset.viewersLive + viewerSwing, 180, 60000);
          const shareBoost = Math.max(0, Math.round(viewersLive / (isActive ? 170 : 260)) + Math.round(Math.random() * 8));
          const watchMinutes = asset.watchMinutes + Math.round(viewersLive / (isActive ? 90 : 130));

          let stakePrice = clamp(
            Math.round(asset.stakePrice * (1 + (asset.hypeLevel - 0.46) * 0.007 + (isActive ? 0.0022 : 0.0009))),
            60,
            500000,
          );
          let totalClaims = asset.totalClaims;
          let claimVolume = asset.claimVolume;
          let averageClaimPrice = asset.averageClaimPrice;
          let currentOwner = asset.currentOwner;
          let shareCount = asset.shareCount + shareBoost;

          const autoClaimChance = (isActive ? 0.16 : 0.06) + asset.hypeLevel * 0.07;
          if (Math.random() < autoClaimChance) {
            const autoClaimPrice = Math.round(stakePrice * (1.02 + Math.random() * 0.1 + asset.hypeLevel * 0.05));
            totalClaims += 1;
            claimVolume += autoClaimPrice;
            averageClaimPrice = claimVolume / totalClaims;
            stakePrice = clamp(Math.round(autoClaimPrice * (1.03 + Math.random() * 0.07)), 60, 500000);
            currentOwner = `סינדיקט ${1 + Math.floor(Math.random() * 7)}`;
            shareCount += Math.round(10 + Math.random() * 36);
            if (isActive) headline = `השתלטות ${formatCoin(autoClaimPrice)} DRIPCOIN`;
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
      if (headline) setEventLine(headline);
    }, prefs.lowMotion ? 3200 : 2400);

    return () => window.clearInterval(interval);
  }, [activeIndex, prefs.lowMotion]);

  const activeAsset = assets[activeIndex] ?? assets[0];
  const activeLedgerTotal = activeAsset ? sumLedger(activeAsset.foundingLedger) : 0;
  const myFoundingStake = activeAsset?.foundingLedger[USER_ID] ?? 0;
  const backCost = activeAsset ? getBackCost(activeAsset) : BASE_BACK_COST;
  const myProjectedDividend = useMemo(() => {
    if (!activeAsset || myFoundingStake <= 0 || activeLedgerTotal <= 0) return 0;
    return Math.round(activeAsset.stakePrice * DIVIDEND_RATE * (myFoundingStake / activeLedgerTotal));
  }, [activeAsset, myFoundingStake, activeLedgerTotal]);
  const canBack = wallet >= backCost;
  const canClaim = wallet >= (activeAsset?.stakePrice ?? Number.MAX_SAFE_INTEGER);

  const uploadedMedia = useMemo<ProfileMediaItem[]>(
    () =>
      assets
        .filter((asset) => uploadedAssetIds.includes(asset.id))
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          mediaUrl: asset.mediaUrl,
          country: asset.uploaderCountry,
          mediaKind: asset.mediaKind,
        })),
    [assets, uploadedAssetIds],
  );

  const claimedMedia = useMemo<ProfileMediaItem[]>(
    () =>
      assets
        .filter((asset) => claimedAssetIds.includes(asset.id))
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          mediaUrl: asset.mediaUrl,
          country: asset.uploaderCountry,
          mediaKind: asset.mediaKind,
        })),
    [assets, claimedAssetIds],
  );

  const activeVideo = activeAsset?.mediaKind === 'video' ? videoRefs.current[activeAsset.id] : null;

  useEffect(() => {
    const id = activeAsset?.id;
    Object.entries(videoRefs.current).forEach(([assetId, video]) => {
      if (!video) return;
      if (assetId !== id) {
        video.pause();
        return;
      }
      video.muted = isMuted;
      if (activeAsset?.mediaKind !== 'video') return;
      if (!prefs.autoPlay && !isPlaying) {
        video.pause();
        return;
      }
      if (isPlaying || prefs.autoPlay) {
        void video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          void video.play().catch(() => undefined);
        });
      } else {
        video.pause();
      }
    });
  }, [activeAsset?.id, activeAsset?.mediaKind, isMuted, isPlaying, prefs.autoPlay]);

  useEffect(() => {
    const video = activeVideo;
    if (!video) {
      setVideoProgress(0);
      setVideoDuration(0);
      return;
    }
    const onTime = () => {
      setVideoProgress(video.currentTime || 0);
      setVideoDuration(video.duration || 0);
      setIsPlaying(!video.paused);
    };
    onTime();
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onTime);
    video.addEventListener('play', onTime);
    video.addEventListener('pause', onTime);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onTime);
      video.removeEventListener('play', onTime);
      video.removeEventListener('pause', onTime);
    };
  }, [activeVideo, activeAsset?.id]);

  const updateShimmer = (clientX: number, clientY: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;
    root.style.setProperty('--mx', `${clamp(x, 0, 100)}%`);
    root.style.setProperty('--my', `${clamp(y, 0, 100)}%`);
  };

  const toLocalObjectUrl = (file: File): string => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };

  const openPanel = (panel: DockPanel) => {
    setPanelOpen(panel);
    setMenuOpen(false);
  };

  const closePanel = () => setPanelOpen(null);

  const onUploadSubmit = async (draft: UploadDraft) => {
    const [paletteA, paletteB] = pickPalette();
    let mediaUrl = draft.mediaUrl;
    let mediaKind = draft.mediaKind;
    let platform = draft.platform;
    let sourceLink = draft.sourceLink;

    if (draft.file) {
      mediaKind = draft.file.type.startsWith('video/') ? 'video' : 'image';
      platform = 'גלריה';
      sourceLink = undefined;
      try {
        mediaUrl = await uploadFileToBucket(MEDIA_BUCKET, 'uploads', draft.file);
      } catch {
        mediaUrl = toLocalObjectUrl(draft.file);
        toast.error('העלאה לשרת נכשלה. נשמר מקומי');
      }
    }

    const id = createAssetId();
    const created = normalizeAsset({
      id,
      title: draft.title,
      creator: draft.creator,
      summary: draft.summary,
      mediaKind,
      mediaUrl,
      sourceLink,
      platform,
      paletteA,
      paletteB,
      openingPrice: draft.openingPrice,
      stakePrice: draft.openingPrice,
      viewersLive: 240 + Math.round(Math.random() * 500),
      hypeLevel: 0.12,
      foundingPool: 0,
      foundingBackers: 0,
      totalClaims: 0,
      averageClaimPrice: draft.openingPrice,
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
      uploaderCountry: profile.country,
      uploaderId: USER_ID,
    });

    setAssets((prev) => [created, ...prev]);
    setUploadedAssetIds((prev) => [id, ...prev.filter((item) => item !== id)]);
    setActiveIndex(0);
    closePanel();
    setEventLine(`הנפקה ${formatCoin(draft.openingPrice)} DRIPCOIN`);
    toast.success('נכס חדש בפיד');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onUploadAvatar = async (file: File) => {
    try {
      const avatarUrl = await uploadFileToBucket(ASSETS_BUCKET, 'avatars', file);
      setProfile((prev) => ({ ...prev, avatarUrl }));
      toast.success('תמונת פרופיל עודכנה');
    } catch {
      const localUrl = toLocalObjectUrl(file);
      setProfile((prev) => ({ ...prev, avatarUrl: localUrl }));
      toast.error('העלאה לשרת נכשלה. נשמר מקומי');
    }
  };

  const onBack = () => {
    const asset = assets[activeIndex];
    if (!asset) return;
    const actionCost = getBackCost(asset);
    if (wallet < actionCost) {
      toast.error('אין מספיק DRIPCOIN');
      return;
    }

    setWallet((prev) => prev - actionCost);
    setAssets((prevAssets) =>
      prevAssets.map((item, idx) => {
        if (idx !== activeIndex) return item;
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
    setEventLine(`גבה ${formatCoin(actionCost)} DRIPCOIN`);
  };

  const onClaim = () => {
    const asset = assets[activeIndex];
    if (!asset) return;
    const claimPrice = Math.round(asset.stakePrice);
    if (wallet < claimPrice) {
      toast.error('אין מספיק DRIPCOIN');
      return;
    }

    const totalLedger = sumLedger(asset.foundingLedger);
    const myStake = asset.foundingLedger[USER_ID] ?? 0;
    const dividendPool = Math.round(claimPrice * DIVIDEND_RATE);
    const myDividend = totalLedger > 0 ? Math.round(dividendPool * (myStake / totalLedger)) : 0;
    const shockwave = Math.round(asset.viewersLive * (0.011 + asset.viralScore / 10000));
    const profitPack = myDividend + shockwave;

    setWallet((prev) => prev - claimPrice);
    setPendingProfits((prev) => prev + profitPack);
    setLifetimeDividends((prev) => prev + myDividend);
    setShockwaveAirdrops((prev) => prev + shockwave);
    setMyClaims((prev) => prev + 1);
    setClaimedAssetIds((prev) => [asset.id, ...prev.filter((id) => id !== asset.id)]);

    setAssets((prevAssets) =>
      prevAssets.map((item, idx) => {
        if (idx !== activeIndex) return item;
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
          currentOwner: profile.displayName,
          shareCount: item.shareCount + Math.round(24 + Math.random() * 90),
          watchMinutes: item.watchMinutes + Math.round(item.viewersLive / 60),
          foundingPool: 0,
          foundingBackers: 0,
          foundingLedger: {},
        });
      }),
    );

    setEventLine(`תבע ${formatCoin(claimPrice)} · לרווח ${formatCoin(profitPack)}`);
  };

  const onBuyStoreItem = (id: string) => {
    const asset = assets[activeIndex];
    const item = storeItems.find((entry) => entry.id === id);
    if (!asset || !item) return;
    if (wallet < item.price) {
      toast.error('יתרה נמוכה');
      return;
    }

    setWallet((prev) => prev - item.price);
    setInventory((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));

    if (item.kind === 'reward') {
      const rewardBoost = item.tier === 'S' ? 2.5 : item.tier === 'A' ? 2 : item.tier === 'B' ? 1.7 : 1.35;
      const reward = Math.round(item.price * rewardBoost);
      setPendingProfits((prev) => prev + reward);
      setEventLine(`פרס ${item.name} · ${formatCoin(reward)} DRIPCOIN`);
      setPanelOpen(null);
      return;
    }

    const powerBoost = item.tier === 'S' ? 1.14 : item.tier === 'A' ? 1.1 : item.tier === 'B' ? 1.07 : 1.05;
    const viewerBoost = item.tier === 'S' ? 880 : item.tier === 'A' ? 640 : item.tier === 'B' ? 470 : 320;
    const shareBoost = item.tier === 'S' ? 180 : item.tier === 'A' ? 130 : item.tier === 'B' ? 90 : 65;
    const claimBoost = item.tier === 'S' ? 3 : item.tier === 'A' ? 2 : 1;

    setAssets((prevAssets) =>
      prevAssets.map((entry, idx) => {
        if (idx !== activeIndex) return entry;
        const totalClaims = entry.totalClaims + claimBoost;
        const claimVolume = entry.claimVolume + Math.round(entry.stakePrice * claimBoost);
        return normalizeAsset({
          ...entry,
          stakePrice: Math.round(entry.stakePrice * powerBoost),
          viewersLive: clamp(entry.viewersLive + viewerBoost, 180, 60000),
          shareCount: entry.shareCount + shareBoost,
          watchMinutes: entry.watchMinutes + Math.round(viewerBoost * 0.7),
          totalClaims,
          claimVolume,
          averageClaimPrice: claimVolume / totalClaims,
          currentOwner: profile.house || profile.displayName,
        });
      }),
    );
    setEventLine(`כוח ${item.name} הופעל`);
    setPanelOpen(null);
  };

  const onCollectProfits = () => {
    if (pendingProfits <= 0) {
      toast.error('אין רווחים לאיסוף');
      return;
    }
    setWallet((prev) => prev + pendingProfits);
    setEventLine(`נאספו ${formatCoin(pendingProfits)} DRIPCOIN`);
    setPendingProfits(0);
  };

  const onResetMarket = () => {
    setAssets(seedAssets.map((asset) => normalizeAsset(asset)));
    setActiveIndex(0);
    setEventLine('השוק אופס');
    closePanel();
  };

  const togglePlay = () => {
    const video = activeVideo;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds: number) => {
    const video = activeVideo;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const nextTime = clamp(video.currentTime + seconds, 0, duration || video.currentTime + seconds);
    video.currentTime = nextTime;
    setVideoProgress(nextTime);
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
      {menuOpen && panelOpen === null && <button type="button" aria-label="close menu" className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)} />}

      <div className="pointer-events-none absolute left-3 top-3 z-[60]">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="holo-panel flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-white"
          >
            <Menu size={16} />
            פעולות
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <div className="holo-panel mt-2 w-44 rounded-2xl p-1.5 text-xs">
              {[
                ['upload', 'העלאה'],
                ['store', 'חנות'],
                ['profile', 'פרופיל'],
                ['wallet', 'ארנק'],
                ['settings', 'הגדרות'],
              ].map(([panel, label]) => (
                <button
                  key={panel}
                  type="button"
                  onClick={() => openPanel(panel as DockPanel)}
                  className="mb-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right text-white/90 last:mb-0"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-[60]">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="holo-panel rounded-2xl px-3 py-1.5 text-xs text-white/90">
            יתרה {formatCoin(wallet)} DRIPCOIN
          </div>
          <div className="holo-panel rounded-2xl px-3 py-1.5 text-xs text-[#CCFF00]">
            לאיסוף {formatCoin(pendingProfits)} DRIPCOIN
          </div>
          <button
            type="button"
            onClick={onCollectProfits}
            className="rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/18 px-3 py-1.5 text-xs font-semibold text-[#E8FF9A]"
          >
            איסוף
          </button>
        </div>
      </div>

      <UploadPanel open={panelOpen === 'upload'} onClose={closePanel} onSubmit={onUploadSubmit} />
      <PowerStore
        open={panelOpen === 'store'}
        wallet={wallet}
        powers={storeItems}
        inventory={inventory}
        onBuy={onBuyStoreItem}
        onClose={closePanel}
      />
      <ProfilePanel
        open={panelOpen === 'profile'}
        wallet={wallet}
        assetsOwned={uploadedMedia.length}
        claims={myClaims}
        profile={profile}
        uploaded={uploadedMedia}
        claimed={claimedMedia}
        onChange={setProfile}
        onUploadAvatar={onUploadAvatar}
        onClose={closePanel}
      />
      <WalletPanel
        open={panelOpen === 'wallet'}
        balance={wallet}
        pending={pendingProfits}
        lifetimeDividends={lifetimeDividends}
        shockwaveAirdrops={shockwaveAirdrops}
        onCollect={onCollectProfits}
        onClose={closePanel}
      />
      <SettingsPanel
        open={panelOpen === 'settings'}
        prefs={prefs}
        onToggle={(key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
        onResetMarket={onResetMarket}
        onClose={closePanel}
      />

      <div ref={scrollRef} className="aether-scroll">
        {assets.map((asset, index) => (
          <article key={asset.id} data-feed-card data-index={index} className="aether-snap relative h-[100dvh] w-full">
            <div className="absolute inset-0">
              {asset.mediaKind === 'video' && (
                <video
                  ref={(node) => {
                    videoRefs.current[asset.id] = node;
                  }}
                  className="h-full w-full object-cover"
                  src={asset.mediaUrl}
                  loop
                  playsInline
                  preload="metadata"
                  muted={isMuted}
                  onClick={() => {
                    if (index === activeIndex) togglePlay();
                  }}
                />
              )}
              {asset.mediaKind === 'image' && <img src={asset.mediaUrl} alt={asset.title} className="h-full w-full object-cover" />}
              {asset.mediaKind === 'embed' && (
                <iframe
                  title={`${asset.platform}-${asset.id}`}
                  className="h-full w-full border-0"
                  src={asset.mediaUrl}
                  allow="autoplay; encrypted-media; clipboard-write"
                />
              )}
            </div>

            <div
              className="pointer-events-none absolute inset-0 opacity-85"
              style={{
                background: `linear-gradient(180deg, rgba(1,1,20,0.26) 0%, rgba(1,1,20,0.06) 28%, rgba(1,1,20,0.76) 100%), radial-gradient(circle at ${index % 2 === 0 ? '18%' : '78%'} 26%, ${asset.paletteB}4D, transparent 48%), radial-gradient(circle at ${index % 2 === 0 ? '82%' : '12%'} 78%, ${asset.paletteA}70, transparent 56%)`,
              }}
            />

            <motion.div
              className="relative z-10 flex h-full w-full flex-col justify-between p-4 md:p-8"
              initial={{ opacity: 0.75, scale: 0.995 }}
              animate={{ opacity: activeIndex === index ? 1 : 0.84, scale: activeIndex === index ? 1 : 0.996 }}
              transition={{ type: 'spring', stiffness: 120, damping: 21, mass: 0.9 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]/90">
                  #{index + 1} · {asset.currentOwner}
                </div>
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]">
                  הייפ {Math.round(asset.hypeLevel * 100)}% · {asset.platform}
                </div>
              </div>

              <div className="mx-auto mb-36 w-full max-w-5xl">
                <div className="holo-panel w-fit rounded-3xl p-4 md:p-5">
                  <h1
                    className="kinetic-text text-2xl font-semibold text-white md:text-5xl"
                    style={{ ['--wght' as string]: 480 + Math.round(asset.hypeLevel * 390) }}
                  >
                    {asset.title}
                  </h1>
                  <p className="mt-2 text-sm text-[#E0E0E0]/80 md:text-base">{asset.summary}</p>
                  <p className="mt-1 text-xs text-[#E0E0E0]/65">
                    {asset.creator} · {asset.uploaderCountry}
                  </p>
                  {asset.sourceLink && (
                    <a
                      href={asset.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block rounded-xl border border-white/20 px-2 py-1 text-[11px] text-white/85"
                    >
                      מקור
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </article>
        ))}
      </div>

      {activeAsset?.mediaKind === 'video' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-32 z-[55] px-3">
          <div className="pointer-events-auto mx-auto flex w-full max-w-lg items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-xl">
            <button type="button" onClick={() => setIsMuted((prev) => !prev)} className="rounded-full border border-white/20 p-1.5 text-white">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button type="button" onClick={() => seekBy(-10)} className="rounded-full border border-white/20 p-1.5 text-white">
              <Rewind size={14} />
            </button>
            <button type="button" onClick={togglePlay} className="rounded-full border border-white/20 p-1.5 text-white">
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" onClick={() => seekBy(10)} className="rounded-full border border-white/20 p-1.5 text-white">
              <FastForward size={14} />
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, videoDuration)}
              step={0.1}
              value={Math.min(videoProgress, Math.max(1, videoDuration))}
              onChange={(event) => {
                const video = activeVideo;
                if (!video) return;
                const value = Number(event.target.value);
                video.currentTime = value;
                setVideoProgress(value);
              }}
              className="w-full accent-[#CCFF00]"
            />
          </div>
        </div>
      )}

      {activeAsset && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[56] px-3">
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
            collapsed={deskCollapsed}
            onToggleCollapse={() => setDeskCollapsed((prev) => !prev)}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[52] px-3 pb-1">
        <div className="mx-auto w-full max-w-xl text-center text-[11px] text-white/70">{eventLine}</div>
      </div>
    </section>
  );
}
