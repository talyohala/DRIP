import { motion } from 'framer-motion';

export type ProfileState = {
  displayName: string;
  house: string;
  tagline: string;
};

type ProfilePanelProps = {
  open: boolean;
  wallet: number;
  assetsOwned: number;
  claims: number;
  profile: ProfileState;
  onChange: (next: ProfileState) => void;
  onClose: () => void;
};

const formatCoin = (value: number): string =>
  Math.max(0, Math.round(value)).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

export default function ProfilePanel({
  open,
  wallet,
  assetsOwned,
  claims,
  profile,
  onChange,
  onClose,
}: ProfilePanelProps) {
  if (!open) return null;

  return (
    <motion.aside
      className="holo-panel pointer-events-auto absolute inset-x-3 top-20 z-40 mx-auto w-auto max-w-md rounded-3xl p-3 md:inset-x-auto md:right-6 md:top-24 md:w-[360px]"
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 20 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">פרופיל</p>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/80">
          סגור
        </button>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="text-white/60">יתרה</p>
          <p className="biolume-number text-white">{formatCoin(wallet)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="text-white/60">נכסים</p>
          <p className="biolume-number text-white">{assetsOwned}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="text-white/60">תביעות</p>
          <p className="biolume-number text-white">{claims}</p>
        </div>
      </div>

      <div className="space-y-2">
        <input
          value={profile.displayName}
          onChange={(event) => onChange({ ...profile, displayName: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
          placeholder="שם תצוגה"
        />
        <input
          value={profile.house}
          onChange={(event) => onChange({ ...profile, house: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
          placeholder="שם בית מסחר"
        />
        <input
          value={profile.tagline}
          onChange={(event) => onChange({ ...profile, tagline: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
          placeholder="שורת סטטוס"
        />
      </div>
    </motion.aside>
  );
}
