import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { useRef } from 'react';

export type ProfileState = {
  displayName: string;
  house: string;
  tagline: string;
  country: string;
  bio: string;
  avatarUrl: string;
};

export type ProfileMediaItem = {
  id: string;
  title: string;
  mediaUrl: string;
  country: string;
  mediaKind: 'image' | 'video' | 'embed';
};

type ProfilePanelProps = {
  open: boolean;
  wallet: number;
  assetsOwned: number;
  claims: number;
  profile: ProfileState;
  uploaded: ProfileMediaItem[];
  claimed: ProfileMediaItem[];
  onChange: (next: ProfileState) => void;
  onUploadAvatar: (file: File) => void;
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
  uploaded,
  claimed,
  onChange,
  onUploadAvatar,
  onClose,
}: ProfilePanelProps) {
  const avatarRef = useRef<HTMLInputElement | null>(null);
  if (!open) return null;

  return (
    <motion.section className="fixed inset-0 z-[70] bg-[#020313]/95 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">פרופיל</h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 p-2 text-white/85">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[340px_1fr]">
          <aside className="holo-panel overflow-auto rounded-3xl p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-black/30">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-white/40">תמונה</div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile.displayName}</p>
                <p className="text-xs text-white/70">{profile.country || 'ללא מדינה'}</p>
              </div>
            </div>

            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadAvatar(file);
              }}
            />
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="mb-4 flex w-full items-center justify-center gap-1 rounded-xl border border-[#FF007F]/35 bg-[#FF007F]/15 px-3 py-2 text-xs font-semibold text-[#FFD7EC]"
            >
              <Upload size={14} />
              תמונת פרופיל
            </button>

            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <p className="text-white/60">יתרה</p>
                <p className="biolume-number text-white">{formatCoin(wallet)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                <p className="text-white/60">העלאות</p>
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
                value={profile.country}
                onChange={(event) => onChange({ ...profile, country: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                placeholder="מדינה"
              />
              <input
                value={profile.house}
                onChange={(event) => onChange({ ...profile, house: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                placeholder="בית מסחר"
              />
              <input
                value={profile.tagline}
                onChange={(event) => onChange({ ...profile, tagline: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                placeholder="שורת סטטוס"
              />
              <textarea
                value={profile.bio}
                onChange={(event) => onChange({ ...profile, bio: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none"
                placeholder="אודות"
                rows={3}
              />
            </div>
          </aside>

          <section className="grid min-h-0 gap-4 md:grid-cols-2">
            <div className="holo-panel min-h-0 overflow-auto rounded-3xl p-3">
              <p className="mb-2 text-sm font-semibold text-white">מדיה שהעליתי</p>
              <div className="space-y-2">
                {uploaded.length === 0 && <p className="text-xs text-white/55">אין פריטים</p>}
                {uploaded.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-black/40">
                      {item.mediaKind === 'image' && <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />}
                      {item.mediaKind === 'video' && <video src={item.mediaUrl} className="h-full w-full object-cover" muted playsInline />}
                      {item.mediaKind === 'embed' && <div className="grid h-full place-items-center text-[10px] text-white/50">EMBED</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-white/60">{item.country || 'ללא מדינה'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="holo-panel min-h-0 overflow-auto rounded-3xl p-3">
              <p className="mb-2 text-sm font-semibold text-white">מדיה שהשתלטתי</p>
              <div className="space-y-2">
                {claimed.length === 0 && <p className="text-xs text-white/55">אין פריטים</p>}
                {claimed.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-black/40">
                      {item.mediaKind === 'image' && <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />}
                      {item.mediaKind === 'video' && <video src={item.mediaUrl} className="h-full w-full object-cover" muted playsInline />}
                      {item.mediaKind === 'embed' && <div className="grid h-full place-items-center text-[10px] text-white/50">EMBED</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-white/60">{item.country || 'ללא מדינה'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.section>
  );
}
