import { motion } from 'framer-motion';
import { Shield, Zap, Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEconomy } from '../context/EconomyContext';
import { useNotifications } from '../context/NotificationContext';

const GEAR = [
  { id: 'deflector', icon: Shield, title: 'Neon Deflector', cost: 220, aura: 'emerald' },
  { id: 'overdrive', icon: Zap, title: 'Pulse Overdrive', cost: 340, aura: 'cyan' },
  { id: 'sniper', icon: Crosshair, title: 'Hostile Sniper', cost: 510, aura: 'rose' },
] as const;

export default function ArsenalScreen() {
  const { t } = useTranslation();
  const { spend } = useEconomy();
  const { pushNotification } = useNotifications();

  const buyGear = (cost: number) => {
    const paid = spend(cost);
    if (!paid) {
      pushNotification({
        title: t('insufficient_funds'),
        description: `${cost} DRIP`,
        tone: 'danger',
      });
      return;
    }
    pushNotification({
      title: t('purchased'),
      description: `${cost} DRIP`,
      tone: 'success',
    });
  };

  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-20">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100">{t('black_market')}</p>
          <h2 className="mt-1 text-lg font-black text-white">{t('equip_survive')}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GEAR.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.id}
                whileHover={{ y: -4, rotateX: -5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-3xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="mb-4 mt-1 text-xs text-white/65">{item.cost} DRIP</p>
                <button
                  type="button"
                  onClick={() => buyGear(item.cost)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.15em] backdrop-blur-2xl ${
                    item.aura === 'emerald'
                      ? 'border-emerald-400/35 bg-emerald-500/20 text-emerald-200'
                      : item.aura === 'cyan'
                        ? 'border-cyan-400/35 bg-cyan-500/20 text-cyan-100'
                        : 'border-rose-400/35 bg-rose-500/20 text-rose-100'
                  }`}
                >
                  {t('buy_gear')}
                </button>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
