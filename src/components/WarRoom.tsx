import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Shield, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoin';

type LooseRecord = Record<string, any>;

export default function WarRoom() {
  const [leaders, setLeaders] = useState<LooseRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<LooseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drip_users' }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
      setCurrentUser(me);
    }

    const { data } = await supabase.from('drip_users').select('*').order('drip_coins', { ascending: false }).limit(50);
    if (data) setLeaders(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid h-full place-items-center text-sm text-white/65">
        טוען את דירוג השוק...
      </div>
    );
  }

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const podium = topThree.length < 3 ? topThree : [topThree[1], topThree[0], topThree[2]];

  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 rounded-3xl border border-white/10 bg-white/[0.02] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-black text-white">
            <Trophy size={22} className="text-yellow-300 drop-shadow-[0_0_16px_rgba(234,179,8,0.7)]" />
            חמ"ל דירוג
          </h1>
          <p className="mt-2 text-xs text-white/65">מצב הליגה החיה של בעלי ההון המובילים בזירה.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100">
            יתרה אישית:
            <span className="font-black text-white">{(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')}</span>
            <DripCoinIcon className="h-4" />
          </div>
        </header>

        <div className="mb-7 flex h-64 items-end justify-center gap-3">
          <AnimatePresence>
            {podium.map((user, index) => {
              const rank = podium.length < 3 ? index + 1 : index === 1 ? 1 : index === 0 ? 2 : 3;
              const isFirst = rank === 1;
              const columnHeight = isFirst ? 'h-52' : rank === 2 ? 'h-44' : 'h-36';
              const tone = isFirst
                ? 'from-yellow-300/90 to-yellow-600/95 border-yellow-300/60 shadow-[0_0_30px_rgba(234,179,8,0.45)]'
                : rank === 2
                  ? 'from-slate-200/90 to-slate-500/90 border-slate-200/50'
                  : 'from-amber-400/85 to-amber-700/90 border-amber-300/45';

              return (
                <motion.button
                  key={user.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative w-28"
                  onClick={() => {
                    window.location.hash = `user_${user.id}`;
                  }}
                >
                  {isFirst && (
                    <Crown
                      size={26}
                      className="absolute -top-10 left-1/2 z-20 -translate-x-1/2 text-yellow-300 drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]"
                    />
                  )}
                  <div className="mb-3 flex justify-center">
                    <div className="h-16 w-16 overflow-hidden rounded-full border border-white/25 bg-black/45 shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.username || 'משתמש'} />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg">🧑🏽‍🚀</div>
                      )}
                    </div>
                  </div>
                  <div className={`relative overflow-hidden rounded-t-3xl border bg-gradient-to-t ${tone} ${columnHeight}`}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative flex h-full flex-col items-center pt-3">
                      <span className="text-4xl font-black text-white/90">{rank}</span>
                      <div className="mt-auto w-full px-2 pb-4">
                        <p className="truncate text-center text-[11px] font-black text-white">{user.username}</p>
                        <div className="mt-1 flex items-center justify-center gap-1 rounded-full border border-white/20 bg-black/35 px-2 py-1 text-[10px] text-white">
                          {(user.drip_coins ?? 0).toLocaleString('he-IL')}
                          <DripCoinIcon className="h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          {rest.map((user, index) => {
            const rank = index + 4;
            const isMe = currentUser?.id === user.id;
            return (
              <motion.button
                key={user.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  window.location.hash = `user_${user.id}`;
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right backdrop-blur-2xl transition ${
                  isMe
                    ? 'border-cyan-300/45 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="w-7 text-center text-sm font-black text-white/45">{rank}</div>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-black/45">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.username || 'משתמש'} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm">🧑🏽‍🚀</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-black ${isMe ? 'text-cyan-100' : 'text-white'}`}>{user.username}</p>
                  {isMe && <p className="mt-0.5 text-[10px] font-bold text-cyan-200/70">החשבון שלך</p>}
                </div>
                <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-xs text-white">
                  {(user.drip_coins ?? 0).toLocaleString('he-IL')}
                  <DripCoinIcon className="h-3.5" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {leaders.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/55">
            אין נתונים כרגע.
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/45">
          <Shield size={14} className="text-emerald-300" />
          הנתונים מתעדכנים בזמן אמת
        </div>
      </div>
    </section>
  );
}
