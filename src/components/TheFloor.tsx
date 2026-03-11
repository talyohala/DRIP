import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Zap, TrendingUp, Clock, X, Loader2, Hexagon, Star, Crown, Wallet,
  Backpack, Activity, Biohazard, Droplet, CloudFog, Magnet, ShieldCheck, 
  Ghost, ChevronsDown, ShieldAlert, FileText, Target, Eye, Hourglass, Sparkles, Radio, Briefcase, Lock, Share2
} from 'lucide-react';

// === מטבע ה-DRIP הרשמי המעוצב ===
const DripCoin = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <div className={`relative rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1px] shadow-[0_0_8px_rgba(34,211,238,0.6)] shrink-0 inline-flex align-middle ${className}`}>
    <div className="w-full h-full bg-[#020202] rounded-full flex items-center justify-center overflow-hidden">
      <span className="text-cyan-50 font-black italic tracking-tighter text-[40%] transform -rotate-12 select-none">
        DRIP
      </span>
    </div>
  </div>
);

const POWERS_DICT: Record<number, any> = {
  7: { name: 'שוגר ראש', icon: Droplet, color: 'text-pink-400', glow: 'drop-shadow-[0_0_8px_rgba(244,113,182,0.8)]' },
  8: { name: 'מסך עשן', icon: CloudFog, color: 'text-slate-300', glow: 'drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]' },
  9: { name: 'שאיבת הייפ', icon: Magnet, color: 'text-fuchsia-400', glow: 'drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' },
  4: { name: 'הזרקת הייפ', icon: Activity, color: 'text-rose-400', glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' },
  10: { name: 'מגן ניאון', icon: ShieldCheck, color: 'text-teal-400', glow: 'drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]' },
  1: { name: 'רוח רפאים', icon: Ghost, color: 'text-purple-400', glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' },
  11: { name: 'הכפלת סיכון', icon: ChevronsDown, color: 'text-orange-400', glow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' },
  2: { name: 'חומת מגן', icon: ShieldAlert, color: 'text-blue-400', glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
  12: { name: 'מס קריפטו', icon: FileText, color: 'text-lime-400', glow: 'drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]' },
  13: { name: 'ניקוי זירה', icon: Target, color: 'text-sky-400', glow: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' },
  5: { name: 'הרעלה', icon: Biohazard, color: 'text-emerald-400', glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' },
  14: { name: 'מידע פנים', icon: Eye, color: 'text-indigo-400', glow: 'drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' },
  15: { name: 'עיוות זמן', icon: Hourglass, color: 'text-violet-400', glow: 'drop-shadow-[0_0_8px_rgba(167,139,250,0.8)]' },
  3: { name: 'לוויתן', icon: Sparkles, color: 'text-yellow-400', glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' },
  6: { name: 'פצצת EMP', icon: Radio, color: 'text-cyan-400', glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' },
  16: { name: 'הסנדק', icon: Briefcase, color: 'text-red-500', glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' }
};

const calculateHype = (asset: any) => {
  const start = new Date(asset.last_takeover_at || asset.created_at).getTime();
  const now = new Date().getTime();
  let mins = Math.floor((now - start) / (1000 * 60));
  if (asset.double_decay_until && new Date(asset.double_decay_until) > new Date()) mins *= 2;
  if (asset.time_warp_until && new Date(asset.time_warp_until) > new Date()) return Math.min(100, 50 + mins);
  return Math.max(5, 100 - mins);
};

const isVideo = (url: string) => ['mp4', 'mov', 'webm', 'quicktime'].includes(url.split('.').pop()?.toLowerCase() || '');

// === כרטיסייה חכמה לכל נכס ===
const AssetCard = ({ asset, index, currentUser, inventory, setShowArsenal, handleShare, handleTakeover, actionId, t, isHe }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [initialDist, setInitialDist] = useState(0);

  const video = isVideo(asset.media_url);
  const hype = calculateHype(asset);
  const isMine = currentUser?.id === asset.owner_id;
  const isCreatorPopular = asset.creator?.is_verified || (asset.creator?.drip_coins > 500000);
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => { if(videoRef.current) { videoRef.current.muted = true; videoRef.current.play(); } });
      } else if (videoRef.current) { videoRef.current.pause(); }
    }, { threshold: 0.6 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      setInitialDist(Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(Math.max(1, Math.min(scale * (dist / initialDist), 4)));
      setInitialDist(dist);
    }
  };

  const handleTouchEnd = () => setScale(1);

  return (
    <div ref={cardRef} className="w-full h-[100dvh] snap-always snap-start relative overflow-hidden bg-black shrink-0">
      
      {/* מדיה עם זום אצבעות */}
      <motion.div 
        className="absolute inset-0 w-full h-full origin-center z-0"
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {video ? (
          <video ref={videoRef} src={asset.media_url} className={`w-full h-full object-cover transition-all duration-700 ${isSmoked ? 'blur-3xl grayscale-[80%]' : ''}`} playsInline loop />
        ) : (
          <img src={asset.media_url} className={`w-full h-full object-cover transition-all duration-700 ${isSmoked ? 'blur-3xl grayscale-[80%]' : ''}`} />
        )}
      </motion.div>

      {/* שכבת ממשק משתמש קבועה */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
        {isSmoked && <div className="absolute inset-0 flex items-center justify-center"><CloudFog size={100} className="text-white/30 animate-pulse" /></div>}

        {/* אינדיקטורים עליונים */}
        <div className="absolute top-28 right-4 flex flex-col gap-2">
          {isOwnerGodfather && <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1"><Briefcase size={10} className="text-red-400"/><span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Godfather</span></div>}
          {hasInsiderInfo && asset.taxed_by && <div className="bg-lime-500/20 border border-lime-500/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 animate-pulse"><FileText size={10} className="text-lime-400"/><span className="text-[8px] font-black text-lime-400 uppercase tracking-widest">Tax Trap</span></div>}
        </div>

        {/* שעון טיימר (מופיע רק כשההייפ נמוך) - ממוקם מעל השם משתמש */}
        {hype <= 20 && (
          <div className="absolute bottom-[150px] right-4 flex flex-col items-center justify-center w-11 h-11 bg-red-500/20 border border-red-500/50 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse z-20">
            <Clock size={16} className="text-red-400 absolute opacity-30" />
            <span className="text-[12px] font-black text-red-100 relative z-10 drop-shadow-md">{hype}m</span>
          </div>
        )}

        {/* פרטי משתמש (ימין מעל הקפסולה) */}
        <div className="absolute bottom-[95px] right-4 pointer-events-auto text-right max-w-[60%]" dir="rtl">
          <div className="flex items-center gap-2.5 cursor-pointer justify-start" onClick={(e) => { e.stopPropagation(); window.location.hash = `user_${asset.owner_id}`; }}>
            <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center overflow-hidden backdrop-blur-md shrink-0 shadow-lg ${isOwnerWhale ? 'border-yellow-400 bg-yellow-900/40' : 'bg-black/60 border-white/20'}`}>
              {isGhosted ? <Ghost size={20} className="text-white/50" /> : asset.owner?.avatar_url ? <img src={asset.owner.avatar_url} className="w-full h-full object-cover" /> : <span className="text-lg">🧑🏽‍🚀</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-start gap-1 mb-0.5">
                <h2 className={`text-sm font-black truncate drop-shadow-md ${isOwnerWhale ? 'text-yellow-400' : 'text-white'}`}>{isGhosted ? 'GHOST' : asset.owner?.username}</h2>
                {!isGhosted && asset.owner?.is_verified && <Hexagon size={14} className="text-cyan-400 fill-cyan-400/20 shrink-0" />}
              </div>
              <p className={`text-[11px] font-medium text-white/80 line-clamp-1 drop-shadow-md ${isSmoked ? 'blur-sm' : ''}`}>{asset.title}</p>
            </div>
          </div>
        </div>

        {/* פעולות (שיתוף וארסנל - שמאל מעל הקפסולה) */}
        <div className="absolute bottom-[95px] left-4 flex flex-col gap-4 items-center pointer-events-auto">
          <button onClick={() => handleShare(asset)} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 transition-all shadow-lg active:scale-90">
            <Share2 size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowArsenal(asset.id); }} className="w-11 h-11 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,0,0,0.8)] active:scale-90 transition-transform hover:bg-white/20 relative">
            <Backpack size={18} className="text-white drop-shadow-md" />
            {inventory.length > 0 && <div className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(34,211,238,0.8)]">{inventory.reduce((a:number,c:any)=>a+c.quantity,0)}</div>}
          </button>
        </div>

        {/* הקפסולה התחתונה המאוחדת */}
        <div className="absolute bottom-5 left-3 right-3 pointer-events-auto">
          <div className="w-full bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]" dir="ltr">
            
            {/* צד שמאל: ארנק משתמש + DripCoin */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 rounded-2xl shrink-0">
              <Wallet size={14} className="text-cyan-400" />
              <span className="text-white font-black text-[14px] flex items-center gap-1.5 tracking-wide">
                {currentUser?.drip_coins?.toLocaleString() || 0} <DripCoin className="w-4 h-4" />
              </span>
            </div>

            {/* אמצע: מד הייפ ויוצר מובנים בתוך הקפסולה */}
            <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-0 gap-1.5" dir="rtl">
              {asset.creator?.username && !isGhosted && (
                <div className="flex items-center gap-1.5 justify-center w-full">
                  <div className="w-4 h-4 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-500/10 shrink-0">
                    <span className="text-[5px] font-black text-cyan-300 tracking-tighter transform -rotate-12">DRIP</span>
                  </div>
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest truncate max-w-[80px]">
                    {asset.creator.username}
                  </span>
                </div>
              )}
              {/* מד הייפ פנימי */}
              <div className="flex items-center justify-center gap-1.5 w-full max-w-[100px]">
                {hasDoubleDecay && <ChevronsDown size={10} className="text-orange-400 shrink-0" />}
                {hasTimeWarp && <Hourglass size={10} className="text-violet-400 shrink-0" />}
                <span className="text-[10px] font-black text-cyan-300 w-6 text-center shrink-0">{hype}%</span>
                <div className="flex-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <motion.div className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" animate={{ width: `${hype}%` }} />
                </div>
              </div>
            </div>

            {/* צד ימין: כפתור השתלטות + DripCoin */}
            <div className="shrink-0" dir="rtl">
              {isMine ? (
                <div className="bg-white/10 text-white px-5 py-2.5 rounded-2xl flex items-center justify-center border border-white/10">
                  <span className="text-[11px] uppercase font-black tracking-widest">{t.yours}</span>
                </div>
              ) : isFrozen ? (
                <div className="bg-blue-900/40 text-blue-200 px-5 py-2.5 rounded-2xl flex items-center gap-1.5 border border-blue-500/30">
                  <Lock size={14} />
                  <span className="text-[11px] uppercase font-black tracking-widest">{t.frozen}</span>
                </div>
              ) : (
                <button 
                  onClick={(e) => handleTakeover(asset, activeValue, e)} 
                  disabled={actionId === asset.id || currentUser?.drip_coins < activeValue} 
                  className={`px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                    actionId === asset.id ? 'bg-cyan-400 border-cyan-400 text-black' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {actionId === asset.id ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : (
                    <>
                      <span className="text-[10px] uppercase font-bold tracking-wider">{t.takeover}</span>
                      <span className="font-black text-[14px] flex items-center gap-1.5">
                        {activeValue.toLocaleString()} <DripCoin className="w-4 h-4" />
                      </span>
                    </>
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
  const isHe = navigator.language.startsWith('he');
  const [assets, setAssets] = useState<any[]>([]);
  const [originalAssets, setOriginalAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'trending' | 'recent'>('recent');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [showArsenal, setShowArsenal] = useState<string | null>(null);

  // משתני Swipe - החלקת אצבע ימינה ושמאלה
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const t = {
    he: { title: 'דריפ', takeover: 'השתלטות', trending: 'חם', recent: 'חדש', yours: 'הנכס שלך', arsenal: 'ארסנל', frozen: 'מוגן' },
    en: { title: 'DRIP', takeover: 'TAKE OVER', trending: 'HOT', recent: 'NEW', yours: 'YOUR ASSET', arsenal: 'ARSENAL', frozen: 'FROZEN' }
  }[isHe ? 'he' : 'en'];

  // חסימת זום דיפולטיבי של הדפדפן (Zoom/Pinch) - כדי שהזום המותאם שלנו יעבוד!
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
    loadUser();
    fetchAssets();
    const channel = supabase.channel('floor-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => fetchAssets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_inventory' }, () => fetchInventory())
      .subscribe();
    const hypeInterval = setInterval(() => setAssets(prev => [...prev]), 60000);
    return () => { supabase.removeChannel(channel); clearInterval(hypeInterval); };
  }, [filter]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
      setCurrentUser(data);
      fetchInventory(user.id);
    }
  };

  const fetchInventory = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data } = await supabase.from('drip_inventory').select('*').eq('user_id', userId).gt('quantity', 0);
    if (data) setInventory(data);
  };

  const fetchAssets = async () => {
    let query = supabase.from('drip_assets').select('*, owner:drip_users!owner_id(username, avatar_url, is_verified, drip_coins, godfather_until), creator:drip_users!creator_id(username, is_verified, drip_coins)');
    if (filter === 'recent') query = query.order('created_at', { ascending: false });
    else query = query.order('current_value', { ascending: false });
    const { data } = await query;
    if (data) {
      setOriginalAssets(data);
      setAssets(data);
    }
    setLoading(false);
  };

  // גלילה אינסופית
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) setAssets(prev => [...prev, ...originalAssets]);
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [originalAssets]);

  // לוגיקת החלקה (Swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 75; // רגישות החלקה

    if (isSwipe) {
      setFilter(prev => prev === 'recent' ? 'trending' : 'recent');
    }
  };

  const handleShare = async (asset: any) => {
    try {
      await navigator.share({
        title: `${asset.title} - DRIP`,
        text: `Check out this asset on DRIP! Owned by ${asset.owner?.username}`,
        url: window.location.href,
      });
    } catch (err) {
      toast.success(isHe ? "הקישור הועתק" : "Link copied");
    }
  };

  const handleUsePower = async (powerId: number, asset: any) => {
    setShowArsenal(null);
    const invItem = inventory.find(i => i.power_id === powerId);
    if (!invItem || invItem.quantity < 1) return toast.error(isHe ? "אין לך את הכוח הזה במלאי" : "Not in inventory");

    try {
      setInventory(prev => prev.map(i => i.id === invItem.id ? { ...i, quantity: i.quantity - 1 } : i));
      const newQuantity = invItem.quantity - 1;
      if (newQuantity > 0) await supabase.from('drip_inventory').update({ quantity: newQuantity }).eq('id', invItem.id);
      else await supabase.from('drip_inventory').delete().eq('id', invItem.id);

      const now = new Date();
      const { data: targetAsset } = await supabase.from('drip_assets').select('*, owner:owner_id(godfather_until)').eq('id', asset.id).single();
      
      const isGodfather = targetAsset?.owner?.godfather_until && new Date(targetAsset.owner.godfather_until) > now;
      const hasNeonShield = targetAsset?.neon_shield_until && new Date(targetAsset.neon_shield_until) > now;

      const checkImmunity = () => {
         if (isGodfather) { toast.error("הבעלים הוא הסנדק! חסין להתקפות 💼", { icon: '💼' }); return true; }
         if (hasNeonShield) { 
            supabase.from('drip_assets').update({ neon_shield_until: null }).eq('id', asset.id).then();
            toast.success("מגן הניאון של הנכס שבר את ההתקפה! 🛡️"); 
            return true; 
         }
         return false;
      };

      if (powerId === 7) { 
        const cTime = new Date(targetAsset.last_takeover_at || targetAsset.created_at);
        await supabase.from('drip_assets').update({ last_takeover_at: new Date(cTime.getTime() + 3*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("שוגר ראש! +5% הייפ 🍬", { icon: '🍬' });
      }
      else if (powerId === 8) { 
        if(checkImmunity()) return fetchAssets();
        await supabase.from('drip_assets').update({ smoked_until: new Date(now.getTime() + 30*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("מסך עשן הופעל! 🌫️", { icon: '🌫️' });
      }
      else if (powerId === 9) { 
        if(checkImmunity()) return fetchAssets();
        const cTime = new Date(targetAsset.last_takeover_at || targetAsset.created_at);
        await supabase.from('drip_assets').update({ last_takeover_at: new Date(cTime.getTime() - 6*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("שאבת 10% הייפ! 🧲", { icon: '🧲' });
      }
      else if (powerId === 4) { 
        await supabase.from('drip_assets').update({ last_takeover_at: now.toISOString() }).eq('id', targetAsset.id);
        toast.success("הייפ במקסימום! 🚀", { icon: '🔥' });
      }
      else if (powerId === 10) { 
        await supabase.from('drip_assets').update({ neon_shield_until: new Date(now.getTime() + 24*60*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("מגן ניאון הופעל על הנכס! 🛡️", { icon: '🛡️' });
      }
      else if (powerId === 1) { 
        await supabase.from('drip_assets').update({ ghosted_until: new Date(now.getTime() + 24*60*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("רוח רפאים - אתה מוסתר! 👻", { icon: '👻' });
      }
      else if (powerId === 11) { 
        if(checkImmunity()) return fetchAssets();
        await supabase.from('drip_assets').update({ double_decay_until: new Date(now.getTime() + 60*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("הכפלת סיכון! ההייפ צונח כפול ⏬", { icon: '⏬' });
      }
      else if (powerId === 2) { 
        await supabase.from('drip_assets').update({ frozen_until: new Date(now.getTime() + 60*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("חומת מגן! ננעל להשתלטות! 🔒", { icon: '🔒' });
      }
      else if (powerId === 12) { 
        if(checkImmunity()) return fetchAssets();
        await supabase.from('drip_assets').update({ taxed_by: currentUser.id }).eq('id', targetAsset.id);
        toast.success("מס קריפטו הוטמן! אחוזים מובטחים 💸", { icon: '💸' });
      }
      else if (powerId === 13) { 
        const { data: cheapest } = await supabase.from('drip_assets').select('*').neq('owner_id', currentUser.id).order('current_value', { ascending: true }).limit(1).single();
        if (cheapest) {
           toast.success("ניקוי זירה! מסתער על נכס... 🧹", { icon: '🧹' });
           handleTakeover(cheapest, cheapest.current_value, null); 
           return;
        }
      }
      else if (powerId === 5) { 
        if(checkImmunity()) return fetchAssets();
        await supabase.from('drip_assets').update({ current_value: Math.floor(targetAsset.current_value * 0.85) }).eq('id', targetAsset.id);
        toast.success("הנכס הורעל! ☠️", { icon: '🧪' });
      }
      else if (powerId === 14) { 
        await supabase.from('drip_users').update({ insider_until: new Date(now.getTime() + 60*60000).toISOString() }).eq('id', currentUser.id);
        toast.success("מידע פנים הופעל לשעה! 👁️", { icon: '👁️' });
      }
      else if (powerId === 15) { 
        await supabase.from('drip_assets').update({ time_warp_until: new Date(now.getTime() + 60*60000).toISOString() }).eq('id', targetAsset.id);
        toast.success("עיוות זמן! ההייפ עולה במקום לרדת ⏳", { icon: '⏳' });
      }
      else if (powerId === 3) { 
        await supabase.from('drip_users').update({ whale_until: new Date(now.getTime() + 24*60*60000).toISOString() }).eq('id', currentUser.id);
        toast.success("סטטוס לוויתן מופעל! ✨", { icon: '✨' });
      }
      else if (powerId === 6) { 
        toast.success("EMP! כאוס בזירה! 📻", { icon: '📻' });
        assets.forEach(async (a) => {
           if (a.id !== targetAsset.id) {
             const tTime = new Date(a.last_takeover_at || a.created_at);
             await supabase.from('drip_assets').update({ last_takeover_at: new Date(tTime.getTime() - 12*60000).toISOString() }).eq('id', a.id);
           }
        });
      }
      else if (powerId === 16) { 
        await supabase.from('drip_users').update({ godfather_until: new Date(now.getTime() + 24*60*60000).toISOString() }).eq('id', currentUser.id);
        toast.success("הסנדק! אתה חסין להכל 💼", { icon: '💼' });
      }
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message);
      fetchInventory();
    }
  };

  const handleTakeover = async (asset: any, activeValue: number, e: React.MouseEvent | null) => {
    if (e) e.stopPropagation();
    if (actionId) return;
    
    if (asset.frozen_until && new Date(asset.frozen_until) > new Date()) return toast.error(isHe ? "הנכס מוגן באמצעות חומת מגן 🛡️" : "Asset is frozen! 🛡️");
    
    setActionId(asset.id);

    try {
      if (!currentUser) throw new Error("Login required");

      const { data: freshAsset } = await supabase.from('drip_assets').select('*, owner:owner_id(godfather_until)').eq('id', asset.id).single();
      if (!freshAsset) throw new Error("Asset not found");
      if (currentUser.id === freshAsset.owner_id) throw new Error(isHe ? "הנכס כבר בבעלותך" : "Already yours");
      if (freshAsset.owner?.godfather_until && new Date(freshAsset.owner.godfather_until) > new Date()) throw new Error("הבעלים הוא הסנדק! אי אפשר להשתלט 💼");

      const { data: buyer } = await supabase.from('drip_users').select('drip_coins').eq('id', currentUser.id).single();
      if (!buyer || buyer.drip_coins < activeValue) throw new Error(isHe ? "אין לך מספיק 💧" : "Not enough 💧");

      const nextPrice = Math.floor(activeValue * 1.2);
      const royalties = Math.floor(activeValue * 0.05);
      let ownerCut = activeValue - royalties;

      if (freshAsset.taxed_by && freshAsset.taxed_by !== currentUser.id) {
         const tax = Math.floor(activeValue * 0.10);
         ownerCut -= tax;
         const { data: taxer } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.taxed_by).single();
         if (taxer) await supabase.from('drip_users').update({ drip_coins: taxer.drip_coins + tax }).eq('id', freshAsset.taxed_by);
         toast.success("שילמת מס קריפטו למישהו שהטמין מלכודת!", { icon: '💸' });
      }

      setCurrentUser((prev: any) => ({ ...prev, drip_coins: prev.drip_coins - activeValue }));
      
      if (freshAsset.owner_id) {
        const { data: oldOwner } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.owner_id).single();
        if (oldOwner) await supabase.from('drip_users').update({ drip_coins: oldOwner.drip_coins + ownerCut }).eq('id', freshAsset.owner_id);
      }

      if (freshAsset.creator_id && freshAsset.creator_id !== freshAsset.owner_id) {
        const { data: creator } = await supabase.from('drip_users').select('drip_coins').eq('id', freshAsset.creator_id).single();
        if (creator) await supabase.from('drip_users').update({ drip_coins: creator.drip_coins + royalties }).eq('id', freshAsset.creator_id);
      }

      await supabase.from('drip_users').update({ drip_coins: buyer.drip_coins - activeValue }).eq('id', currentUser.id);
      await supabase.from('drip_assets').update({ owner_id: currentUser.id, current_value: nextPrice, last_takeover_at: new Date().toISOString(), frozen_until: null, smoked_until: null, taxed_by: null, neon_shield_until: null, ghosted_until: null, double_decay_until: null, time_warp_until: null }).eq('id', asset.id);

      toast.success(isHe ? "השתלטות מוצלחת! הנכס שלך." : "TAKEOVER SUCCESSFUL", { icon: '⚡' });
      fetchAssets();
    } catch (err: any) { 
      toast.error(err.message); 
      fetchAssets(); 
    } finally { 
      setActionId(null); 
    }
  };

  if (loading) return null;

  return (
    <div 
      className="w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans relative" 
      dir={isHe ? 'rtl' : 'ltr'}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
      style={{ touchAction: 'pan-y' }}
    >
      {/* תפריט עליון - חם | חדש גבוה, אלגנטי ומרווח */}
      <div className="fixed top-12 left-0 right-0 z-40 flex items-center justify-center gap-6 pointer-events-none">
        <button 
          onClick={() => setFilter('recent')} 
          className={`pointer-events-auto text-[20px] font-black uppercase tracking-widest transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${filter === 'recent' ? 'text-white scale-110' : 'text-white/40 hover:text-white/80'}`}
        >
          {t.recent}
        </button>
        <span className="text-white/20 text-2xl font-light drop-shadow-md">|</span>
        <button 
          onClick={() => setFilter('trending')} 
          className={`pointer-events-auto text-[20px] font-black uppercase tracking-widest transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${filter === 'trending' ? 'text-white scale-110' : 'text-white/40 hover:text-white/80'}`}
        >
          {t.trending}
        </button>
      </div>

      {/* פיד מסך מלא */}
      <div ref={containerRef} className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar h-[100dvh] w-full">
        {assets.map((asset, index) => (
          <AssetCard 
            key={`${asset.id}-${index}`}
            asset={asset}
            index={index}
            currentUser={currentUser}
            inventory={inventory}
            setShowArsenal={setShowArsenal}
            handleShare={handleShare}
            handleTakeover={handleTakeover}
            actionId={actionId}
            t={t}
            isHe={isHe}
          />
        ))}
      </div>

      {/* תפריט ארסנל (Floating Dock) צף מעל הקפסולה */}
      <AnimatePresence>
        {showArsenal && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-[110px] left-4 right-4 h-40 bg-[#0a0a0a]/90 backdrop-blur-3xl z-50 rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/5 bg-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2"><Backpack size={14}/> {t.arsenal}</span>
              <button onClick={() => setShowArsenal(null)} className="text-white/50 hover:text-white bg-black/50 p-1.5 rounded-full"><X size={14}/></button>
            </div>
            
            <div className="flex-1 overflow-x-auto flex items-center gap-3 px-5 no-scrollbar snap-x">
              {inventory.length === 0 ? (
                <div className="w-full text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">{isHe ? 'הארסנל ריק' : 'ARSENAL EMPTY'}</div>
              ) : (
                inventory.map((item, idx) => {
                  const power = POWERS_DICT[item.power_id];
                  if (!power) return null;
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleUsePower(item.power_id, assets.find(a=>a.id===showArsenal))}
                      className="shrink-0 snap-center w-24 h-24 bg-[#111] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-white/5 hover:border-cyan-500/30 transition-all group"
                    >
                      <power.icon size={22} className={`${power.color} group-hover:scale-110 transition-transform ${power.glow}`} />
                      <div className="text-center">
                        <h3 className="text-[9px] font-black text-white uppercase">{power.name}</h3>
                        <p className="text-[8px] font-bold text-cyan-400">x{item.quantity}</p>
                      </div>
                    </motion.div>
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
