import { motion } from 'framer-motion';
import { Flame, Plus, Shield, ShoppingBag, User } from 'lucide-react';

type TabKey = 'feed' | 'shop' | 'warroom' | 'profile' | 'mint';

type NavigationProps = {
  view: TabKey;
  onChange: (view: TabKey) => void;
};

const SIDE_ITEMS: Array<{ id: Exclude<TabKey, 'mint'>; label: string; icon: typeof Flame }> = [
  { id: 'feed', label: 'פיד', icon: Flame },
  { id: 'shop', label: 'חנות', icon: ShoppingBag },
  { id: 'warroom', label: 'חמ"ל', icon: Shield },
  { id: 'profile', label: 'פרופיל', icon: User },
];

export default function Navigation({ view, onChange }: NavigationProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] flex justify-center px-3">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-white/[0.02] px-2 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {SIDE_ITEMS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`rounded-full px-3 py-2 text-[11px] font-black transition-all ${
                  active
                    ? 'border border-cyan-300/35 bg-cyan-300/15 text-cyan-100'
                    : 'border border-transparent text-white/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={14} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onChange('mint')}
          className="relative grid h-14 w-14 place-items-center rounded-full border border-cyan-300/60 bg-gradient-to-br from-cyan-300 via-emerald-300 to-yellow-300 text-black shadow-[0_0_30px_rgba(34,211,238,0.8)]"
          aria-label="הנפקה"
        >
          <div className="absolute inset-1 rounded-full bg-white/35 blur-md" />
          <Plus size={28} strokeWidth={2.8} className="relative z-10" />
        </motion.button>

        <div className="flex items-center gap-1">
          {SIDE_ITEMS.slice(2).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`rounded-full px-3 py-2 text-[11px] font-black transition-all ${
                  active
                    ? 'border border-cyan-300/35 bg-cyan-300/15 text-cyan-100'
                    : 'border border-transparent text-white/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon size={14} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
