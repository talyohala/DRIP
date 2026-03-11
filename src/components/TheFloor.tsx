import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, type PanInfo, useAnimationControls } from 'framer-motion';
import { Crown, Flame, Gift, Heart, History, Share2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

type RelicKey = 'trendsetter' | 'phantom' | 'critic' | 'broker';

type RelicExpiry = Record<RelicKey, number>;

type LedgerEntry = {
  owner: string;
  at: number;
  price: number;
  note: string;
};

type DropItem = {
  id: number;
  media: string;
  owner: string;
  initial: number;
  price: number;
  hype: number;
  likes: number;
  shares: number;
  liquidity: number;
  hiddenBid: number;
  freezeUntil: number;
  lastTouched: number;
  relicExpiry: RelicExpiry;
  ledger: LedgerEntry[];
};

const HOUSE_OWNER = 'The House';
const INITIAL_BALANCE = 5000;
const BACK_COST = 50;

const RELIC_CONFIG: Record<
  RelicKey,
  {
    key: RelicKey;
    icon: typeof Sparkles | typeof TrendingUp | typeof Flame | typeof Crown;
    cost: number;
    durationMs: number;
    glowClass: string;
    accentClass: string;
  }
> = {
  trendsetter: {
    key: 'trendsetter',
    icon: TrendingUp,
    cost: 120,
    durationMs: 14_000,
    glowClass: 'shadow-[0_0_30px_rgba(244,114,182,0.35)]',
    accentClass: 'text-[#ff66cb]',
  },
  phantom: {
    key: 'phantom',
    icon: Sparkles,
    cost: 150,
    durationMs: 18_000,
    glowClass: 'shadow-[0_0_30px_rgba(255,255,255,0.25)]',
    accentClass: 'text-white',
  },
  critic: {
    key: 'critic',
    icon: Flame,
    cost: 130,
    durationMs: 12_000,
    glowClass: 'shadow-[0_0_30px_rgba(34,211,238,0.35)]',
    accentClass: 'text-cyan-300',
  },
  broker: {
    key: 'broker',
    icon: Crown,
    cost: 160,
    durationMs: 20_000,
    glowClass: 'shadow-[0_0_30px_rgba(250,204,21,0.35)]',
    accentClass: 'text-amber-300',
  },
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function computePrice(initial: number, hype: number, liquidity: number) {
  const vibeMultiplier = 1 + hype / 115;
  return Math.max(initial, Math.round((initial + liquidity) * vibeMultiplier));
}

function buildInitialDrops(): DropItem[] {
  const now = Date.now();
  return [
    {
      id: 1,
      media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      owner: 'Tal Yohala',
      initial: 500,
      price: computePrice(500, 82, 240),
      hype: 82,
      likes: 12400,
      shares: 770,
      liquidity: 240,
      hiddenBid: 0,
      freezeUntil: 0,
      lastTouched: now,
      relicExpiry: { trendsetter: 0, phantom: 0, critic: 0, broker: 0 },
      ledger: [
        { owner: 'WhaleKing', at: now - 780_000, price: 960, note: 'Flip' },
        { owner: 'Tal Yohala', at: now - 420_000, price: 1088, note: 'Claim' },
      ],
    },
    {
      id: 2,
      media: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1200&auto=format&fit=crop',
      owner: 'WhaleQueen',
      initial: 500,
      price: computePrice(500, 49, 110),
      hype: 49,
      likes: 6100,
      shares: 220,
      liquidity: 110,
      hiddenBid: 0,
      freezeUntil: 0,
      lastTouched: now - 2_000,
      relicExpiry: { trendsetter: 0, phantom: 0, critic: 0, broker: 0 },
      ledger: [
        { owner: 'Sam Nova', at: now - 980_000, price: 640, note: 'Claim' },
        { owner: 'WhaleQueen', at: now - 300_000, price: 920, note: 'Claim' },
      ],
    },
    {
      id: 3,
      media: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?q=80&w=1200&auto=format&fit=crop',
      owner: HOUSE_OWNER,
      initial: 500,
      price: 500,
      hype: 14,
      likes: 1700,
      shares: 58,
      liquidity: 12,
      hiddenBid: 0,
      freezeUntil: 0,
      lastTouched: now - 6_000,
      relicExpiry: { trendsetter: 0, phantom: 0, critic: 0, broker: 0 },
      ledger: [{ owner: 'DRIP Syndicate', at: now - 1_540_000, price: 1120, note: 'Ownership broke' }],
    },
  ];
}

export default function TheFloor() {
  const { t, i18n } = useTranslation();
  const isRTL = (i18n.resolvedLanguage ?? i18n.language).startsWith('he');
  const locale = isRTL ? 'he-IL' : 'en-US';

  const [drops, setDrops] = useState<DropItem[]>(() => buildInitialDrops());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shakeNonce, setShakeNonce] = useState(0);

  const floorControls = useAnimationControls();
  const currentDrop = useMemo(() => drops[currentIndex], [drops, currentIndex]);
  const now = Date.now();

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      let ownershipBroke = false;

      setDrops((prev) =>
        prev.map((drop) => {
          const tickNow = Date.now();
          let next = drop;

          const trendActive = drop.relicExpiry.trendsetter > tickNow;
          const frozen = drop.freezeUntil > tickNow || drop.relicExpiry.critic > tickNow;
          const ignored = tickNow - drop.lastTouched > 4200;

          if (trendActive) {
            const boostedHype = Math.min(100, drop.hype + 1);
            const boostedLiquidity = drop.liquidity + 4;
            next = {
              ...next,
              hype: boostedHype,
              liquidity: boostedLiquidity,
              price: computePrice(drop.initial, boostedHype, boostedLiquidity),
            };
          }

          if (ignored && !frozen) {
            const decayedHype = Math.max(0, next.hype - 2);
            const decayedLiquidity = Math.max(0, next.liquidity - 7);
            next = {
              ...next,
              hype: decayedHype,
              liquidity: decayedLiquidity,
              price: computePrice(next.initial, decayedHype, decayedLiquidity),
            };
          }

          if (next.hype === 0 && next.owner !== HOUSE_OWNER) {
            ownershipBroke = true;
            return {
              ...next,
              owner: HOUSE_OWNER,
              price: next.initial,
              liquidity: 0,
              hiddenBid: 0,
              lastTouched: tickNow,
              ledger: [
                { owner: HOUSE_OWNER, at: tickNow, price: next.initial, note: 'Ownership broke' },
                ...next.ledger,
              ],
            };
          }

          return next;
        }),
      );

      if (ownershipBroke) {
        setToast({ type: 'error', text: t('ownership_broken') });
      }
    }, 1300);

    return () => window.clearInterval(interval);
  }, [t]);

  useEffect(() => {
    if (shakeNonce === 0) {
      return;
    }
    void floorControls.start({
      x: [0, -16, 14, -9, 5, 0],
      transition: { duration: 0.45, ease: 'easeInOut' },
    });
  }, [floorControls, shakeNonce]);

  if (!currentDrop) {
    return (
      <div className="grid h-[100dvh] w-full place-items-center bg-[#030307] text-sm text-white/70">
        {t('loading')}
      </div>
    );
  }

  const formatNum = (value: number) => value.toLocaleString(locale);
  const frozenNow = currentDrop.freezeUntil > now || currentDrop.relicExpiry.critic > now;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isClaiming) {
      return;
    }
    if (info.offset.y < -90 && currentIndex < drops.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowLedger(false);
      setShowRelics(false);
    } else if (info.offset.y > 90 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowLedger(false);
      setShowRelics(false);
    }
  };

  const boostDrop = (updater: (drop: DropItem) => DropItem) => {
    setDrops((prev) => prev.map((drop, idx) => (idx === currentIndex ? updater(drop) : drop)));
  };

  const vibrate = (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  };

  const handleLike = () => {
    boostDrop((drop) => {
      const hype = Math.min(100, drop.hype + 1);
      const liquidity = drop.liquidity + 5;
      return {
        ...drop,
        likes: drop.likes + 1,
        hype,
        liquidity,
        price: computePrice(drop.initial, hype, liquidity),
        lastTouched: Date.now(),
      };
    });
  };

  const handleShare = () => {
    boostDrop((drop) => {
      const hype = Math.min(100, drop.hype + 2);
      const liquidity = drop.liquidity + 8;
      return {
        ...drop,
        shares: drop.shares + 1,
        hype,
        liquidity,
        price: computePrice(drop.initial, hype, liquidity),
        lastTouched: Date.now(),
      };
    });
  };

  const handleBack = () => {
    if (balance < BACK_COST) {
      setToast({ type: 'error', text: t('insufficient_drip') });
      return;
    }
    setBalance((prev) => prev - BACK_COST);
    boostDrop((drop) => {
      const hype = Math.min(100, drop.hype + 6);
      const liquidity = drop.liquidity + 26;
      return {
        ...drop,
        likes: drop.likes + 4,
        hype,
        liquidity,
        price: computePrice(drop.initial, hype, liquidity),
        lastTouched: Date.now(),
      };
    });
    setToast({ type: 'success', text: t('back_success') });
  };

  const handleClaim = () => {
    if (isClaiming) {
      return;
    }

    const claimNow = Date.now();
    const brokerFee = currentDrop.relicExpiry.broker > claimNow ? Math.round(currentDrop.price * 0.12) : 0;
    const hiddenBid = currentDrop.relicExpiry.phantom > claimNow ? Math.floor(40 + Math.random() * 180) : 0;
    const total = currentDrop.price + brokerFee + hiddenBid;

    if (balance < total) {
      setToast({ type: 'error', text: t('insufficient_drip') });
      vibrate([120]);
      return;
    }

    setIsClaiming(true);
    setBalance((prev) => prev - total);
    setShakeNonce((prev) => prev + 1);
    vibrate([200, 80, 200]);

    boostDrop((drop) => {
      const hype = Math.min(100, drop.hype + 14);
      const liquidity = drop.liquidity + 220;
      const nextOwner = isRTL ? 'את/ה' : 'You';
      return {
        ...drop,
        owner: nextOwner,
        hype,
        hiddenBid,
        liquidity,
        price: computePrice(drop.initial, hype, liquidity),
        lastTouched: claimNow,
        ledger: [{ owner: nextOwner, at: claimNow, price: total, note: 'Claim' }, ...drop.ledger],
      };
    });

    setToast({
      type: 'success',
      text:
        brokerFee + hiddenBid > 0
          ? `${t('claim_success')} • ${t('broker_fee')}: ${formatNum(brokerFee)} • ${t('hidden_bid')}: ${formatNum(hiddenBid)}`
          : t('claim_success'),
    });

    window.setTimeout(() => setIsClaiming(false), 900);
  };

  const activateRelic = (key: RelicKey) => {
    const relic = RELIC_CONFIG[key];
    if (balance < relic.cost) {
      setToast({ type: 'error', text: t('insufficient_drip') });
      return;
    }

    const activatedAt = Date.now();
    const expiresAt = activatedAt + relic.durationMs;
    setBalance((prev) => prev - relic.cost);

    boostDrop((drop) => {
      const relicExpiry: RelicExpiry = { ...drop.relicExpiry, [key]: expiresAt };
      const isTrendsetter = key === 'trendsetter';
      const hype = isTrendsetter ? Math.min(100, drop.hype + 12) : drop.hype;
      const liquidity = isTrendsetter ? drop.liquidity + 46 : drop.liquidity;
      const freezeUntil = key === 'critic' ? expiresAt : drop.freezeUntil;

      return {
        ...drop,
        hype,
        liquidity,
        freezeUntil,
        relicExpiry,
        price: computePrice(drop.initial, hype, liquidity),
        lastTouched: activatedAt,
      };
    });

    setToast({ type: 'success', text: `${t('relic_activated')}: ${t(relic.key)}` });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#02030a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.25),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(250,204,21,0.18),transparent_40%)]" />

      <div className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between p-4">
        <div className="flex gap-2 rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-2xl">
          {['floor', 'arsenal', 'warroom', 'profile'].map((tab) => (
            <span
              key={tab}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white/75',
                tab === 'floor' && 'bg-white/15 text-white',
              )}
            >
              {t(tab)}
            </span>
          ))}
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
          {t('live')}
        </span>
      </div>

      <motion.div animate={floorControls} className="absolute inset-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={currentDrop.id}
            initial={{ y: '18%', opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '-22%', opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <img src={currentDrop.media} alt="Drop" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02030a] via-[#02030aaa] to-transparent" />

            <div className={cn('absolute bottom-44 z-30 flex flex-col gap-4', isRTL ? 'left-4' : 'right-4')}>
              <InteractionButton
                icon={<Heart size={26} />}
                label={formatNum(currentDrop.likes)}
                accentClass="hover:text-pink-300"
                onClick={handleLike}
              />
              <InteractionButton
                icon={<Share2 size={26} />}
                label={formatNum(currentDrop.shares)}
                accentClass="hover:text-cyan-300"
                onClick={handleShare}
              />
              <InteractionButton
                icon={<Gift size={26} />}
                label={t('send_gift')}
                accentClass="hover:text-amber-300"
                onClick={() => setShowRelics((prev) => !prev)}
              />
              <InteractionButton
                icon={<History size={26} />}
                label={t('history')}
                accentClass="hover:text-emerald-300"
                onClick={() => setShowLedger((prev) => !prev)}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-24">
              <motion.div
                whileHover={{ rotateX: 3, rotateY: isRTL ? -3 : 3, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="rounded-3xl border border-white/15 bg-black/45 p-4 backdrop-blur-2xl"
              >
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-black/45 px-3 py-1 backdrop-blur-xl">
                      <span className="text-xs text-white/65">{t('owned_by')}</span>
                      <span className="text-sm font-bold text-white">
                        {currentDrop.owner === HOUSE_OWNER ? t('no_owner') : currentDrop.owner}
                      </span>
                      <Crown size={14} className="text-amber-300" />
                    </div>
                    <div className="text-[11px] text-white/70">
                      {t('asset_value')} ·{' '}
                      <span className="font-black text-emerald-300">
                        {formatNum(currentDrop.price)} {t('dripcoin')}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-black/55 px-3 py-2 text-center backdrop-blur-2xl">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">{t('hype_meter')}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Flame
                        size={17}
                        fill="currentColor"
                        className={currentDrop.hype > 55 ? 'text-orange-400' : 'text-sky-300'}
                      />
                      <span className="text-sm font-black">{currentDrop.hype}%</span>
                    </div>
                    {frozenNow && <div className="mt-1 text-[10px] font-semibold text-cyan-300">{t('freeze_active')}</div>}
                  </div>
                </div>

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    key={`${currentDrop.id}-${currentDrop.hype}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${currentDrop.hype}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-emerald-300 to-amber-300"
                  />
                </div>

                <div className="mb-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-cyan-200">
                    <Zap size={16} />
                    <span className="font-semibold">
                      {t('your_balance')}: {formatNum(balance)}
                    </span>
                  </div>
                  <span className="text-white/70">{t('hype_level')}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBack}
                    className="col-span-1 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 font-bold text-white backdrop-blur-2xl"
                  >
                    {t('backing')} ({BACK_COST})
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaim}
                    className="col-span-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-400 px-3 py-3 font-black text-black shadow-[0_0_30px_rgba(16,185,129,0.45)]"
                  >
                    {isClaiming ? t('claim_processing') : t('claim_drop')}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.article>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showRelics && (
          <motion.aside
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="absolute bottom-24 left-4 right-4 z-40 rounded-3xl border border-white/15 bg-black/55 p-4 backdrop-blur-2xl"
          >
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/70">{t('relics')}</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RELIC_CONFIG) as RelicKey[]).map((key) => {
                const relic = RELIC_CONFIG[key];
                const Icon = relic.icon;
                const activeUntil = currentDrop.relicExpiry[key];
                const active = activeUntil > Date.now();
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => activateRelic(key)}
                    className={cn(
                      'rounded-2xl border border-white/15 bg-black/50 p-3 text-start backdrop-blur-2xl',
                      relic.glowClass,
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Icon size={18} className={relic.accentClass} />
                      <span className="text-xs font-bold text-amber-200">{relic.cost}</span>
                    </div>
                    <div className="text-sm font-semibold text-white">{t(relic.key)}</div>
                    <div className="mt-1 text-[11px] text-white/60">
                      {active ? `${Math.max(1, Math.ceil((activeUntil - Date.now()) / 1000))}s` : t('send_gift')}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLedger && (
          <motion.aside
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className={cn(
              'absolute bottom-0 top-0 z-50 w-[80%] max-w-sm border-white/15 bg-black/60 p-4 backdrop-blur-2xl',
              isRTL ? 'left-0 border-r' : 'right-0 border-l',
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">{t('history')}</h2>
              <button
                onClick={() => setShowLedger(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
              >
                x
              </button>
            </div>

            <div className="hide-scrollbar h-[calc(100%-3.2rem)] space-y-2 overflow-y-auto pr-1">
              {currentDrop.ledger.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">{t('ledger_empty')}</div>
              )}
              {currentDrop.ledger.map((entry, idx) => (
                <div key={`${entry.owner}-${entry.at}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-semibold text-white">{entry.owner}</div>
                  <div className="mt-1 text-xs text-white/70">
                    {new Date(entry.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-300">
                    {formatNum(entry.price)} {t('dripcoin')}
                  </div>
                  <div className="mt-1 text-xs text-white/70">{entry.note}</div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={cn(
              'absolute left-1/2 top-16 z-[60] -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-bold backdrop-blur-2xl',
              toast.type === 'success'
                ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-100'
                : 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100',
            )}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InteractionButton({
  icon,
  label,
  accentClass,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  accentClass: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.86 }}
      onClick={onClick}
      className={cn('flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-white', accentClass)}
    >
      <span>{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </motion.button>
  );
}
