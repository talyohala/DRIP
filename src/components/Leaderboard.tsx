import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Hexagon, Star, Flame, Wallet, Skull, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const isHe = navigator.language.startsWith('he');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const t = {
    he: { title: 'חדר מלחמה', subtitle: 'דירוג הלוויתנים העולמי', netWorth: 'שווי נקי', rank: 'מקום' },
    en: { title: 'WAR ROOM', subtitle: 'GLOBAL WHALE RANKING', netWorth: 'NET WORTH', rank: 'RANK' }
  }[isHe ? 'he' : 'en'];

  useEffect(() => {
    loadData();
    // האזנה לשינויים כדי שהטבלה תתעדכן בלייב כשמישהו מתעשר!
    const channel = supabase.channel('leaderboard-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drip_users' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
      setCurrentUser(userData);
    }

    // מביא את 50 העשירים ביותר
    const { data } = await supabase
      .from('drip_users')
      .select('*')
      .order('drip_coins', { ascending: false })
      .limit(50);
      
    if (data) setLeaders(data);
    setLoading(false);
  };

  if (loading) return null;

  const topThree = leaders.slice(0, 3);
  const theRest = leaders.slice(3);

  // פונקציית עזר לסידור הפודיום (מקום 2 משמאל, 1 באמצע, 3 מימין)
  const getPodiumOrder = () => {
    if (topThree.length === 0) return [];
    if (topThree.length === 1) return [topThree[0]];
    if (topThree.length === 2) return [topThree[1], topThree[0]];
    return [topThree[1], topThree[0], topThree[2]];
  };

  return (
    <div className="min-h-screen bg-[#020202] pb-32 font-sans relative overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* רקע יוקרתי - זהב שחור */}
      <div className="fixed top-0 left-0 w-full h-96 bg-yellow-900/10 blur-[120px] pointer-events-none z-0" />
      
      {/* הדר מרחף */}
      <div className="px-5 pt-6 pb-4 fixed top-0 left-0 right-0 z-50 bg-[#020202]/80 backdrop-blur-2xl flex justify-between items-center border-b border-white/5 shadow-lg">
        <h1 className="text-2xl font-black tracking-widest uppercase italic text-white flex items-center gap-2 drop-shadow-md">
          <Trophy size={22} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
          {t.title}
        </h1>
        <div className="flex items-center gap-2 bg-[#0a0a0a]/80 px-4 py-2 rounded-full border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <Wallet size={14} className="text-yellow-400" />
          <span className="text-yellow-400 font-black text-sm tracking-wide">{currentUser?.drip_coins?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="pt-32 px-5 max-w-md mx-auto relative z-10">
        <p className="text-[11px] font-black tracking-[0.15em] text-yellow-400/50 uppercase text-center mb-10 drop-shadow-md">
          {t.subtitle}
        </p>

        {/* פודיום 3 הגדולים */}
        <div className="flex justify-center items-end gap-3 mb-12 h-56">
          {getPodiumOrder().map((user, index) => {
            // חישוב המיקום האמיתי (1, 2 או 3) לפי הסידור של הפודיום
            const realRank = topThree.length === 3 ? (index === 0 ? 2 : index === 1 ? 1 : 3) : (index === 0 ? 2 : 1);
            const isFirst = realRank === 1;
            const isSecond = realRank === 2;
            const isThird = realRank === 3;

            const height = isFirst ? 'h-48' : isSecond ? 'h-40' : 'h-32';
            const color = isFirst ? 'from-yellow-400 to-yellow-600 border-yellow-400' : 
                          isSecond ? 'from-slate-300 to-slate-500 border-slate-300' : 
                          'from-orange-400 to-orange-700 border-orange-400';
            const glow = isFirst ? 'shadow-[0_0_30px_rgba(234,179,8,0.4)]' : '';

            return (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: realRank * 0.1, type: "spring", stiffness: 100 }}
                className={`w-28 flex flex-col items-center relative cursor-pointer`}
                onClick={() => window.location.hash = `user_${user.id}`}
              >
                {/* כתר לראשון */}
                {isFirst && <Crown size={28} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,1)] absolute -top-8 z-20" />}
                
                {/* תמונת פרופיל */}
                <div className={`w-14 h-14 rounded-full border-2 ${color.split(' ')[2]} flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md mb-3 z-10 ${glow}`}>
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <span className="text-lg">🧑🏽‍🚀</span>}
                </div>

                {/* עמוד הפודיום */}
                <div className={`w-full ${height} bg-gradient-to-t ${color} rounded-t-2xl flex flex-col items-center pt-3 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/40" /> {/* הצללה לעומק */}
                  <span className="text-3xl font-black text-white/90 drop-shadow-lg z-10">{realRank}</span>
                  <div className="z-10 mt-auto pb-4 flex flex-col items-center w-full px-1">
                    <span className="text-[10px] font-black text-white uppercase truncate w-full text-center drop-shadow-md">{user.username}</span>
                    <span className="text-[9px] font-bold text-black bg-white/90 px-2 py-0.5 rounded-full mt-1">{user.drip_coins >= 1000 ? (user.drip_coins / 1000).toFixed(1) + 'k' : user.drip_coins} 💧</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* רשימת שאר השחקנים (מקום 4 והלאה) */}
        <div className="space-y-3">
          {theRest.map((user, index) => {
            const rank = index + 4;
            const isMe = currentUser?.id === user.id;

            return (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.05) }}
                onClick={() => window.location.hash = `user_${user.id}`}
                className={`flex items-center gap-4 p-3 rounded-2xl border cursor-pointer transition-colors
                  ${isMe ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-[#0a0a0a] border-white/5 hover:bg-white/5'}`}
              >
                {/* מספר מיקום */}
                <div className="w-8 text-center shrink-0">
                  <span className="text-sm font-black text-white/40">{rank}</span>
                </div>

                {/* תמונה */}
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black/60 shrink-0">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <span className="text-sm">🧑🏽‍🚀</span>}
                </div>

                {/* פרטים */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-sm font-black truncate ${isMe ? 'text-cyan-400' : 'text-white'}`}>{user.username}</h3>
                    {user.is_verified && <Hexagon size={12} className="text-cyan-400 fill-cyan-400/20 shrink-0" />}
                    {user.godfather_until && new Date(user.godfather_until) > new Date() && <Briefcase size={10} className="text-red-400 shrink-0" />}
                  </div>
                  {isMe && <span className="text-[8px] uppercase tracking-widest text-cyan-400/60 font-bold">You</span>}
                </div>

                {/* סכום */}
                <div className="flex items-center gap-1.5 shrink-0 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="text-cyan-400 text-[10px]">💧</span>
                  <span className="text-xs font-black text-white">{user.drip_coins.toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
