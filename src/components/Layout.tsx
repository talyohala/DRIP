import { useMemo, useState, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Crown, Crosshair, Shield, UserCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TabKey } from '../types/game';
import FloorScreen from './FloorScreen';
import ArsenalScreen from './ArsenalScreen';
import WarRoomScreen from './WarRoomScreen';
import ProfileScreen from './ProfileScreen';

const NAV_TABS: Array<{ key: TabKey; icon: ComponentType<{ className?: string }>; label: string }> = [
  { key: 'floor', icon: Crown, label: 'floor' },
  { key: 'arsenal', icon: Shield, label: 'arsenal' },
  { key: 'warroom', icon: Crosshair, label: 'warroom' },
  { key: 'profile', icon: UserCircle2, label: 'profile' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('floor');

  const currentScreen = useMemo(() => {
    if (activeTab === 'arsenal') {
      return <ArsenalScreen />;
    }
    if (activeTab === 'warroom') {
      return <WarRoomScreen />;
    }
    if (activeTab === 'profile') {
      return <ProfileScreen />;
    }
    return <FloorScreen />;
  }, [activeTab]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="h-full"
      >
        {currentScreen}
      </motion.div>

      <nav className="fixed inset-x-0 bottom-4 z-40 px-4">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/55 p-2 backdrop-blur-3xl">
          {NAV_TABS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;

            return (
              <motion.button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                whileTap={{ scale: 0.93 }}
                whileHover={{ rotateY: i18n.language === 'he' ? -8 : 8 }}
                className={`relative rounded-xl px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  active ? 'text-white' : 'text-white/60'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {active && (
                  <motion.span
                    layoutId="drip-active-tab"
                    className="absolute inset-0 rounded-xl border border-cyan-400/35 bg-cyan-500/15"
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className="h-4 w-4" />
                  {t(item.label)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
