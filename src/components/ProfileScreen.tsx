import { motion } from 'framer-motion';
import { Landmark, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';

function formatValue(value: number) {
  return new Intl.NumberFormat().format(Math.floor(value));
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { netWorth, passiveIncome, ownedAssets } = useEconomy();

  return (
    <section className="h-full overflow-y-auto px-4 pb-28 pt-20">
      <div className="mx-auto max-w-3xl space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/15 bg-black/55 p-4 backdrop-blur-3xl"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">{user?.email}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-cyan-200">
                <Landmark className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.1em]">{t('net_worth')}</span>
              </div>
              <p className="text-lg font-black text-white">{formatValue(netWorth)} DRIP</p>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-emerald-200">
                <Wallet className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.1em]">{t('passive_income')}</span>
              </div>
              <p className="text-lg font-black text-white">+{formatValue(passiveIncome)}/s</p>
            </div>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-white">{t('my_assets')}</h3>
          <div className="space-y-2">
            {ownedAssets.length === 0 ? (
              <p className="text-xs text-white/65">—</p>
            ) : (
              ownedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs"
                >
                  <span className="font-bold text-white">{asset.name}</span>
                  <span className="text-cyan-200">+{asset.incomePerSecond}/s</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
