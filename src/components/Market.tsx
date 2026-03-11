import { motion } from 'framer-motion';
import { ArrowUpRight, Flame, Loader2, Radar, Shield, Sparkles, Trophy, UserRound, Wallet, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinBadge } from './DripCoinBadge';
import { POWERS_LIST, type PowerCategory } from './powers';

type LooseRecord = Record<string, any>;
type FilterKey = 'הכל' | PowerCategory;

const FILTERS: FilterKey[] = ['הכל', 'תקיפה', 'הגנה', 'כלכלה'];

type MarketProps = {
  onOpenWarRoom: () => void;
  onOpenProfile: () => void;
};

export default function Market({ onOpenWarRoom, onOpenProfile }: MarketProps) {
  const [currentUser, setCurrentUser] = useState<LooseRecord | null>(null);
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [buyingPowerId, setBuyingPowerId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>('הכל');

  useEffect(() => {
    void loadData();
    const channel = supabase
      .channel('market-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_users' }, () => void loadData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_inventory' }, () => void loadInventory())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async (withInventory = true) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
    setCurrentUser(data);
    if (withInventory) await loadInventory(user.id);
    setLoading(false);
  };

  const loadInventory = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data } = await supabase.from('drip_inventory').select('power_id, quantity').eq('user_id', userId).gt('quantity', 0);
    const next: Record<number, number> = {};
    (data ?? []).forEach((item) => {
      next[item.power_id] = item.quantity;
    });
    setInventory(next);
  };

  const handleBuy = async (powerId: number, price: number) => {
    if (!currentUser) return;
    if ((currentUser.drip_coins ?? 0) < price) {
      toast.error('אין לך מספיק DRIPCOIN לרכישה');
      return;
    }

    setBuyingPowerId(powerId);
    try {
      const { data: existing } = await supabase
        .from('drip_inventory')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('power_id', powerId)
        .maybeSingle();

      if (existing) {
        await supabase.from('drip_inventory').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('drip_inventory').insert({ user_id: currentUser.id, power_id: powerId, quantity: 1 });
      }

      await supabase.from('drip_users').update({ drip_coins: currentUser.drip_coins - price }).eq('id', currentUser.id);
      setCurrentUser((prev) => (prev ? { ...prev, drip_coins: prev.drip_coins - price } : prev));
      setInventory((prev) => ({ ...prev, [powerId]: (prev[powerId] ?? 0) + 1 }));
      toast.success('הרכישה בוצעה והכוח נוסף לארסנל');
    } catch (error: any) {
      toast.error(error?.message || 'רכישה נכשלה');
      await loadData();
    } finally {
      setBuyingPowerId(null);
    }
  };

  const marketPowers = useMemo(() => {
    const list = filter === 'הכל' ? POWERS_LIST : POWERS_LIST.filter((power) => power.category === filter);
    return list;
  }, [filter]);

  const recommendation = useMemo(() => {
    const affordable = POWERS_LIST.filter((power) => (currentUser?.drip_coins ?? 0) >= power.price);
    const missing = affordable.find((power) => (inventory[power.id] ?? 0) === 0);
    return missing || affordable[0] || POWERS_LIST[0];
  }, [currentUser?.drip_coins, inventory]);

  const riskPulse = useMemo(() => {
    const offense = POWERS_LIST.filter((power) => power.category === 'תקיפה').reduce((acc, power) => acc + (inventory[power.id] ?? 0), 0);
    const defense = POWERS_LIST.filter((power) => power.category === 'הגנה').reduce((acc, power) => acc + (inventory[power.id] ?? 0), 0);
    const economy = POWERS_LIST.filter((power) => power.category === 'כלכלה').reduce((acc, power) => acc + (inventory[power.id] ?? 0), 0);
    const total = offense + defense + economy || 1;
    return {
      offense: Math.round((offense / total) * 100),
      defense: Math.round((defense / total) * 100),
      economy: Math.round((economy / total) * 100),
    };
  }, [inventory]);

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center">
        <Loader2 className="animate-spin text-[#0A84FF]" />
      </div>
    );
  }

  return (
    <section className="hide-scrollbar h-[100dvh] overflow-y-auto pb-20 pt-5">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4">
        <article className="glass-panel rounded-[2rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-white">מרקט כוחות</h1>
              <p className="mt-1 text-xs text-white/55">שכבת מסחר אסטרטגית עם זרימה מהירה כמו אפליקציות פרו</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenWarRoom}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35 text-white/75"
                title="מעבר לדירוג"
              >
                <Trophy size={16} />
              </button>
              <button
                onClick={onOpenProfile}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/35 text-white/75"
                title="מעבר לכספת"
              >
                <UserRound size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#111112] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Wallet size={14} className="text-[#0A84FF]" />
              יתרה זמינה למסחר
            </div>
            <DripCoinBadge amount={(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')} />
          </div>
        </article>

        <article className="glass-panel rounded-[1.6rem] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-white">
            <Radar size={14} className="text-[#0A84FF]" />
            מודיעין מהיר
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
              <p className="text-[10px] text-white/55">המלצה אישית עכשיו</p>
              <p className="mt-1 text-xs font-bold text-white">{recommendation.name}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 p-2.5">
              <p className="text-[10px] text-white/55">מאזן סיכון</p>
              <p className="mt-1 text-xs font-bold text-white">תקיפה {riskPulse.offense}% · הגנה {riskPulse.defense}%</p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-[#1C1C1E]/75 p-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl py-2 text-[11px] font-bold transition ${filter === item ? 'bg-[#0A84FF]/20 text-white' : 'text-white/55'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {marketPowers.map((power, index) => (
            <motion.article
              key={power.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.025 }}
              className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#1C1C1E]/85 p-3 backdrop-blur-3xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -right-9 -top-9 h-20 w-20 rounded-full border border-[#0A84FF]/20"
              />
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.6, repeat: Infinity }}
                className="absolute -left-7 bottom-3 h-14 w-14 rounded-full bg-[#0A84FF]/8 blur-xl"
              />

              <div className="relative z-10 mb-3 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/40">
                  <power.icon size={20} className={power.color} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold text-white/65">{power.category}</span>
              </div>

              <h2 className="relative z-10 truncate text-sm font-black text-white">{power.name}</h2>
              <div className="relative z-10 mt-2">
                <DripCoinBadge amount={power.price.toLocaleString('he-IL')} className="w-fit" />
              </div>

              <div className="relative z-10 mt-2 flex items-center justify-between text-[11px] text-white/55">
                <span>בארסנל: {inventory[power.id] ?? 0}</span>
                {recommendation.id === power.id && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#0A84FF]/35 bg-[#0A84FF]/14 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Sparkles size={9} />
                    מומלץ
                  </span>
                )}
              </div>

              <button
                onClick={() => void handleBuy(power.id, power.price)}
                disabled={buyingPowerId === power.id || (currentUser?.drip_coins ?? 0) < power.price}
                className="relative z-10 mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[#0A84FF]/35 bg-[#0A84FF]/12 py-2 text-xs font-black text-white transition hover:bg-[#0A84FF]/22 disabled:opacity-50"
              >
                {buyingPowerId === power.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={13} />
                    רכישה מיידית
                    <ArrowUpRight size={12} />
                  </>
                )}
              </button>
            </motion.article>
          ))}
        </div>

        <article className="glass-panel rounded-[1.6rem] p-3">
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Flame size={14} className="text-[#FF453A]" />
            רעיון יצירתי חדש
          </div>
          <p className="mt-2 text-xs text-white/65">
            הצעת פיצ׳ר הבא: סדרת ״משימות מומנטום״ יומית (3 פעולות מסחר + שימוש כוח + שיתוף) עם בונוס DRIPCOIN מדורג שמגדיל שימור והתמכרות בריאה למוצר.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-semibold text-white/70">
            <Shield size={11} className="text-[#0A84FF]" />
            מוכן להטמעה בשלב הבא
          </div>
        </article>
      </div>
    </section>
  );
}
