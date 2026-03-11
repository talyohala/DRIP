import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Loader2, Wallet, Image as ImageIcon, Hexagon, Star, Coins, Zap, Briefcase, Sparkles } from 'lucide-react';
import Settings from './Settings';
import { toast } from 'react-hot-toast';
import { DripCoin } from './ui/DripCoin';

export default function Profile() {
  const isHe = navigator.language.startsWith('he');
  const [profile, setProfile] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Farming State
  const [pendingYield, setPendingYield] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);

  const t = {
    he: { netWorth: 'שווי כולל', cash: 'הון נזיל', assetsVal: 'שווי נכסים', vault: 'הכספת שלי', empty: 'הכספת ריקה.', yield: 'הכנסה פסיבית', claim: 'אסוף רווחים', noYield: 'אין רווחים לאיסוף' },
    en: { netWorth: 'NET WORTH', cash: 'LIQUID CASH', assetsVal: 'ASSETS VALUE', vault: 'MY VAULT', empty: 'Vault is empty.', yield: 'PASSIVE YIELD', claim: 'CLAIM YIELD', noYield: 'NO YIELD YET' }
  }[isHe ? 'he' : 'en'];

  useEffect(() => {
    loadData();
  }, []);

  const getHype = (lastTakeover: string) => {
    if (!lastTakeover) return 100;
    const last = new Date(lastTakeover).getTime();
    const now = new Date().getTime();
    const diffMinutes = Math.floor((now - last) / (1000 * 60));
    return Math.max(5, 100 - diffMinutes);
  };

  // מנוע חישוב ההכנסה הפסיבית בזמן אמת
  useEffect(() => {
    if (!profile || assets.length === 0) return;

    const calculateYield = () => {
      const lastClaim = new Date(profile.last_claim_at || profile.created_at).getTime();
      const now = new Date().getTime();
      const secondsPassed = Math.floor((now - lastClaim) / 1000);

      let yieldRatePerSecond = 0;
      assets.forEach(a => {
        const hypeMultiplier = getHype(a.last_takeover_at || a.created_at) / 100;
        yieldRatePerSecond += (a.current_value * 0.0001) * hypeMultiplier;
      });

      setPendingYield(secondsPassed * yieldRatePerSecond);
    };

    calculateYield();
    const interval = setInterval(calculateYield, 1000);
    return () => clearInterval(interval);
  }, [profile, assets]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
    const { data: a } = await supabase.from('drip_assets').select('*').eq('owner_id', user.id).order('current_value', { ascending: false });

    if (p && !p.last_claim_at) {
      await supabase.from('drip_users').update({ last_claim_at: new Date().toISOString() }).eq('id', user.id);
      p.last_claim_at = new Date().toISOString();
    }

    setProfile(p);
    setAssets(a || []);
    setLoading(false);
  };

  const handleClaim = async () => {
    if (pendingYield < 1 || !profile || isClaiming) return;
    setIsClaiming(true);

    try {
      const yieldToClaim = Math.floor(pendingYield);
      const newBalance = (profile.drip_coins || 0) + yieldToClaim;

      const { error } = await supabase.from('drip_users')
        .update({
          drip_coins: newBalance,
          last_claim_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(isHe ? `נאספו ${yieldToClaim} DRIP` : `CLAIMED ${yieldToClaim} DRIP`, { icon: '💰' });
      setPendingYield(0);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={40} /></div>;
  }

  const cash = profile?.drip_coins || 0;
  const assetsValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalNetWorth = cash + assetsValue + pendingYield;
  const isVerified = totalNetWorth > 500000 || assets.length >= 10 || profile?.is_verified;

  const now = new Date();
  const isWhale = profile?.whale_until && new Date(profile.whale_until) > now;
  const isGodfather = profile?.godfather_until && new Date(profile.godfather_until) > now;

  return (
    <div className="min-h-[100dvh] bg-black pb-32 font-sans relative overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* תאורת אווירה עדינה ברקע */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[40vh] bg-cyan-900/10 blur-[120px] pointer-events-none z-0" />
      
      <AnimatePresence>
        {isSettingsOpen && <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} profile={profile} onUpdate={loadData} />}
      </AnimatePresence>

      {/* כפתור הגדרות מרחף ומינימליסטי בפינה הימנית העליונה */}
      <div className="fixed top-8 right-5 z-40">
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="w-11 h-11 flex items-center justify-center bg-white/5 backdrop-blur-xl text-white/80 hover:text-white rounded-full border border-white/10 transition-all hover:bg-white/10 active:scale-90 shadow-lg"
        >
          <SettingsIcon size={20} strokeWidth={2} />
        </button>
      </div>

      {/* תוכן הפרופיל */}
      <div className="pt-24 px-5 max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Profile Identity - עיצוב נקי */}
        <div className="flex flex-col items-center">
          <div className={`w-28 h-28 rounded-full border-[3px] flex items-center justify-center text-5xl mb-4 shadow-2xl relative overflow-visible shrink-0 bg-[#0a0a0a] ${isWhale ? 'border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.3)]' : isGodfather ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-white/10'}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>🧑🏽‍🚀</span>
            )}
            {isVerified && !isWhale && !isGodfather && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -bottom-1 -right-1 w-9 h-9 bg-black rounded-full border border-white/10 flex items-center justify-center shadow-lg">
                <Hexagon size={20} className="text-cyan-400 fill-cyan-400/20" />
              </motion.div>
            )}
          </div>
          
          <h2 className={`text-[22px] font-black uppercase tracking-widest flex items-center gap-2 ${isWhale ? 'text-yellow-400' : isGodfather ? 'text-red-500' : 'text-white'}`}>
            {profile?.username}
          </h2>

          {/* סטטוסים מיוחדים צפים */}
          <div className="flex items-center gap-2 mt-2.5">
            {isGodfather && (
              <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                <Briefcase size={12} className="text-red-400"/>
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Godfather</span>
              </div>
            )}
            {isWhale && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles size={12} className="text-yellow-400"/>
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Whale</span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard הון (Net Worth) - זכוכית מינימליסטית 2026 */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[32px] p-7 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">{t.netWorth}</p>
          <div className="text-5xl font-black text-white drop-shadow-lg mb-8 flex items-center justify-center gap-2 tracking-tighter">
            {Math.floor(totalNetWorth).toLocaleString()} <DripCoin className="w-8 h-8" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
            <div className="text-center border-r border-white/5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">
                <Wallet size={14} className="text-white/50" /> {t.cash}
              </div>
              <p className="text-[16px] font-bold text-cyan-400 tracking-wide flex items-center justify-center gap-1.5">
                {Math.floor(cash).toLocaleString()} <DripCoin className="w-3.5 h-3.5" />
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">
                <ImageIcon size={14} className="text-white/50" /> {t.assetsVal}
              </div>
              <p className="text-[16px] font-bold text-white/90 tracking-wide flex items-center justify-center gap-1.5">
                {Math.floor(assetsValue).toLocaleString()} <DripCoin className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </div>

        {/* Farming Section - מנוע הכסף הפסיבי בעיצוב 2026 */}
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-cyan-500/20 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden mt-6">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-400/10 blur-[60px] rounded-full pointer-events-none z-0" />
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                <Coins size={18} className="text-cyan-400" />
              </div>
              <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest">{t.yield}</h3>
            </div>
            {pendingYield > 0 && <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_12px_#22d3ee]" />}
          </div>

          <div className="text-4xl font-black text-white tracking-tighter mb-8 font-mono relative z-10 drop-shadow-md flex items-center gap-2.5">
            {pendingYield.toFixed(4)} <DripCoin className="w-7 h-7" />
          </div>

          <button
            onClick={handleClaim}
            disabled={pendingYield < 1 || isClaiming}
            className="w-full relative z-10 bg-cyan-400 text-black py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:grayscale shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isClaiming ? <Loader2 size={18} className="animate-spin" /> : <><Zap size={18} fill="currentColor" /> {pendingYield < 1 ? t.noYield : t.claim}</>}
          </button>
        </div>

        {/* My Vault - הכספת */}
        <div className="space-y-5 pt-8">
          <h3 className="text-[12px] font-black text-white/50 uppercase px-2 flex items-center gap-2.5 tracking-widest">
            {t.vault} <span className="bg-white/10 text-white/80 px-2.5 py-1 rounded-lg text-[10px]">{assets.length}</span>
          </h3>

          {assets.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-white/10 rounded-[32px] bg-white/[0.02] backdrop-blur-md shadow-inner">
              <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest">{t.empty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pb-10">
              {assets.map((asset) => {
                const hype = getHype(asset.last_takeover_at || asset.created_at);
                const isVideoAsset = asset.media_url.endsWith('.mp4') || asset.media_url.endsWith('.mov') || asset.media_url.endsWith('.webm');
                
                return (
                  <div key={asset.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[24px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative">
                    <div className="aspect-square relative bg-black">
                      {isVideoAsset ? (
                        <video src={asset.media_url} muted loop autoPlay playsInline className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <img src={asset.media_url} className="w-full h-full object-cover opacity-90" />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 pointer-events-none" />
                      
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee]" style={{ opacity: Math.max(0.2, hype / 100) }} />
                        <span className="text-[9px] font-black text-cyan-300">{hype}%</span>
                      </div>

                      <div className="absolute bottom-4 left-3 right-3">
                        <h4 className="text-[12px] font-bold text-white/90 truncate mb-1.5 drop-shadow-md">{asset.title}</h4>
                        <span className="text-[12px] text-cyan-400 font-black drop-shadow-md flex items-center gap-1.5">
                          {asset.current_value.toLocaleString()} <DripCoin className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
