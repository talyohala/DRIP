import { ChevronRight, MoonStar, RotateCcw, ShieldCheck, Smartphone, Trophy, Vibrate } from 'lucide-react';
import { useEffect, useState } from 'react';

type SettingsProps = {
  onClose: () => void;
  onOpenWarRoom: () => void;
};

type AppSettings = {
  autoPlay: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  haptics: boolean;
};

const STORAGE_KEY = 'drip_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  autoPlay: true,
  reducedMotion: false,
  highContrast: false,
  haptics: true,
};

export default function Settings({ onClose, onOpenWarRoom }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AppSettings;
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const rows: Array<{
    id: keyof AppSettings;
    label: string;
    helper: string;
    icon: typeof Smartphone;
  }> = [
    { id: 'autoPlay', label: 'ניגון וידאו אוטומטי', helper: 'משפר זרימה רציפה בפיד', icon: Smartphone },
    { id: 'reducedMotion', label: 'הפחתת אנימציות', helper: 'לשימוש נוח ויציב יותר', icon: MoonStar },
    { id: 'highContrast', label: 'ניגודיות גבוהה', helper: 'שיפור קריאות במסכים חשוכים', icon: ShieldCheck },
    { id: 'haptics', label: 'משוב רטט', helper: 'חיווי בעת פעולות מסחר', icon: Vibrate },
  ];

  return (
    <section className="hide-scrollbar h-[100dvh] overflow-y-auto pb-20 pt-5">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4">
        <article className="glass-panel rounded-[2rem] p-4">
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/80"
            >
              <ChevronRight size={14} />
              חזרה לפרופיל
            </button>
            <button
              onClick={onOpenWarRoom}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/80"
            >
              <Trophy size={14} />
              מעבר לדירוג
            </button>
          </div>
          <h1 className="text-2xl font-black text-white">הגדרות כלליות</h1>
          <p className="mt-2 text-xs text-white/55">מרכז שליטה אישי לחוויית שימוש בסגנון Titanium Pro</p>
        </article>

        <article className="glass-panel rounded-[2rem] p-3">
          <div className="space-y-2">
            {rows.map((row) => (
              <button
                key={row.id}
                onClick={() => setSettings((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/35 p-3 text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#1C1C1E] text-[#0A84FF]">
                    <row.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{row.label}</p>
                    <p className="text-[11px] text-white/50">{row.helper}</p>
                  </div>
                </div>
                <div className={`h-6 w-11 rounded-full border p-0.5 transition ${settings[row.id] ? 'border-[#0A84FF] bg-[#0A84FF]/25' : 'border-white/20 bg-white/10'}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition ${settings[row.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            ))}
          </div>
        </article>

        <button
          onClick={() => setSettings(DEFAULT_SETTINGS)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#1C1C1E]/85 px-4 py-3 text-sm font-bold text-white/85"
        >
          <RotateCcw size={16} />
          איפוס להגדרות ברירת מחדל
        </button>
      </div>
    </section>
  );
}
