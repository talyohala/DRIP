import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusSquare, Skull, User, MessageSquare, Trophy, Bell, X } from 'lucide-react';
import { supabase } from '../supabase';

interface NavigationProps {
  view: string;
  setView: (view: any) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export default function Navigation({ view, setView, isMenuOpen, setIsMenuOpen }: NavigationProps) {
  const isHe = navigator.language.startsWith('he');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    checkUnread();
    const channel = supabase.channel('nav-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drip_notifications' }, () => {
        checkUnread();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkUnread = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase.from('drip_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    setHasUnread(count && count > 0 ? true : false);
  };

  const menuItems = [
    { id: 'floor', icon: Home },
    { id: 'mint', icon: PlusSquare },
    { id: 'market', icon: Skull },
    { id: 'warroom', icon: Trophy },
    { id: 'chat', icon: MessageSquare },
    { id: 'notifications', icon: Bell },
    { id: 'profile', icon: User },
  ];

  // האייקון שמוצג כשסגור (העמוד הנוכחי) או איקס (כשפתוח)
  const CurrentIcon = isMenuOpen ? X : (menuItems.find(i => i.id === view)?.icon || Home);

  return (
    <div 
      className="fixed top-8 left-3 z-[60]" 
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <motion.div
        layout
        initial={false}
        animate={{
          height: isMenuOpen ? 'auto' : '42px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 1 }}
        className="w-[42px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[21px] flex flex-col items-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* כפתור העוגן - מוקטן יותר ושחור */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="relative w-[42px] h-[42px] flex items-center justify-center text-white transition-all active:scale-90 shrink-0 z-20 hover:bg-white/5"
        >
          <CurrentIcon size={18} strokeWidth={2.5} />
          {hasUnread && view !== 'notifications' && !isMenuOpen && (
            <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
          )}
        </button>

        {/* שאר התפריט שיורד כלפי מטה */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center overflow-hidden w-full pb-3"
            >
              <div className="flex flex-col items-center gap-3.5 overflow-y-auto no-scrollbar scroll-smooth w-full pt-1">
                {menuItems.filter(item => item.id !== view).map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { setView(item.id); setIsMenuOpen(false); }}
                    className="p-1.5 text-white/50 hover:text-white transition-all shrink-0 relative"
                  >
                    <item.icon size={18} strokeWidth={2.2} />
                    {item.id === 'notifications' && hasUnread && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
