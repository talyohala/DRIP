import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Threat } from '../types/game';

const THREATS: Threat[] = [
  {
    id: 'th-1',
    title: 'Ghost Bidder',
    level: 'HIGH',
    description: 'Hostile bots are bidding against your latest asset queue.',
  },
  {
    id: 'th-2',
    title: 'Debt Swarm',
    level: 'MED',
    description: 'A debt pool is probing your open positions for weakness.',
  },
  {
    id: 'th-3',
    title: 'Shadow Audit',
    level: 'LOW',
    description: 'A stealth auditor is scanning your passive income channels.',
  },
];

const levelTone: Record<Threat['level'], string> = {
  HIGH: 'border-rose-400/35 bg-rose-500/15 text-rose-100',
  MED: 'border-cyan-400/35 bg-cyan-500/15 text-cyan-100',
  LOW: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-100',
};

export default function WarRoomScreen() {
  const { t } = useTranslation();

  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-20">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-600/10 p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-200" />
            <p className="text-xs uppercase tracking-[0.2em] text-rose-100">{t('active_threats')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {THREATS.map((threat) => (
            <motion.article
              key={threat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              className={`rounded-2xl border p-4 backdrop-blur-3xl ${levelTone[threat.level]}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.16em]">{threat.title}</h3>
                <p className="text-xs font-bold">{threat.level}</p>
              </div>
              <p className="mb-4 text-xs text-white/80">{threat.description}</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/20 bg-black/25 px-2 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/90"
                >
                  {t('defend')}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
                >
                  {t('counter_attack')}
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-2 text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.16em]">24/7 Tactical Feed</p>
          </div>
        </div>
      </div>
    </section>
  );
}
