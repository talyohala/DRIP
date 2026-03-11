import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoinIcon';

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
      <div className="grid h-full place-items-center text-sm text-[#E5E7EB]/65">
        טוען את הדירוג...
      </div>
    );
  }

  return (
    <section className="h-full overflow-y-auto px-4 pb-32 pt-6">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-4 rounded-[1.9rem] border border-white/10 bg-[#111111]/78 p-4 backdrop-blur-3xl">
          <h1 className="text-2xl font-semibold text-[#E5E7EB]">חמ״ל דירוג</h1>
          <p className="mt-2 text-xs text-[#E5E7EB]/58">טבלת עוצמה חיה עם עדכון רציף של בעלי הון בזירה.</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#007AFF]/35 bg-[#007AFF]/12 px-3 py-1.5 text-[11px] font-semibold text-[#E5E7EB]">
            יתרה אישית
            <span>{(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')}</span>
            <DripCoinIcon />
          </div>
        </header>

        <div className="space-y-2.5">
          {leaders.map((user, index) => {
            const rank = index + 1;
            const isMe = currentUser?.id === user.id;
            const isLeader = rank === 1;
            return (
              <motion.button
                key={user.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => {
                  window.location.hash = `user_${user.id}`;
                }}
                className={`flex w-full items-center gap-3 rounded-[1.2rem] border p-3 text-right backdrop-blur-3xl transition ${
                  isMe
                    ? 'border-[#007AFF]/45 bg-[#007AFF]/10'
                    : isLeader
                      ? 'border-[#D4AF37]/35 bg-[#111111]/82'
                      : 'border-white/10 bg-[#111111]/75 hover:border-white/20'
                }`}
              >
                <div className="w-7 text-center text-base font-semibold text-[#E5E7EB]/75">{rank}</div>
                <div
                  className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border ${
                    isLeader ? 'border-[#D4AF37]/45' : 'border-white/20'
                  } bg-black/40`}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.username || 'משתמש'} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm">🧑🏽‍🚀</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-semibold ${isMe ? 'text-[#E5E7EB]' : 'text-[#E5E7EB]/90'}`}>{user.username || 'ללא שם'}</p>
                    {isLeader && <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />}
                  </div>
                  {isMe && <p className="mt-0.5 text-[10px] font-semibold text-[#007AFF]">החשבון שלך</p>}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[11px] font-semibold text-[#E5E7EB]">
                  {(user.drip_coins ?? 0).toLocaleString('he-IL')}
                  <DripCoinIcon />
                </div>
              </motion.button>
            );
          })}
        </div>

        {leaders.length === 0 && (
          <div className="mt-8 rounded-[1.2rem] border border-white/10 bg-[#111111]/75 p-4 text-center text-sm text-[#E5E7EB]/55">
            אין נתונים כרגע
          </div>
        )}

        <div className="mt-6 mb-2 flex items-center justify-center gap-2 text-[11px] font-medium text-[#E5E7EB]/50">
          <Activity size={13} className="text-[#007AFF]" />
          העדכון פועל בזמן אמת
        </div>
      </div>
    </section>
  );
}
