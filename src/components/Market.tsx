import { motion } from 'framer-motion';
import { Loader2, Sparkles, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinBadge } from './DripCoinBadge';
import { POWERS_LIST, type PowerCategory } from './powers';

type LooseRecord = Record<string, any>;
type FilterKey = 'הכל' | PowerCategory;

const FILTERS: FilterKey[] = ['הכל', 'תקיפה', 'הגנה', 'כלכלה'];

export default function Market() {
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
    if (withInventory) {
      await loadInventory(user.id);
    }
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
      toast.success('הרכישה הושלמה והכוח נוסף לארסנל');
    } catch (error: any) {
      toast.error(error?.message || 'רכישה נכשלה');
      await loadData();
    } finally {
      setBuyingPowerId(null);
    }
  };

  const marketPowers = useMemo(
    () => (filter === 'הכל' ? POWERS_LIST : POWERS_LIST.filter((power) => power.category === filter)),
    [filter],
  );

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center">
        <Loader2 className="animate-spin text-[#0A84FF]" />
      </div>
    );
  }

  return (
    <section className="hide-scrollbar h-[100dvh] overflow-y-auto pb-32 pt-5">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4">
        <article className="glass-panel rounded-[2rem] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">מרקט כוחות</h1>
              <p className="mt-1 text-xs text-white/55">שוק חי שמניע את הכלכלה בזמן אמת</p>
            </div>
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-[#0A84FF]" />
              <DripCoinBadge amount={(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')} />
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#111112] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Sparkles size={14} className="text-[#0A84FF]" />
              מנוע המרות: כוחות זולים לתגובת שרשרת מהירה
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass-panel rounded-[1.6rem] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#111112]">
                  <power.icon size={20} className={power.color} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold text-white/65">{power.category}</span>
              </div>
              <h2 className="truncate text-sm font-black text-white">{power.name}</h2>
              <div className="mt-2">
                <DripCoinBadge amount={power.price.toLocaleString('he-IL')} className="w-fit" />
              </div>
              <div className="mt-2 text-[11px] text-white/55">בארסנל: {inventory[power.id] ?? 0}</div>
              <button
                onClick={() => void handleBuy(power.id, power.price)}
                disabled={buyingPowerId === power.id || (currentUser?.drip_coins ?? 0) < power.price}
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#0A84FF]/35 bg-[#0A84FF]/12 py-2 text-xs font-black text-white transition hover:bg-[#0A84FF]/22 disabled:opacity-50"
              >
                {buyingPowerId === power.id ? <Loader2 size={14} className="animate-spin" /> : 'רכישה מיידית'}
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
