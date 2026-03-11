import { motion } from 'framer-motion';

export type AppPrefs = {
  autoPlay: boolean;
  compactDesk: boolean;
  lowMotion: boolean;
};

type SettingsPanelProps = {
  open: boolean;
  prefs: AppPrefs;
  onToggle: (key: keyof AppPrefs) => void;
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

export default function SettingsPanel({ open, prefs, onToggle, onClose }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <motion.aside
      className="holo-panel pointer-events-auto absolute inset-x-3 top-20 z-40 mx-auto w-auto max-w-md rounded-3xl p-3 md:inset-x-auto md:right-6 md:top-24 md:w-[360px]"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">הגדרות</p>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/80">
          סגור
        </button>
      </div>

      <div className="space-y-2 text-white/90">
        <Row label="ניגון אוטומטי" value={prefs.autoPlay} onClick={() => onToggle('autoPlay')} />
        <Row label="לוח מסחר קומפקטי" value={prefs.compactDesk} onClick={() => onToggle('compactDesk')} />
        <Row label="אפקטים עדינים" value={prefs.lowMotion} onClick={() => onToggle('lowMotion')} />
      </div>
    </motion.aside>
  );
}
