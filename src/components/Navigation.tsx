import { motion } from 'framer-motion';
import { Home, Plus, ShoppingBag, Trophy, UserRound } from 'lucide-react';

type TabKey = 'feed' | 'shop' | 'warroom' | 'profile' | 'mint';

type NavigationProps = {
  view: TabKey;
  onChange: (view: TabKey) => void;
};

const SIDE_ITEMS: Array<{ id: Exclude<TabKey, 'mint'>; label: string; icon: typeof Home }> = [
  { id: 'feed', label: 'פיד', icon: Home },
  { id: 'shop', label: 'חנות', icon: ShoppingBag },
  { id: 'warroom', label: 'חמ"ל', icon: Trophy },
  { id: 'profile', label: 'פרופיל', icon: UserRound },
];

export default function Navigation({ view, onChange }: NavigationProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3">
      <nav className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111111]/85 px-2 py-1.5 shadow-[0_16px_45px_rgba(0,0,0,0.65)] backdrop-blur-3xl">
        <div className="grid grid-cols-5 items-center gap-0.5">
          {SIDE_ITEMS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="group flex flex-col items-center justify-center rounded-[1.4rem] px-1 py-2 transition-colors"
              >
                <span className={`${active ? 'text-[#007AFF]' : 'text-[#E5E7EB]/65'} transition-colors`}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className={`mt-1 text-[10px] font-semibold ${active ? 'text-[#E5E7EB]' : 'text-[#E5E7EB]/55'}`}>{item.label}</span>
                <span
                  className={`mt-1 h-[2px] w-5 rounded-full transition-all ${
                    active ? 'bg-[#007AFF]/90 opacity-100' : 'bg-transparent opacity-0'
                  }`}
                />
              </button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange('mint')}
            className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full border transition-all ${
              view === 'mint'
                ? 'border-[#007AFF]/70 bg-[#007AFF]/18 text-[#E5E7EB] shadow-[0_0_0_1px_rgba(0,122,255,0.35)]'
                : 'border-white/20 bg-[#020202]/75 text-[#E5E7EB]/85'
            }`}
            aria-label="העלאה"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="mt-0.5 text-[9px] font-semibold">העלאה</span>
          </motion.button>

          {SIDE_ITEMS.slice(2).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="group flex flex-col items-center justify-center rounded-[1.4rem] px-1 py-2 transition-colors"
              >
                <span className={`${active ? 'text-[#007AFF]' : 'text-[#E5E7EB]/65'} transition-colors`}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className={`mt-1 text-[10px] font-semibold ${active ? 'text-[#E5E7EB]' : 'text-[#E5E7EB]/55'}`}>{item.label}</span>
                <span
                  className={`mt-1 h-[2px] w-5 rounded-full transition-all ${
                    active ? 'bg-[#007AFF]/90 opacity-100' : 'bg-transparent opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
