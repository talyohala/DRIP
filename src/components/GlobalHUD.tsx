import { motion } from 'framer-motion';
import { Coins, LogOut, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';

function formatDrip(value: number) {
  return new Intl.NumberFormat().format(Math.floor(value));
}

export default function GlobalHUD() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { balance, passiveIncome } = useEconomy();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 190, damping: 22 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 p-3"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-2xl">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-2 text-emerald-300">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs tracking-[0.16em] text-white/50">DRIPCOIN</p>
            <p className="text-lg font-black text-emerald-300">{formatDrip(balance)}</p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-cyan-200">
          <TrendingUp className="h-4 w-4" />
          <p className="text-xs">
            +{formatDrip(passiveIncome)} /s <span className="text-white/60">· {t('passive_income')}</span>
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => void signOut()}
          whileTap={{ scale: 0.95, rotateY: i18n.language === 'he' ? -12 : 12 }}
          className="pointer-events-auto flex items-center gap-1 rounded-xl border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-100 backdrop-blur-xl"
        >
          <LogOut className="h-3.5 w-3.5" />
          {user?.email ?? t('sign_out')}
        </motion.button>
      </div>
    </motion.header>
  );
}
