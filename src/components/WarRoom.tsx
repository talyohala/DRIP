import { motion } from 'framer-motion';
import { Activity, Flame, ShieldAlert, ShoppingBag, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DripCoinBadge } from './DripCoinBadge';

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
        טוען את הדירוג החי...
      </div>
    );
  }

  const stats = useMemo(() => {
    const total = leaders.reduce((sum, user) => sum + (user.drip_coins ?? 0), 0);
    const avg = leaders.length ? total / leaders.length : 0;
    const whales = leaders.filter((user) => (user.drip_coins ?? 0) > avg * 2).length;
    return { total, avg, whales };
  }, [leaders]);

  return (
    <section className="hide-scrollbar h-[100dvh] overflow-y-auto pb-20 pt-5">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4">
        <header className="glass-panel rounded-[2rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black text-white">לוח עוצמה חי</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.location.hash = 'market';
                }}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70"
                title="מעבר למרקט"
              >
                <ShoppingBag size={16} />
              </button>
              <button
                onClick={() => {
                  window.location.hash = 'profile';
                }}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70"
                title="מעבר לכספת"
              >
                <UserRound size={16} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/58">דירוג דינמי שמתעדכן כל שינוי מאזן בזמן אמת.</p>
          <div className="mt-3 flex items-center justify-between">
            <DripCoinBadge amount={(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')} />
            <div className="text-right text-[11px] text-white/60">
              <p>סה״כ שווי הלוח: {stats.total.toLocaleString('he-IL')}</p>
              <p>לווייתנים פעילים: {stats.whales}</p>
            </div>
          </div>
        </header>

        <div className="space-y-2.5">
          {leaders.map((user, index) => {
            const rank = index + 1;
            const isMe = currentUser?.id === user.id;
            const isLeader = rank === 1;
            const isDanger = rank > 1 && (leaders[0]?.drip_coins ?? 0) - (user.drip_coins ?? 0) < 1000;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex w-full items-center gap-3 rounded-[1.2rem] border p-3 text-right backdrop-blur-3xl transition ${
                  isMe
                    ? 'border-[#0A84FF]/45 bg-[#0A84FF]/10'
                    : isLeader
                      ? 'border-[#0A84FF]/50 bg-[#1C1C1E]/85'
                      : 'border-white/10 bg-[#1C1C1E]/75 hover:border-white/20'
                }`}
              >
                <div className="w-7 text-center text-base font-semibold text-white/75">{rank}</div>
                <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border ${isLeader ? 'border-[#0A84FF]/45' : 'border-white/20'} bg-black/40`}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.username || 'משתמש'} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm">🧑🏽‍🚀</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-semibold ${isMe ? 'text-white' : 'text-white/90'}`}>{user.username || 'ללא שם'}</p>
                    {isLeader && <Flame size={12} className="text-[#FF453A]" />}
                  </div>
                  {isMe && <p className="mt-0.5 text-[10px] font-semibold text-[#0A84FF]">החשבון שלך</p>}
                  {isDanger && !isLeader && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF453A]">
                      <ShieldAlert size={10} />
                      קרוב לפסגה
                    </p>
                  )}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[11px] font-semibold text-white">
                  <DripCoinBadge amount={(user.drip_coins ?? 0).toLocaleString('he-IL')} className="py-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {leaders.length === 0 && (
          <div className="mt-8 rounded-[1.2rem] border border-white/10 bg-[#111111]/75 p-4 text-center text-sm text-white/55">
            אין נתונים כרגע
          </div>
        )}

        <div className="mb-2 mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-white/50">
          <Activity size={13} className="text-[#0A84FF]" />
          העדכון פועל בזמן אמת
        </div>
      </div>
    </section>
  );
}
