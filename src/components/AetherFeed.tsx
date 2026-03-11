import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import StakeDesk, { type AssetDeskModel } from './StakeDesk';

type FoundingLedger = Record<string, number>;

type FeedAsset = AssetDeskModel & {
  summary: string;
  paletteA: string;
  paletteB: string;
  trendScore: number;
  foundingLedger: FoundingLedger;
};

const USER_ID = 'local-player';
const BASE_BACK_COST = 10;
const DIVIDEND_RATE = 0.1;

const seedAssets: FeedAsset[] = [
  {
    id: 'pulse-1',
    title: 'הקרנה ניאונית: רחוב לילי',
    creator: 'סטודיו ירח-פלזמה',
    stakePrice: 520,
    viewersLive: 1830,
    hypeLevel: 0.42,
    foundingPool: 0,
    foundingBackers: 0,
    trendScore: 71,
    summary: 'סשן ויזואלי חי שהופך כל מעבר תאורה לנכס סחיר בפיד.',
    paletteA: '#4B0CA3',
    paletteB: '#FF007F',
    foundingLedger: {},
  },
  {
    id: 'pulse-2',
    title: 'קצב אקווה: בתנועה רציפה',
    creator: 'מיקה סינט',
    stakePrice: 890,
    viewersLive: 2650,
    hypeLevel: 0.56,
    foundingPool: 0,
    foundingBackers: 0,
    trendScore: 82,
    summary: 'פריים דינמי עם רמיקס חי שמושך ציידי טרנדים בזמן אמת.',
    paletteA: '#10002B',
    paletteB: '#CCFF00',
    foundingLedger: {},
  },
  {
    id: 'pulse-3',
    title: 'אופק קינטי: טיפוגרפיה מרחפת',
    creator: 'איילה פלו',
    stakePrice: 1330,
    viewersLive: 3420,
    hypeLevel: 0.67,
    foundingPool: 0,
    foundingBackers: 0,
    trendScore: 93,
    summary: 'אסתטיקה הולוגרפית שמגיבה לצפייה משותפת ומאיצה את המחיר.',
    paletteA: '#010114',
    paletteB: '#E0E0E0',
    foundingLedger: {},
  },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

const getBackCost = (asset: FeedAsset): number => BASE_BACK_COST + Math.floor(asset.hypeLevel * 12);

const sumLedger = (ledger: FoundingLedger): number => Object.values(ledger).reduce((acc, value) => acc + value, 0);

export default function AetherFeed() {
  const [assets, setAssets] = useState<FeedAsset[]>(seedAssets);
  const [activeIndex, setActiveIndex] = useState(0);
  const [wallet, setWallet] = useState(4800);
  const [lifetimeDividends, setLifetimeDividends] = useState(0);
  const [shockwaveAirdrops, setShockwaveAirdrops] = useState(0);
  const [eventLine, setEventLine] = useState('המערכת חיה: ציידי טרנדים נכנסים לגל הראשון.');
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
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          const viewerDelta = Math.round((Math.random() - 0.48) * 180);
          const viewersLive = clamp(asset.viewersLive + viewerDelta, 320, 20000);
          const hypeLevel = clamp(asset.hypeLevel + (Math.random() - 0.5) * 0.03 + viewersLive / 300000, 0.08, 1);
          const drift = 1 + (hypeLevel - 0.48) * 0.012;
          const stakePrice = clamp(Math.round(asset.stakePrice * drift), 80, 200000);
          const trendScore = clamp(Math.round(asset.trendScore + (hypeLevel - 0.45) * 2), 1, 999);
          return {
            ...asset,
            viewersLive,
            hypeLevel,
            stakePrice,
            trendScore,
          };
        }),
      );
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

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
        const heatBoost = 1 + item.hypeLevel * 0.24 + item.viewersLive / 14000;
        const stakePrice = Math.round(item.stakePrice + actionCost * heatBoost + 4);
        const hypeLevel = clamp(item.hypeLevel + 0.042, 0.1, 1);
        return {
          ...item,
          foundingLedger,
          foundingPool,
          foundingBackers,
          stakePrice,
          hypeLevel,
          trendScore: clamp(item.trendScore + 2, 1, 999),
        };
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
    const shockwave = Math.round(asset.viewersLive * 0.03);

    setWallet((prev) => prev - claimPrice + myDividend + shockwave);
    setLifetimeDividends((prev) => prev + myDividend);
    setShockwaveAirdrops((prev) => prev + shockwave);
    setAssets((prevAssets) =>
      prevAssets.map((item, idx) => {
        if (idx !== activeIndex) return item;
        const surge = 1.08 + item.hypeLevel * 0.33 + Math.min(0.2, item.viewersLive / 30000);
        const stakePrice = Math.round(item.stakePrice * surge + Math.sqrt(item.viewersLive));
        const viewersLive = clamp(item.viewersLive + Math.round(Math.random() * 700), 320, 24000);
        return {
          ...item,
          stakePrice,
          viewersLive,
          hypeLevel: clamp(item.hypeLevel + 0.09, 0.1, 1),
          foundingPool: 0,
          foundingBackers: 0,
          foundingLedger: {},
          trendScore: clamp(item.trendScore + 8, 1, 999),
        };
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
      <div ref={scrollRef} className="aether-scroll">
        {assets.map((asset, index) => (
          <article
            key={asset.id}
            data-feed-card
            data-index={index}
            className="aether-snap relative flex items-center justify-center px-4 py-8 md:px-12"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-75"
              style={{
                background: `radial-gradient(circle at ${index % 2 === 0 ? '18%' : '78%'} 26%, ${asset.paletteB}35, transparent 48%), radial-gradient(circle at ${index % 2 === 0 ? '82%' : '12%'} 78%, ${asset.paletteA}58, transparent 56%)`,
              }}
            />

            <motion.div
              className="holo-panel relative flex h-[82dvh] w-full max-w-5xl flex-col justify-between rounded-[34px] border-white/10 p-6 md:p-10"
              initial={{ opacity: 0.4, scale: 0.985 }}
              animate={{ opacity: activeIndex === index ? 1 : 0.78, scale: activeIndex === index ? 1 : 0.992 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.9 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs text-[#E0E0E0]/65">נכס חי #{index + 1}</p>
                  <h1
                    className="kinetic-text text-2xl font-semibold text-white md:text-4xl"
                    style={{ ['--wght' as string]: 480 + Math.round(asset.hypeLevel * 390) }}
                  >
                    {asset.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-[#E0E0E0]/75 md:text-base">{asset.summary}</p>
                </div>
                <div className="holo-panel rounded-2xl px-3 py-2 text-xs text-[#E0E0E0]">
                  <p className="text-[#E0E0E0]/60">אינדקס טרנד</p>
                  <p className="biolume-number liquid-accent mt-1 text-lg font-semibold">{asset.trendScore}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-[#E0E0E0]/55">מהירות ויראלית</p>
                  <p className="biolume-number mt-2 text-lg font-semibold text-[#CCFF00]">
                    {Math.round(asset.hypeLevel * 100)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-[#E0E0E0]/55">צופים חיים</p>
                  <p className="biolume-number mt-2 text-lg font-semibold text-[#E0E0E0]">
                    {formatCoin(asset.viewersLive)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-[#E0E0E0]/55">מחיר נוכחי</p>
                  <p className="biolume-number mt-2 text-lg font-semibold text-[#FF007F]">
                    {formatCoin(asset.stakePrice)} DRIPCOIN
                  </p>
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
