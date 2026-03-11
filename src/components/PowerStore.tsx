import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export type PowerItem = {
  id: string;
  name: string;
  price: number;
  effect: string;
};

type PowerStoreProps = {
  open: boolean;
  wallet: number;
  powers: PowerItem[];
  onBuy: (id: string) => void;
  onClose: () => void;
};

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

export default function PowerStore({ open, wallet, powers, onBuy, onClose }: PowerStoreProps) {
  if (!open) return null;

  return (
    <motion.aside
      className="holo-panel pointer-events-auto absolute inset-x-3 top-20 z-40 mx-auto w-auto max-w-md rounded-3xl p-3 md:inset-x-auto md:right-6 md:top-24 md:w-[360px]"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">חנות כוחות</p>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/80">
          סגור
        </button>
      </div>
      <p className="mb-3 text-xs text-[#E0E0E0]/70">יתרה {formatCoin(wallet)} DRIPCOIN</p>
      <div className="space-y-2">
        {powers.map((power) => (
          <div key={power.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{power.name}</p>
                <p className="text-xs text-[#E0E0E0]/70">{power.effect}</p>
              </div>
              <p className="biolume-number text-xs text-[#CCFF00]">{formatCoin(power.price)} DRIPCOIN</p>
            </div>
            <button
              type="button"
              onClick={() => onBuy(power.id)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCFF00]/35 bg-[#CCFF00]/15 px-3 py-2 text-xs font-semibold text-[#E7FF9C]"
            >
              <Sparkles size={14} />
              הפעל
            </button>
          </div>
        ))}
      </div>
    </motion.aside>
  );
}
