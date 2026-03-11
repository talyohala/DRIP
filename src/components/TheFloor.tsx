import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Backpack,
  Biohazard,
  Briefcase,
  ChevronsDown,
  CloudFog,
  Clock,
  Droplet,
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

type LooseRecord = Record<string, any>;

type PowerDefinition = {
  name: string;
  icon: LucideIcon;
  color: string;
  glow: string;
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

const DripCoin = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <div
    className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-emerald-300 to-fuchsia-300 p-[1px] shadow-[0_0_14px_rgba(34,211,238,0.45)] ${className}`}
  >
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#050505]">
      <span className="select-none text-[42%] font-black italic tracking-tighter text-cyan-50/95">DRIP</span>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
    </div>
  </div>
);

const POWERS_DICT: Record<number, PowerDefinition> = {
  7: { name: 'שוגר ראש', icon: Droplet, color: 'text-pink-300', glow: 'drop-shadow-[0_0_8px_rgba(249,168,212,0.9)]' },
  8: { name: 'מסך עשן', icon: CloudFog, color: 'text-slate-200', glow: 'drop-shadow-[0_0_8px_rgba(226,232,240,0.9)]' },
  9: { name: 'שאיבת הייפ', icon: Magnet, color: 'text-fuchsia-300', glow: 'drop-shadow-[0_0_8px_rgba(240,171,252,0.9)]' },
  4: { name: 'הזרקת הייפ', icon: Activity, color: 'text-rose-300', glow: 'drop-shadow-[0_0_8px_rgba(253,164,175,0.9)]' },
  10: { name: 'מגן ניאון', icon: ShieldCheck, color: 'text-emerald-300', glow: 'drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]' },
  1: { name: 'רוח רפאים', icon: Ghost, color: 'text-violet-300', glow: 'drop-shadow-[0_0_8px_rgba(196,181,253,0.9)]' },
  11: { name: 'הכפלת סיכון', icon: ChevronsDown, color: 'text-amber-300', glow: 'drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]' },
  2: { name: 'חומת מגן', icon: ShieldAlert, color: 'text-sky-300', glow: 'drop-shadow-[0_0_8px_rgba(125,211,252,0.9)]' },
  12: { name: 'מס קריפטו', icon: FileText, color: 'text-lime-300', glow: 'drop-shadow-[0_0_8px_rgba(190,242,100,0.9)]' },
  13: { name: 'ניקוי זירה', icon: Target, color: 'text-cyan-300', glow: 'drop-shadow-[0_0_8px_rgba(103,232,249,0.9)]' },
  5: { name: 'הרעלה', icon: Biohazard, color: 'text-emerald-300', glow: 'drop-shadow-[0_0_8px_rgba(110,231,183,0.9)]' },
  14: { name: 'מידע פנים', icon: Eye, color: 'text-indigo-300', glow: 'drop-shadow-[0_0_8px_rgba(165,180,252,0.9)]' },
  15: { name: 'עיוות זמן', icon: Hourglass, color: 'text-violet-300', glow: 'drop-shadow-[0_0_8px_rgba(196,181,253,0.9)]' },
  3: { name: 'לוויתן', icon: Sparkles, color: 'text-yellow-300', glow: 'drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]' },
  6: { name: 'פצצת EMP', icon: Radio, color: 'text-cyan-300', glow: 'drop-shadow-[0_0_8px_rgba(103,232,249,0.9)]' },
  16: { name: 'הסנדק', icon: Briefcase, color: 'text-rose-300', glow: 'drop-shadow-[0_0_8px_rgba(253,164,175,0.9)]' },
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

  return (
    <div ref={cardRef} className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-[#050505]">
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
            className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[70%] blur-2xl' : ''}`}
            playsInline
            loop
          />
        ) : (
          <img
            src={asset.media_url}
            className={`h-full w-full object-cover transition-all duration-700 ${isSmoked ? 'grayscale-[70%] blur-2xl' : ''}`}
            alt={asset.title || 'נכס'}
          />
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-[#050505]/35 to-[#050505]/30" />
        {isSmoked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CloudFog size={100} className="animate-pulse text-white/25" />
          </div>
        )}

        <div className="absolute right-4 top-20 flex flex-col gap-2">
          {isOwnerGodfather && (
            <div className="flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-300/10 px-2 py-1 backdrop-blur-2xl">
              <Briefcase size={10} className="text-rose-200" />
              <span className="text-[8px] font-black uppercase tracking-widest text-rose-100">הסנדק</span>
            </div>
          )}
          {hasInsiderInfo && asset.taxed_by && (
            <div className="animate-pulse rounded-full border border-lime-300/35 bg-lime-300/10 px-2 py-1 backdrop-blur-2xl">
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-lime-100">
                <FileText size={10} className="text-lime-200" />
                מלכודת מס
              </span>
            </div>
          )}
        </div>

        {hype <= 20 && (
          <div className="absolute bottom-[158px] left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/35 bg-rose-400/15 shadow-[0_0_20px_rgba(244,114,182,0.4)] backdrop-blur-2xl">
            <Clock size={14} className="absolute text-rose-200/30" />
            <span className="relative z-10 text-[11px] font-black text-rose-50">{hype}m</span>
          </div>
        )}

        <div className="pointer-events-auto absolute bottom-[128px] right-4 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              void handleShare(asset);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all hover:border-cyan-200/45 hover:text-cyan-100 active:scale-95"
            aria-label="שיתוף"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArsenal(asset.id);
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all hover:border-emerald-200/40 hover:text-emerald-100 active:scale-95"
            aria-label="ארסנל"
          >
            <Backpack size={18} />
            {inventory.length > 0 && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-black/60 bg-cyan-300 text-[9px] font-black text-black shadow-[0_0_10px_rgba(34,211,238,0.7)]">
                {inventory.reduce((a: number, c: LooseRecord) => a + c.quantity, 0)}
              </div>
            )}
          </button>
        </div>

        <div className="pointer-events-auto absolute bottom-5 left-3 right-3">
          <div className="flex w-full items-center gap-2 rounded-3xl border border-white/10 bg-[#090909]/70 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Wallet size={14} className="text-cyan-300" />
              <span className="flex items-center gap-1.5 text-[13px] font-black tracking-wide text-white">
                {(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')}
                <DripCoin className="h-4 w-4" />
              </span>
            </div>

            <div className="min-w-0 flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-1.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                  isOwnerWhale ? 'border-yellow-300/60 bg-yellow-300/20' : 'border-white/20 bg-black/40'
                }`}
              >
                {isGhosted ? (
                  <Ghost size={16} className="text-white/60" />
                ) : asset.owner?.avatar_url ? (
                  <img src={asset.owner.avatar_url} className="h-full w-full object-cover" alt={asset.owner?.username || 'בעלים'} />
                ) : (
                  <span className="text-sm">🧑🏽‍🚀</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1">
                  <span className={`truncate text-[12px] font-black ${isOwnerWhale ? 'text-yellow-200' : 'text-white'}`}>
                    {isGhosted ? 'מוסתר' : asset.owner?.username || 'בעלים לא ידוע'}
                  </span>
                  {!isGhosted && asset.owner?.is_verified && <Hexagon size={12} className="shrink-0 fill-cyan-300/20 text-cyan-300" />}
                </div>
                <p className={`truncate text-[10px] font-medium text-white/70 ${isSmoked ? 'blur-sm' : ''}`}>{asset.title}</p>
              </div>

              <div className="flex w-[90px] shrink-0 flex-col items-end gap-1">
                <div className="flex w-full items-center justify-end gap-1">
                  {hasDoubleDecay && <ChevronsDown size={10} className="text-amber-300" />}
                  {hasTimeWarp && <Hourglass size={10} className="text-violet-300" />}
                  <span className="text-[10px] font-black text-cyan-200">{hype}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/50">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 shadow-[0_0_10px_rgba(34,211,238,0.75)]"
                    animate={{ width: `${hype}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isMine ? (
                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{labels.yours}</span>
                </div>
              ) : isFrozen ? (
                <div className="flex items-center gap-1.5 rounded-2xl border border-sky-300/35 bg-sky-300/12 px-4 py-2.5 text-sky-100">
                  <Lock size={13} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{labels.frozen}</span>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    void handleTakeover(asset, activeValue, e);
                  }}
                  disabled={actionId === asset.id || (currentUser?.drip_coins ?? 0) < activeValue}
                  className={`flex rounded-2xl border px-3 py-2.5 transition-all active:scale-95 ${
                    actionId === asset.id
                      ? 'border-cyan-300 bg-cyan-300 text-black'
                      : 'border-cyan-300/35 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25'
                  }`}
                >
                  {actionId === asset.id ? (
                    <Loader2 size={16} className="animate-spin text-cyan-800" />
                  ) : (
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[9px] font-bold uppercase tracking-widest">{labels.takeover}</span>
                      <span className="flex items-center gap-1.5 text-[13px] font-black">
                        {activeValue.toLocaleString('he-IL')}
                        <DripCoin className="h-4 w-4" />
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
  );
};

export default function TheFloor() {
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
    title: 'DRIP',
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
  }, [filter]);

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
        title: `${asset.title} - DRIP`,
        text: `בדקו את הנכס הזה ב-DRIP. בבעלות ${asset.owner?.username || 'משתמש אנונימי'}`,
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
      <div className="grid h-[100dvh] w-full place-items-center bg-[#050505] text-sm text-white/70">
        טוען את זירת DRIP...
      </div>
    );
  }

  const selectedAsset = showArsenal ? assets.find((a) => a.id === showArsenal) : null;

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#050505] font-sans"
      dir="rtl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex items-center justify-center">
        <div className="rounded-full border border-white/10 bg-[#080808]/75 px-4 py-1.5 text-[11px] font-black tracking-[0.3em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.2)] backdrop-blur-2xl">
          {labels.title}
        </div>
      </div>

      <div className="pointer-events-none fixed left-0 right-0 top-14 z-40 flex items-center justify-center gap-5">
        <button
          onClick={() => setFilter('recent')}
          className={`pointer-events-auto rounded-full border px-4 py-1.5 text-[12px] font-black uppercase tracking-[0.15em] backdrop-blur-2xl transition-all ${
            filter === 'recent'
              ? 'border-white/35 bg-white/10 text-white shadow-[0_0_24px_rgba(255,255,255,0.12)]'
              : 'border-white/10 bg-black/30 text-white/45 hover:text-white/75'
          }`}
        >
          {labels.recent}
        </button>
        <button
          onClick={() => setFilter('trending')}
          className={`pointer-events-auto rounded-full border px-4 py-1.5 text-[12px] font-black uppercase tracking-[0.15em] backdrop-blur-2xl transition-all ${
            filter === 'trending'
              ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
              : 'border-white/10 bg-black/30 text-white/45 hover:text-white/75'
          }`}
        >
          {labels.trending}
        </button>
      </div>

      <div ref={containerRef} className="no-scrollbar h-[100dvh] w-full flex-1 snap-y snap-mandatory overflow-y-scroll">
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
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 210 }}
            className="fixed bottom-[112px] left-4 right-4 z-50 flex h-40 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/88 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-200">
                <Backpack size={14} />
                {labels.arsenal}
              </span>
              <button
                onClick={() => setShowArsenal(null)}
                className="rounded-full border border-white/15 bg-black/40 p-1.5 text-white/60 transition-colors hover:text-white"
                aria-label="סגירה"
              >
                <X size={14} />
              </button>
            </div>

            <div className="no-scrollbar flex flex-1 snap-x items-center gap-3 overflow-x-auto px-5">
              {inventory.length === 0 ? (
                <div className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-white/30">הארסנל ריק</div>
              ) : (
                inventory.map((item, idx) => {
                  const power = POWERS_DICT[item.power_id];
                  if (!power) return null;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => void handleUsePower(item.power_id, selectedAsset)}
                      className="group h-24 w-24 shrink-0 snap-center rounded-2xl border border-white/10 bg-[#121212] transition-all hover:border-cyan-300/40 hover:bg-white/[0.06]"
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-1.5">
                        <power.icon size={22} className={`${power.color} ${power.glow} transition-transform group-hover:scale-110`} />
                        <div className="text-center">
                          <h3 className="text-[9px] font-black text-white">{power.name}</h3>
                          <p className="text-[8px] font-bold text-cyan-300">x{item.quantity}</p>
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
