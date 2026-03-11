import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import StakeDesk, { type AssetDeskModel } from './StakeDesk';

type FoundingLedger = Record<string, number>;
type MediaKind = 'image' | 'video';

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

const USER_ID = 'local-player';
const BASE_BACK_COST = 10;
const DIVIDEND_RATE = 0.1;
const PALETTES: Array<[string, string]> = [
  ['#4B0CA3', '#FF007F'],
  ['#10002B', '#CCFF00'],
  ['#010114', '#E0E0E0'],
  ['#240046', '#FF007F'],
  ['#03071E', '#CCFF00'],
];

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

export default function AetherFeed() {
  const [assets, setAssets] = useState<FeedAsset[]>(() => seedAssets.map((asset) => normalizeAsset(asset)));
  const [activeIndex, setActiveIndex] = useState(0);
  const [wallet, setWallet] = useState(4800);
  const [lifetimeDividends, setLifetimeDividends] = useState(0);
  const [shockwaveAirdrops, setShockwaveAirdrops] = useState(0);
  const [eventLine, setEventLine] = useState('השוק חי: גללו למעלה ולמטה כדי להעביר את ההייפ בין הנכסים.');
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCreator, setDraftCreator] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftMediaKind, setDraftMediaKind] = useState<MediaKind>('video');
  const [draftMediaUrl, setDraftMediaUrl] = useState('');
  const [draftOpeningPrice, setDraftOpeningPrice] = useState('500');
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
      {
        root,
        threshold: [0.55, 0.68, 0.82],
      },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [assets.length]);

  useEffect(() => {
    setAssets((prevAssets) =>
      prevAssets.map((asset, idx) => {
        const migration = idx === activeIndex ? 210 : -55;
        const viewersLive = clamp(asset.viewersLive + migration, 220, 60000);
        return normalizeAsset({
          ...asset,
          viewersLive,
        });
      }),
    );
  }, [activeIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      let liveHeadline = '';
      setAssets((prevAssets) =>
        prevAssets.map((asset, idx) => {
          const isActive = idx === activeIndex;
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
      if (liveHeadline) {
        setEventLine(liveHeadline);
      }
    }, 2400);

    return () => window.clearInterval(interval);
  }, [activeIndex]);

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

  const updateShimmer = (clientX: number, clientY: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;
    root.style.setProperty('--mx', `${clamp(x, 0, 100)}%`);
    root.style.setProperty('--my', `${clamp(y, 0, 100)}%`);
  };

  const submitNewAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const openingPrice = Math.round(Number(draftOpeningPrice));
    if (!draftTitle.trim() || !draftCreator.trim() || !draftSummary.trim() || !draftMediaUrl.trim()) {
      toast.error('יש למלא את כל השדות לפני הנפקה.');
      return;
    }
    if (!Number.isFinite(openingPrice) || openingPrice <= 0) {
      toast.error('מחיר פתיחה חייב להיות מספר חיובי.');
      return;
    }

    const [paletteA, paletteB] = pickPalette();
    const created = normalizeAsset({
      id: createAssetId(),
      title: draftTitle.trim(),
      creator: draftCreator.trim(),
      summary: draftSummary.trim(),
      mediaKind: draftMediaKind,
      mediaUrl: draftMediaUrl.trim(),
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
    setActiveIndex(0);
    setComposerOpen(false);
    setDraftTitle('');
    setDraftCreator('');
    setDraftSummary('');
    setDraftMediaUrl('');
    setDraftMediaKind('video');
    setDraftOpeningPrice('500');
    setEventLine(`נכס חדש הונפק במחיר פתיחה ${formatCoin(openingPrice)} DRIPCOIN. הקרב מתחיל עכשיו.`);
    toast.success('הנפקה בוצעה. הנכס נכנס לראש הפיד.');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onBack = () => {
    const asset = assets[activeIndex];
    if (!asset) return;
    const actionCost = getBackCost(asset);
    if (wallet < actionCost) {
      toast.error('אין מספיק DRIPCOIN לפעולת גבה.');
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

    setEventLine(`בוצע גבה מוקדם: ${formatCoin(actionCost)} DRIPCOIN הוזרמו לבריכת המייסדים.`);
    toast.success(`ננעל גבה מוקדם ב-${formatCoin(actionCost)} DRIPCOIN`);
  };

  const onClaim = () => {
    const asset = assets[activeIndex];
    if (!asset) return;

    const claimPrice = Math.round(asset.stakePrice);
    if (wallet < claimPrice) {
      toast.error('אין מספיק DRIPCOIN לפעולת תבע.');
      return;
    }

    const totalLedger = sumLedger(asset.foundingLedger);
    const myStake = asset.foundingLedger[USER_ID] ?? 0;
    const dividendPool = Math.round(claimPrice * DIVIDEND_RATE);
    const myDividend = totalLedger > 0 ? Math.round(dividendPool * (myStake / totalLedger)) : 0;
    const shockwave = Math.round(asset.viewersLive * (0.011 + asset.viralScore / 10000));

    setWallet((prev) => prev - claimPrice + myDividend + shockwave);
    setLifetimeDividends((prev) => prev + myDividend);
    setShockwaveAirdrops((prev) => prev + shockwave);
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
      `תבע הושלם: דיבידנד אישי ${formatCoin(myDividend)} DRIPCOIN + גל הדף ${formatCoin(shockwave)} DRIPCOIN.`,
    );
    toast.success(`תבע בוצע. התקבלו ${formatCoin(myDividend + shockwave)} DRIPCOIN בחזרה.`);
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4 md:p-6">
        <div className="pointer-events-auto mx-auto w-full max-w-4xl">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]/90">
              גלילה למעלה/למטה מזיזה את מוקד ההייפ לנכס הבא
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen((prev) => !prev)}
              className="rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/15 px-3 py-2 text-xs font-semibold text-[#DFFF8A]"
            >
              {composerOpen ? 'סגור הנפקה' : 'הנפקת נכס חדש'}
            </button>
          </div>

          {composerOpen && (
            <form onSubmit={submitNewAsset} className="holo-panel rounded-3xl p-3 md:p-4">
              <p className="mb-3 text-sm font-semibold text-white">יצירת נכס חדש לפיד החי</p>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/45"
                  placeholder="שם הנכס"
                />
                <input
                  value={draftCreator}
                  onChange={(event) => setDraftCreator(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/45"
                  placeholder="שם היוצר"
                />
                <input
                  value={draftMediaUrl}
                  onChange={(event) => setDraftMediaUrl(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/45 md:col-span-2"
                  placeholder="קישור ישיר לתמונה או וידאו"
                />
                <textarea
                  value={draftSummary}
                  onChange={(event) => setDraftSummary(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/45 md:col-span-2"
                  placeholder="תיאור קצר ומושך לנכס"
                  rows={2}
                />
                <select
                  value={draftMediaKind}
                  onChange={(event) => setDraftMediaKind(event.target.value as MediaKind)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="video">וידאו</option>
                  <option value="image">תמונה</option>
                </select>
                <input
                  value={draftOpeningPrice}
                  onChange={(event) => setDraftOpeningPrice(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-[#E0E0E0]/45"
                  placeholder="מחיר פתיחה ב-DRIPCOIN"
                  inputMode="numeric"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/20 px-4 py-2 text-sm font-semibold text-[#FFD3EA]"
                >
                  העלאה לפיד והנפקה חיה
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="aether-scroll">
        {assets.map((asset, index) => (
          <article
            key={asset.id}
            data-feed-card
            data-index={index}
            className="aether-snap relative h-[100dvh] w-full"
          >
            <div className="absolute inset-0">
              {asset.mediaKind === 'video' ? (
                <video
                  className="h-full w-full object-cover"
                  src={asset.mediaUrl}
                  muted
                  loop
                  playsInline
                  autoPlay={activeIndex === index}
                  preload="metadata"
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

            <motion.div
              className="relative z-10 flex h-full w-full flex-col justify-between p-4 md:p-8"
              initial={{ opacity: 0.7, scale: 0.995 }}
              animate={{ opacity: activeIndex === index ? 1 : 0.82, scale: activeIndex === index ? 1 : 0.996 }}
              transition={{ type: 'spring', stiffness: 120, damping: 21, mass: 0.9 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]/90">
                  נכס חי #{index + 1} · בעלים: {asset.currentOwner}
                </div>
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]">
                  הייפ {Math.round(asset.hypeLevel * 100)}% · מגמה {asset.trendScore}
                </div>
              </div>

              <div className="mx-auto mb-44 w-full max-w-5xl">
                <div className="holo-panel w-fit rounded-3xl p-4 md:p-5">
                  <h1
                    className="kinetic-text text-2xl font-semibold text-white md:text-5xl"
                    style={{ ['--wght' as string]: 480 + Math.round(asset.hypeLevel * 390) }}
                  >
                    {asset.title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-[#E0E0E0]/80 md:text-base">{asset.summary}</p>
                  <p className="mt-2 text-xs text-[#E0E0E0]/65">יוצר: {asset.creator}</p>
                </div>

                <div className="mt-3 grid max-w-xl grid-cols-3 gap-2 text-xs">
                  <div className="holo-panel rounded-2xl p-2">
                    <p className="text-[#E0E0E0]/55">צופים</p>
                    <p className="biolume-number mt-1 text-sm font-semibold">{formatCoin(asset.viewersLive)}</p>
                  </div>
                  <div className="holo-panel rounded-2xl p-2">
                    <p className="text-[#E0E0E0]/55">השתלטויות</p>
                    <p className="biolume-number mt-1 text-sm font-semibold">{asset.totalClaims}</p>
                  </div>
                  <div className="holo-panel rounded-2xl p-2">
                    <p className="text-[#E0E0E0]/55">מחיר</p>
                    <p className="biolume-number mt-1 text-sm font-semibold text-[#FF007F]">
                      {formatCoin(asset.stakePrice)} DRIPCOIN
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </article>
        ))}
      </div>

      {activeAsset && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 pb-5 md:p-8">
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#E0E0E0]/80 backdrop-blur-xl">
            <p>{eventLine}</p>
            <p className="biolume-number">
              דיבידנדים מצטברים: {formatCoin(lifetimeDividends)} DRIPCOIN | אייר-דרופ מצטבר:{' '}
              {formatCoin(shockwaveAirdrops)} DRIPCOIN
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
