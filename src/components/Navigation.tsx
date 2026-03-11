import React from 'react';
import { motion } from 'framer-motion';
import { Home, Shield, Swords, UserRound } from 'lucide-react';

interface NavigationProps {
  view: string;
  setView: (view: string) => void;
}

const navItems = [
  { id: 'floor', label: 'Floor', icon: Home },
  { id: 'arsenal', label: 'Arsenal', icon: Swords },
  { id: 'warroom', label: 'War Room', icon: Shield },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

export default function Navigation({ view, setView }: NavigationProps) {
  const activeTab = navItems.some((item) => item.id === view) ? view : 'floor';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <motion.nav
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-white/20 bg-[#0b1222]/75 p-1.5 shadow-[0_20px_45px_rgba(2,6,23,0.55),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-3xl"
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="relative flex min-h-[3.8rem] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl text-white"
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="drip-nav-pill"
                    transition={{ type: 'spring', stiffness: 250, damping: 26 }}
                    className="absolute inset-0 rounded-2xl bg-white/18"
                  />
                )}
                <item.icon
                  size={18}
                  className={`relative z-10 transition-colors ${isActive ? 'text-cyan-100' : 'text-white/70'}`}
                  strokeWidth={isActive ? 2.7 : 2.2}
                />
                <span
                  className={`relative z-10 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                    isActive ? 'text-white' : 'text-white/55'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
