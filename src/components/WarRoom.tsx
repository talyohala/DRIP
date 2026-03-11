import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Hexagon, Loader2, Target } from 'lucide-react';
import { DripCoin } from './ui/DripCoin';

export default function WarRoom() {
  const isHe = navigator.language.startsWith('he');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const t = {
    myRank: isHe ? 'המיקום שלי' : 'MY RANK',
    worth: isHe ? 'שווי נקי' : 'NET WORTH',
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('leaderboard-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drip_users' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('drip_users').select('*').order('drip_coins', { ascending: false }).limit(50);
    if (data) {
      setLeaders(data);
      if (user) {
        const myIndex = data.findIndex(u => u.id === user.id);
        if (myIndex !== -1) setMyRank(myIndex + 1);
        const { data: userData } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
        setCurrentUser(userData);
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-[100dvh] bg-black flex items-center justify-center"><Loader2 className="animate-spin text-yellow-400" size={32} /></div>;

  const topThree = leaders.slice(0, 3);
  const theRest = leaders.slice(3);
  const getPodiumOrder = () => {
    if (topThree.length === 0) return [];
    if (topThree.length === 1) return [topThree[0]];
    if (topThree.length === 2) return [topThree[1], topThree[0]];
    return [topThree[1], topThree[0], topThree[2]];
  };

  return (
    <div className="min-h-[100dvh] bg-black pb-32 font-sans relative overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90vw] h-[50vh] bg-yellow-600/30 blur-[130px] pointer-events-none z-0 rounded-full" />
      <div className="px-4 max-w-md mx-auto relative z-10 pt-8">
        
        {/* Sticky Wallet / My Rank */}
        <div className="sticky top-5 z-50 mb-12">
          <div className="bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-between">
            <div className="flex flex-col items-center justify-center px-4 border-l border-white/10">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t.myRank}</span>
              <div className="flex items-center gap-1.5">
                <Target size={14} className={myRank ? "text-yellow-400" : "text-white/30"} />
                <span className={`text-2xl font-black ${myRank ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-white/30"}`}>{myRank ? `#${myRank}` : '-'}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t.worth}</span>
              <div className="text-xl font-black text-white flex items-center gap-2 tracking-wide drop-shadow-md">
                {currentUser?.drip_coins?.toLocaleString() || 0} <DripCoin className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Podium Top 3 */}
        <motion.div layout className="flex justify-center items-end gap-3 mb-16 h-64 mt-8">
          <AnimatePresence>
            {getPodiumOrder().map((user, index) => {
              const realRank = topThree.length === 3 ? (index === 0 ? 2 : index === 1 ? 1 : 3) : (index === 0 ? 2 : 1);
              const isFirst = realRank === 1;
              const isSecond = realRank === 2;
              const height = isFirst ? 'h-60' : isSecond ? 'h-48' : 'h-40';
              const color = isFirst ? 'from-yellow-500/20 to-yellow-900/40 border-yellow-500/50' : isSecond ? 'from-slate-400/20 to-slate-800/40 border-slate-400/50' : 'from-orange-500/20 to-orange-900/40 border-orange-500/50';
              const textColor = isFirst ? 'text-yellow-400' : isSecond ? 'text-slate-300' : 'text-orange-400';
              const formattedCoins = user.drip_coins >= 1000000 ? (user.drip_coins / 1000000).toFixed(2) + 'M' : user.drip_coins >= 1000 ? (user.drip_coins / 1000).toFixed(1) + 'k' : user.drip_coins;

              return (
                <motion.div key={user.id} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: realRank * 0.1, type: "spring", stiffness: 100 }} className="w-28 flex flex-col items-center relative cursor-pointer group" onClick={() => window.location.hash = `user_${user.id}`}>
                  {isFirst && <Crown size={36} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,1)] absolute -top-14 z-20" />}
                  <div className={`w-16 h-16 rounded-full border-[2px] flex items-center justify-center overflow-hidden bg-[#0a0a0a] mb-4 z-10 transition-transform duration-300 group-hover:scale-110 shadow-2xl ${isFirst ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-white/20'}`}>
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xl">🧑🏽‍🚀</span>}
                  </div>
                  <div className={`w-full ${height} bg-gradient-to-t ${color} rounded-t-[24px] border-t border-x flex flex-col items-center pt-5 relative overflow-hidden backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
                    <span className={`text-[40px] leading-none font-black opacity-90 ${textColor} drop-shadow-lg`}>{realRank}</span>
                    <div className="mt-auto pb-5 flex flex-col items-center w-full px-2 gap-2">
                      <span className="text-[11px] font-black text-white uppercase truncate w-full text-center tracking-wider drop-shadow-md">{user.username}</span>
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-black/60 border border-white/10 ${textColor} shadow-inner`}>
                        {formattedCoins} <DripCoin className="w-2.5 h-2.5 opacity-80" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* List of The Rest */}
        <motion.div layout className="space-y-4 pb-20">
          <AnimatePresence>
            {theRest.map((user, index) => {
              const rank = index + 4;
              const isMe = currentUser?.id === user.id;
              return (
                <motion.div key={user.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + (index * 0.05), type: "spring" }} onClick={() => window.location.hash = `user_${user.id}`} className={`flex items-center gap-4 p-4 rounded-[24px] border cursor-pointer transition-all duration-300 backdrop-blur-2xl ${isMe ? 'bg-yellow-900/20 border-yellow-500/40 shadow-[0_10px_30px_rgba(234,179,8,0.2)] scale-[1.02]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] shadow-[0_5px_20px_rgba(0,0,0,0.4)] hover:scale-[1.01]'}`}>
                  <div className="w-8 text-center shrink-0">
                    <span className={`text-[13px] font-black ${isMe ? 'text-yellow-400 drop-shadow-md' : 'text-white/30'}`}>{rank}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-full border-[1.5px] flex items-center justify-center overflow-hidden bg-[#0a0a0a] shrink-0 ${isMe ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'border-white/10'}`}>
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover opacity-90" /> : <span className="text-sm">🧑🏽‍🚀</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[13px] font-black uppercase tracking-wider truncate drop-shadow-sm ${isMe ? 'text-yellow-400' : 'text-white/90'}`}>{user.username}</h3>
                      {user.is_verified && <Hexagon size={14} className="text-cyan-400 fill-cyan-400/20 shrink-0" />}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 justify-center">
                    <span className="text-[14px] font-black text-white flex items-center gap-1.5 drop-shadow-lg">
                      {user.drip_coins.toLocaleString()} <DripCoin className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
