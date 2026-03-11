import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Backpack,
  Biohazard,
  Briefcase,
  ChevronsDown,
  CloudFog,
  Clock,
  Eye,
  FileText,
  Ghost,
  Hexagon,
  Hourglass,
  Loader2,
  Lock,
  Magnet,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoinIcon';

type LooseRecord = Record<string, any>;

type PowerDefinition = {
  name: string;
  icon: LucideIcon;
  color: string;
};

type AssetCardProps = {
  asset: LooseRecord;
  currentUser: LooseRecord | null;
  inventory: LooseRecord[];
  setShowArsenal: (assetId: string) => void;
  handleShare: (asset: LooseRecord) => Promise<void>;
  handleTakeover: (
    asset: LooseRecord,
    activeValue: number,
    e: ReactMouseEvent<HTMLButtonElement> | null,
  ) => Promise<void>;
  actionId: string | null;
  labels: {
    takeover: string;
    yours: string;
    frozen: string;
  };
};

const POWERS_DICT: Record<number, PowerDefinition> = {
  7: { name: 'שוגר ראש', icon: Sparkles, color: 'text-[#007AFF]' },
  8: { name: 'מסך עשן', icon: CloudFog, color: 'text-[#FF3B30]' },
  9: { name: 'שאיבת הייפ', icon: Magnet, color: 'text-[#FF3B30]' },
  4: { name: 'הזרקת הייפ', icon: Activity, color: 'text-[#007AFF]' },
  10: { name: 'מגן ניאון', icon: ShieldCheck, color: 'text-[#007AFF]' },
  1: { name: 'רוח רפאים', icon: Ghost, color: 'text-[#E5E7EB]' },
  11: { name: 'הכפלת סיכון', icon: ChevronsDown, color: 'text-[#FF3B30]' },
  2: { name: 'חומת מגן', icon: ShieldAlert, color: 'text-[#007AFF]' },
  12: { name: 'מס קריפטו', icon: FileText, color: 'text-[#FF3B30]' },
  13: { name: 'ניקוי זירה', icon: Target, color: 'text-[#E5E7EB]' },
  5: { name: 'הרעלה', icon: Biohazard, color: 'text-[#FF3B30]' },
  14: { name: 'מידע פנים', icon: Eye, color: 'text-[#007AFF]' },
  15: { name: 'עיוות זמן', icon: Hourglass, color: 'text-[#E5E7EB]' },
  3: { name: 'לוויתן', icon: Sparkles, color: 'text-[#E5E7EB]' },
  6: { name: 'פצצת EMP', icon: Radio, color: 'text-[#FF3B30]' },
  16: { name: 'הסנדק', icon: Briefcase, color: 'text-[#D4AF37]' },
};

const calculateHype = (asset: LooseRecord) => {
  const start = new Date(asset.last_takeover_at || asset.created_at).getTime();
  const now = new Date().getTime();
  let mins = Math.floor((now - start) / (1000 * 60));
  if (asset.double_decay_until && new Date(asset.double_decay_until) > new Date()) mins *= 2;
  if (asset.time_warp_until && new Date(asset.time_warp_until) > new Date()) return Math.min(100, 50 + mins);
  return Math.max(5, 100 - mins);
};

const isVideo = (url: string) => ['mp4', 'mov', 'webm', 'quicktime'].includes(url.split('.').pop()?.toLowerCase() || '');

const AssetCard = ({
  asset,
  currentUser,
  inventory,
  setShowArsenal,
  handleShare,
  handleTakeover,
  actionId,
  labels,
}: AssetCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [initialDist, setInitialDist] = useState(0);

  const video = isVideo(asset.media_url);
  const hype = calculateHype(asset);
  const isMine = currentUser?.id === asset.owner_id;
  const isCreatorPopular = asset.creator?.is_verified || (asset.creator?.drip_coins ?? 0) > 500000;
  const activeValue = isCreatorPopular ? Math.floor(asset.current_value * 1.15) : asset.current_value;

  const now = new Date();
  const isSmoked = asset.smoked_until && new Date(asset.smoked_until) > now;
  const isFrozen = asset.frozen_until && new Date(asset.frozen_until) > now;
  const isGhosted = asset.ghosted_until && new Date(asset.ghosted_until) > now && !isMine;
  const hasDoubleDecay = asset.double_decay_until && new Date(asset.double_decay_until) > now;
  const hasTimeWarp = asset.time_warp_until && new Date(asset.time_warp_until) > now;
  const isOwnerWhale = asset.owner?.whale_until && new Date(asset.owner.whale_until) > now;
  const isOwnerGodfather = asset.owner?.godfather_until && new Date(asset.owner.godfather_until) > now;
  const hasInsiderInfo = currentUser?.insider_until && new Date(currentUser.insider_until) > now;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = false;
          videoRef.current.play().catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              void videoRef.current.play();
            }
          });
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
  }, []);

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      setInitialDist(
        Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        ),
      );
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (initialDist > 0) {
        setScale((prev) => Math.max(1, Math.min(prev * (dist / initialDist), 4)));
      }
      setInitialDist(dist);
    }
  };

  const handleTouchEnd = () => setScale(1);
  const totalInventory = inventory.reduce((acc: number, item: LooseRecord) => acc + item.quantity, 0);

  return (
    <div ref={cardRef} className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-[#020202]">
      <motion.div
        className="absolute inset-0 z-0 h-full w-full origin-center"
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {video ? (
          <video
            ref={videoRef}
            src={asset.media_url}
            className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[85%] blur-2xl' : ''}`}
            playsInline
            loop
          />
        ) : (
          <img
            src={asset.media_url}
            className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[85%] blur-2xl' : ''}`}
            alt={asset.title || 'נכס'}
          />
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/95 via-[#020202]/25 to-[#020202]/32" />

        {isSmoked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CloudFog size={98} className="animate-pulse text-white/15" />
          </div>
        )}

        <div className="pointer-events-auto absolute left-4 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#111111]/70 px-3 py-1.5 backdrop-blur-3xl">
          <Wallet size={14} className="text-[#E5E7EB]/80" />
          <span className="text-[11px] font-semibold text-[#E5E7EB]">{(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')}</span>
          <DripCoinIcon className="h-auto" />
        </div>

        <div className="absolute right-4 top-6 flex flex-col items-end gap-2">
          {isOwnerGodfather && (
            <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 backdrop-blur-3xl">
              <Briefcase size={10} className="text-[#D4AF37]" />
              <span className="text-[9px] font-semibold text-[#E5E7EB]">הסנדק</span>
            </div>
          )}
          {hasInsiderInfo && asset.taxed_by && (
            <div className="flex items-center gap-1 rounded-full border border-[#FF3B30]/40 bg-[#FF3B30]/10 px-2.5 py-1 backdrop-blur-3xl">
              <FileText size={10} className="text-[#FF3B30]" />
              <span className="text-[9px] font-semibold text-[#E5E7EB]">מלכודת מס</span>
            </div>
          )}
        </div>

        {hype <= 20 && (
          <div className="absolute bottom-[168px] left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#FF3B30]/35 bg-[#111111]/70 backdrop-blur-3xl">
            <Clock size={12} className="absolute text-[#FF3B30]/35" />
            <span className="relative z-10 text-[10px] font-semibold text-[#E5E7EB]">{hype}ד</span>
          </div>
        )}

        <div className="pointer-events-auto absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3">
          <button
            onClick={() => {
              void handleShare(asset);
            }}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-[#111111]/68 text-[#E5E7EB]/85 backdrop-blur-3xl transition-all hover:border-[#007AFF]/35 hover:text-[#E5E7EB]"
            aria-label="שיתוף"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArsenal(asset.id);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-[#111111]/68 text-[#E5E7EB]/85 backdrop-blur-3xl transition-all hover:border-[#007AFF]/35 hover:text-[#E5E7EB]"
            aria-label="ארסנל"
          >
            <Backpack size={16} />
            {totalInventory > 0 && (
              <div className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-black/70 bg-[#007AFF] text-[8px] font-semibold text-white">
                {totalInventory}
              </div>
            )}
          </button>
        </div>

        <div className="pointer-events-auto absolute bottom-[88px] left-3 right-3 z-30">
          <div className="rounded-[1.8rem] border border-white/10 bg-[#111111]/72 px-3 py-2.5 shadow-[0_20px_55px_rgba(0,0,0,0.72)] backdrop-blur-3xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex flex-1 items-center gap-2">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border ${
                    isOwnerWhale ? 'border-[#D4AF37]/45 bg-[#D4AF37]/10' : 'border-white/20 bg-black/30'
                  }`}
                >
                  {isGhosted ? (
                    <Ghost size={15} className="text-[#E5E7EB]/55" />
                  ) : asset.owner?.avatar_url ? (
                    <img src={asset.owner.avatar_url} className="h-full w-full object-cover" alt={asset.owner?.username || 'בעלים'} />
                  ) : (
                    <span className="text-xs">🧑🏽‍🚀</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1">
                    <span className="truncate text-[12px] font-semibold text-[#E5E7EB]">
                      {isGhosted ? 'מוסתר' : asset.owner?.username || 'בעלים לא ידוע'}
                    </span>
                    {!isGhosted && asset.owner?.is_verified && <Hexagon size={10} className="shrink-0 fill-[#007AFF]/20 text-[#007AFF]" />}
                  </div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[9px] text-[#E5E7EB]/55">
                    <span className="truncate">{asset.title}</span>
                    {hasDoubleDecay && <ChevronsDown size={10} className="text-[#FF3B30]" />}
                    {hasTimeWarp && <Hourglass size={10} className="text-[#E5E7EB]/75" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${hype <= 20 ? 'text-[#FF3B30]' : 'text-[#E5E7EB]/75'}`}>{hype}%</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      <motion.div
                        className={`h-full ${hype <= 20 ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}`}
                        animate={{ width: `${hype}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {isMine ? (
                  <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                    <span className="text-[10px] font-semibold text-[#E5E7EB]/85">{labels.yours}</span>
                  </div>
                ) : isFrozen ? (
                  <div className="flex items-center gap-1.5 rounded-full border border-[#007AFF]/35 bg-[#007AFF]/10 px-3.5 py-2 text-[#E5E7EB]">
                    <Lock size={12} />
                    <span className="text-[10px] font-semibold">{labels.frozen}</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      void handleTakeover(asset, activeValue, e);
                    }}
                    disabled={actionId === asset.id || (currentUser?.drip_coins ?? 0) < activeValue}
                    className={`rounded-full border px-3 py-1.5 transition-all active:scale-95 ${
                      actionId === asset.id
                        ? 'border-[#007AFF] bg-[#007AFF] text-white'
                        : 'border-[#007AFF]/45 bg-[#007AFF]/12 text-[#E5E7EB] hover:bg-[#007AFF]/20'
                    }`}
                  >
                    {actionId === asset.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[9px] font-semibold">{labels.takeover}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
                          {activeValue.toLocaleString('he-IL')}
                          <DripCoinIcon className="h-auto" />
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
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
  const [originalAssets, setOriginalAssets] = useState<LooseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'trending' | 'recent'>('recent');

  const [currentUser, setCurrentUser] = useState<LooseRecord | null>(null);
  const [inventory, setInventory] = useState<LooseRecord[]>([]);
  const [showArsenal, setShowArsenal] = useState<string | null>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const labels = {
    title: 'זירת דריפ',
    takeover: 'השתלטות',
    trending: 'חם',
    recent: 'חדש',
    yours: 'שלך',
    arsenal: 'ארסנל',
    frozen: 'מוגן',
  };

  useEffect(() => {
    const preventDefaultZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
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
  }, [filter, refreshKey]);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
      setCurrentUser(data);
      await fetchInventory(user.id);
    }
  };

  const fetchInventory = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data } = await supabase.from('drip_inventory').select('*').eq('user_id', userId).gt('quantity', 0);
    if (data) setInventory(data);
  };

  const fetchAssets = async () => {
    let query = supabase
      .from('drip_assets')
      .select(
        '*, owner:drip_users!owner_id(username, avatar_url, is_verified, drip_coins, godfather_until, whale_until), creator:drip_users!creator_id(username, is_verified, drip_coins)',
      );
    if (filter === 'recent') query = query.order('created_at', { ascending: false });
    else query = query.order('current_value', { ascending: false });
    const { data } = await query;
    if (data) {
      setOriginalAssets(data);
      setAssets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) setAssets((prev) => [...prev, ...originalAssets]);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [originalAssets]);

  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndHandler = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 75;

    if (isSwipe) {
      setFilter((prev) => (prev === 'recent' ? 'trending' : 'recent'));
    }
  };

  const handleShare = async (asset: LooseRecord) => {
    try {
      if (!navigator.share) throw new Error('share-not-supported');
      await navigator.share({
        title: `${asset.title} - הזירה`,
        text: `בדקו את הנכס הזה בזירה. בבעלות ${asset.owner?.username || 'משתמש אנונימי'}`,
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
    const invItem = inventory.find((i) => i.power_id === powerId);
    if (!invItem || invItem.quantity < 1) return toast.error('הכוח לא נמצא בארסנל');

    try {
      setInventory((prev) => prev.map((i) => (i.id === invItem.id ? { ...i, quantity: i.quantity - 1 } : i)));
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
        assets.forEach(async (a) => {
          if (a.id !== targetAsset.id) {
            const tTime = new Date(a.last_takeover_at || a.created_at);
            await supabase
              .from('drip_assets')
              .update({ last_takeover_at: new Date(tTime.getTime() - 12 * 60000).toISOString() })
              .eq('id', a.id);
          }
        });
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

  const handleTakeover = async (
    asset: LooseRecord,
    activeValue: number,
    e: ReactMouseEvent<HTMLButtonElement> | null,
  ) => {
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

      setCurrentUser((prev: LooseRecord | null) => {
        if (!prev) return prev;
        return { ...prev, drip_coins: prev.drip_coins - activeValue };
      });

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
      <div className="grid h-[100dvh] w-full place-items-center bg-[#020202] text-sm text-[#E5E7EB]/65">
        טוען את הזירה...
      </div>
    );
  }

  const selectedAsset = showArsenal ? assets.find((a) => a.id === showArsenal) : null;

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#020202] font-sans"
      dir="rtl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex items-center justify-center">
        <div className="rounded-full border border-white/10 bg-[#111111]/70 px-4 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#E5E7EB]/85 backdrop-blur-3xl">
          {labels.title}
        </div>
      </div>

      <div className="pointer-events-none fixed left-0 right-0 top-[3.2rem] z-40 flex items-center justify-center gap-2">
        <button
          onClick={() => setFilter('recent')}
          className={`pointer-events-auto rounded-full border px-4 py-1 text-[11px] font-semibold backdrop-blur-3xl transition-all ${
            filter === 'recent'
              ? 'border-white/25 bg-white/10 text-[#E5E7EB]'
              : 'border-white/10 bg-[#111111]/65 text-[#E5E7EB]/50 hover:text-[#E5E7EB]/75'
          }`}
        >
          {labels.recent}
        </button>
        <button
          onClick={() => setFilter('trending')}
          className={`pointer-events-auto rounded-full border px-4 py-1 text-[11px] font-semibold backdrop-blur-3xl transition-all ${
            filter === 'trending'
              ? 'border-[#007AFF]/45 bg-[#007AFF]/15 text-[#E5E7EB]'
              : 'border-white/10 bg-[#111111]/65 text-[#E5E7EB]/50 hover:text-[#E5E7EB]/75'
          }`}
        >
          {labels.trending}
        </button>
      </div>

      <div ref={containerRef} className="hide-scrollbar h-[100dvh] w-full flex-1 snap-y snap-mandatory overflow-y-scroll">
        {assets.map((asset, index) => (
          <AssetCard
            key={`${asset.id}-${index}`}
            asset={asset}
            currentUser={currentUser}
            inventory={inventory}
            setShowArsenal={setShowArsenal}
            handleShare={handleShare}
            handleTakeover={handleTakeover}
            actionId={actionId}
            labels={labels}
          />
        ))}
      </div>

      <AnimatePresence>
        {showArsenal && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 210 }}
            className="fixed bottom-[122px] left-4 right-4 z-50 flex h-40 flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111111]/88 shadow-[0_24px_60px_rgba(0,0,0,0.78)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#E5E7EB]">
                <Backpack size={14} />
                {labels.arsenal}
              </span>
              <button
                onClick={() => setShowArsenal(null)}
                className="rounded-full border border-white/15 bg-black/35 p-1.5 text-[#E5E7EB]/70 transition-colors hover:text-[#E5E7EB]"
                aria-label="סגירה"
              >
                <X size={14} />
              </button>
            </div>

            <div className="hide-scrollbar flex flex-1 snap-x items-center gap-2.5 overflow-x-auto px-4">
              {inventory.length === 0 ? (
                <div className="w-full text-center text-[10px] font-semibold text-[#E5E7EB]/35">הארסנל ריק</div>
              ) : (
                inventory.map((item, idx) => {
                  const power = POWERS_DICT[item.power_id];
                  if (!power) return null;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => void handleUsePower(item.power_id, selectedAsset)}
                      className="group h-24 w-24 shrink-0 snap-center rounded-2xl border border-white/10 bg-[#0C0C0C]/90 transition-all hover:border-[#007AFF]/35"
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-1.5">
                        <power.icon size={20} className={`${power.color} transition-transform group-hover:scale-110`} />
                        <div className="text-center">
                          <h3 className="text-[9px] font-semibold text-[#E5E7EB]">{power.name}</h3>
                          <p className="text-[9px] font-semibold text-[#E5E7EB]/65">x{item.quantity}</p>
                        </div>
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
