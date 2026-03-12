import { motion } from 'framer-motion';
import { Wallet, X } from 'lucide-react';

type WalletPanelProps = {
  open: boolean;
  balance: number;
  pending: number;
  lifetimeDividends: number;
  shockwaveAirdrops: number;
  onCollect: () => void;
  onClose: () => void;
};

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

export default function WalletPanel({
  open,
  balance,
  pending,
  lifetimeDividends,
  shockwaveAirdrops,
  onCollect,
  onClose,
}: WalletPanelProps) {
  if (!open) return null;

  return (
    <motion.section className="fixed inset-0 z-[70] bg-[#020313]/95 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">ארנק</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-white/85">
            <X size={18} />
          </button>
        </div>

        <div className="holo-panel min-h-0 flex-1 rounded-3xl p-4">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
            <Wallet size={18} />
            <p className="text-sm">יתרה נוכחית {formatCoin(balance)} DRIPCOIN</p>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">רווחים לאסיפה</p>
              <p className="biolume-number mt-1 text-lg font-semibold text-[#CCFF00]">{formatCoin(pending)} DRIPCOIN</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">דיבידנד מצטבר</p>
              <p className="biolume-number mt-1 text-lg font-semibold">{formatCoin(lifetimeDividends)} DRIPCOIN</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">איירדרופ מצטבר</p>
              <p className="biolume-number mt-1 text-lg font-semibold">{formatCoin(shockwaveAirdrops)} DRIPCOIN</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCollect}
            disabled={pending <= 0}
            className="mt-4 rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/18 px-4 py-2 text-sm font-semibold text-[#E8FF9A] disabled:opacity-40"
          >
            איסוף רווחים
          </button>
        </div>
      </div>
    </motion.section>
  );
}
