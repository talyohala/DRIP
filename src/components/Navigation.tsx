import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Home, Plus, ShoppingBag, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ViewKey = 'floor' | 'mint' | 'market' | 'warroom' | 'profile' | 'settings';
type PrimaryView = 'floor' | 'mint' | 'market' | 'profile';

type NavigationProps = {
  view: ViewKey;
  onChange: (view: PrimaryView) => void;
};

const PRIMARY_ITEMS: Array<{ id: Exclude<PrimaryView, 'mint'>; label: string; icon: typeof Home }> = [
  { id: 'floor', label: 'פיד', icon: Home },
  { id: 'market', label: 'מרקט', icon: ShoppingBag },
  { id: 'profile', label: 'כספת', icon: UserRound },
];

export default function Navigation({ view, onChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    void checkUnread();
    const channel = supabase
      .channel('nav-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_notifications' }, () => void checkUnread())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const checkUnread = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setHasUnread(false);
      return;
    }
    const { count } = await supabase
      .from('drip_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setHasUnread((count ?? 0) > 0);
  };

  const activeMainView: PrimaryView = view === 'market' || view === 'profile' || view === 'mint' ? view : 'floor';
  const ActiveIcon = PRIMARY_ITEMS.find((item) => item.id === activeMainView)?.icon || Home;

  return (
    <div className="pointer-events-none fixed left-3 top-6 z-[90]">
      <motion.nav layout className="pointer-events-auto w-[56px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#1C1C1E]/88 shadow-[0_20px_55px_rgba(0,0,0,0.7)] backdrop-blur-3xl">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex h-14 w-14 items-center justify-center text-white transition active:scale-95"
          aria-label="פתיחה וסגירה של תפריט"
        >
          {isOpen ? <X size={17} /> : <ActiveIcon size={17} />}
          {!isOpen && hasUnread && activeMainView !== 'profile' && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#FF453A]" />}
          <ChevronDown size={12} className={`absolute bottom-2 transition ${isOpen ? 'rotate-180 text-[#0A84FF]' : 'text-white/45'}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col items-center gap-2 pb-3"
            >
              {PRIMARY_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeMainView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`relative grid h-10 w-10 place-items-center rounded-xl border transition ${
                      active ? 'border-[#0A84FF]/45 bg-[#0A84FF]/18 text-white' : 'border-white/10 bg-black/35 text-white/70'
                    }`}
                    title={item.label}
                  >
                    <Icon size={16} />
                    {item.id === 'profile' && hasUnread && !active && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF453A]" />}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  onChange('mint');
                  setIsOpen(false);
                }}
                className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
                  activeMainView === 'mint' || view === 'mint'
                    ? 'border-[#0A84FF]/55 bg-[#0A84FF]/20 text-white'
                    : 'border-white/10 bg-black/35 text-white/70'
                }`}
                title="העלאה"
              >
                <Plus size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
