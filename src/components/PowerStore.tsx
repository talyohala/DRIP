import { motion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export type PowerItem = {
  id: string;
  name: string;
  price: number;
  effect: string;
  kind: 'power' | 'reward';
  tier: 'S' | 'A' | 'B' | 'C';
};

type PowerStoreProps = {
  open: boolean;
  wallet: number;
  powers: PowerItem[];
  inventory: Record<string, number>;
  onBuy: (id: string) => void;
  onClose: () => void;
};

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

export default function PowerStore({ open, wallet, powers, inventory, onBuy, onClose }: PowerStoreProps) {
  const [tab, setTab] = useState<'power' | 'reward'>('power');
  const list = useMemo(() => powers.filter((item) => item.kind === tab), [powers, tab]);

  if (!open) return null;

  return (
    <motion.section className="fixed inset-0 z-[70] bg-[#020313]/95 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">חנות</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-white/85">
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="holo-panel rounded-xl px-3 py-1.5 text-xs">יתרה {formatCoin(wallet)} DRIPCOIN</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('power')}
              className={`rounded-xl border px-3 py-1.5 text-xs ${tab === 'power' ? 'border-[#CCFF00]/40 bg-[#CCFF00]/16 text-[#E8FF9A]' : 'border-white/15 text-white/75'}`}
            >
              כוחות
            </button>
            <button
              type="button"
              onClick={() => setTab('reward')}
              className={`rounded-xl border px-3 py-1.5 text-xs ${tab === 'reward' ? 'border-[#FF007F]/45 bg-[#FF007F]/16 text-[#FFD5EA]' : 'border-white/15 text-white/75'}`}
            >
              פרסים
            </button>
          </div>
        </div>

        <div className="holo-panel min-h-0 flex-1 overflow-auto rounded-3xl p-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-[#E0E0E0]/70">{item.effect}</p>
                  </div>
                  <div className="text-right">
                    <p className="biolume-number text-xs text-[#CCFF00]">{formatCoin(item.price)} DRIPCOIN</p>
                    <p className="text-[10px] text-white/55">Tier {item.tier}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/60">מלאי {inventory[item.id] ?? 0}</p>
                  <button
                    type="button"
                    onClick={() => onBuy(item.id)}
                    className="flex items-center gap-1 rounded-xl border border-[#CCFF00]/35 bg-[#CCFF00]/15 px-3 py-1.5 text-xs font-semibold text-[#E7FF9C]"
                  >
                    {item.kind === 'power' ? <Sparkles size={13} /> : <Gift size={13} />}
                    קנייה
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
