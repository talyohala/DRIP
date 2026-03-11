import { motion } from 'framer-motion';
import { Home, Plus, Settings, ShoppingBag, Trophy, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ViewKey = 'floor' | 'mint' | 'market' | 'warroom' | 'profile' | 'settings';

type NavigationProps = {
  view: ViewKey;
  onChange: (view: ViewKey) => void;
};

const SIDE_ITEMS: Array<{ id: Exclude<ViewKey, 'mint'>; label: string; icon: typeof Home }> = [
  { id: 'floor', label: 'פיד', icon: Home },
  { id: 'market', label: 'מרקט', icon: ShoppingBag },
  { id: 'warroom', label: 'דירוג', icon: Trophy },
  { id: 'profile', label: 'כספת', icon: UserRound },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

export default function Navigation({ view, onChange }: NavigationProps) {
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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3">
      <nav className="pointer-events-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#1C1C1E]/85 px-2 py-2 shadow-[0_20px_55px_rgba(0,0,0,0.7)] backdrop-blur-3xl">
        <div className="grid grid-cols-6 items-center gap-0.5">
          {SIDE_ITEMS.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="group flex flex-col items-center justify-center rounded-[1.3rem] px-1 py-1.5 transition-colors"
              >
                <span className={`${active ? 'text-[#0A84FF]' : 'text-white/65'} transition-colors`}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <span className={`mt-1 text-[10px] font-semibold ${active ? 'text-white' : 'text-white/55'}`}>{item.label}</span>
                <span
                  className={`mt-1 h-[2px] w-5 rounded-full transition-all ${active ? 'bg-[#0A84FF] opacity-100' : 'bg-transparent opacity-0'}`}
                />
              </button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange('mint')}
            className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full border transition-all ${
              view === 'mint'
                ? 'border-[#0A84FF]/75 bg-[#0A84FF]/20 text-white shadow-[0_0_0_1px_rgba(10,132,255,0.35)]'
                : 'border-white/20 bg-black/70 text-white/85'
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
                className="group relative flex flex-col items-center justify-center rounded-[1.3rem] px-1 py-1.5 transition-colors"
              >
                <span className={`${active ? 'text-[#0A84FF]' : 'text-white/65'} transition-colors`}>
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                {item.id === 'profile' && hasUnread && view !== 'profile' && (
                  <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[#FF453A] shadow-[0_0_12px_rgba(255,69,58,0.8)]" />
                )}
                <span className={`mt-1 text-[10px] font-semibold ${active ? 'text-white' : 'text-white/55'}`}>{item.label}</span>
                <span
                  className={`mt-1 h-[2px] w-5 rounded-full transition-all ${active ? 'bg-[#0A84FF] opacity-100' : 'bg-transparent opacity-0'}`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
