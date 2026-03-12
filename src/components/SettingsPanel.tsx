import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export type AppPrefs = {
  autoPlay: boolean;
  compactDesk: boolean;
  lowMotion: boolean;
};

type SettingsPanelProps = {
  open: boolean;
  prefs: AppPrefs;
  onToggle: (key: keyof AppPrefs) => void;
  onResetMarket: () => void;
  onClose: () => void;
};

const Row = ({
  label,
  value,
  onClick,
}: {
  label: string;
  value: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm"
  >
    <span>{label}</span>
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        value ? 'border border-[#CCFF00]/35 bg-[#CCFF00]/20 text-[#E7FF9C]' : 'border border-white/20 bg-white/10 text-white/70'
      }`}
    >
      {value ? 'פעיל' : 'כבוי'}
    </span>
  </button>
);

export default function SettingsPanel({ open, prefs, onToggle, onResetMarket, onClose }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <motion.section className="fixed inset-0 z-[70] bg-[#020313]/95 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">הגדרות</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-white/85">
            <X size={18} />
          </button>
        </div>

        <div className="holo-panel min-h-0 flex-1 overflow-auto rounded-3xl p-4">
          <div className="space-y-2 text-white/90">
            <Row label="ניגון אוטומטי" value={prefs.autoPlay} onClick={() => onToggle('autoPlay')} />
            <Row label="לוח מסחר קומפקטי" value={prefs.compactDesk} onClick={() => onToggle('compactDesk')} />
            <Row label="אפקטים עדינים" value={prefs.lowMotion} onClick={() => onToggle('lowMotion')} />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onResetMarket}
              className="rounded-xl border border-[#FF3B30]/45 bg-[#FF3B30]/15 px-3 py-2 text-xs font-semibold text-[#FFD2CF]"
            >
              איפוס שוק
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
