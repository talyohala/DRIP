import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, ShieldAlert, TowerControl } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useNotifications } from '../context/NotificationContext';

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(Math.floor(value));
}

function shortOwner(ownerId: string) {
  if (ownerId.length <= 8) {
    return ownerId;
  }
  return `${ownerId.slice(0, 4)}...${ownerId.slice(-4)}`;
}

export default function FloorScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { assets, loadingFloor, takeoverInFlightId, attemptTakeover } = useEconomy();
  const { pushNotification } = useNotifications();
  const [shakeCount, setShakeCount] = useState(0);

  const ownedCount = useMemo(
    () => assets.filter((asset) => Boolean(user?.id) && asset.ownerId === user?.id).length,
    [assets, user?.id],
  );

  const handleTakeover = async (assetId: string) => {
    const status = await attemptTakeover(assetId);

    if (status === 'success') {
      pushNotification({
        title: t('success_takeover'),
        description: t('success_desc'),
        tone: 'success',
      });
      return;
    }

    if (status === 'insufficient_funds') {
      setShakeCount((current) => current + 1);
      pushNotification({
        title: t('insufficient_funds'),
        description: t('buy_gear'),
        tone: 'danger',
      });
      return;
    }

    if (status === 'already_owned') {
      pushNotification({
        title: t('owned'),
        description: t('my_assets'),
        tone: 'info',
      });
    }
  };

  return (
    <motion.section
      key={shakeCount}
      animate={{ x: [0, -7, 7, -5, 5, -3, 3, 0] }}
      transition={{ duration: 0.32 }}
      className="h-full overflow-y-auto px-4 pb-28 pt-20"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-200">
              <TowerControl className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">{t('floor')}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Radar className="h-4 w-4 text-emerald-300" />
              <span>
                {ownedCount} / {assets.length}
              </span>
            </div>
          </div>
        </div>

        {loadingFloor && <p className="text-center text-white/70">{t('loading')}</p>}

        {!loadingFloor && assets.length === 0 && <p className="text-center text-white/70">{t('no_assets')}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((asset) => {
            const isOwnedByUser = Boolean(user?.id) && asset.ownerId === user?.id;
            const isTakingOver = takeoverInFlightId === asset.id;

            return (
              <motion.article
                key={asset.id}
                initial={{ opacity: 0, y: 20, rotateX: 12 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ y: -2, rotateX: -3, rotateY: i18n.language === 'he' ? -2 : 2 }}
                transition={{ type: 'spring', stiffness: 210, damping: 16 }}
                className="rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-3xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{asset.symbol}</p>
                    <h3 className="text-base font-black text-white">{asset.name}</h3>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                    {formatNumber(asset.value)} DRIP
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-xs text-white/65">
                  <p>
                    {t('owner')}: {isOwnedByUser ? t('you') : asset.ownerId ? shortOwner(asset.ownerId) : '—'}
                  </p>
                  <p>+{asset.incomePerSecond}/s</p>
                </div>

                <motion.button
                  type="button"
                  onClick={() => void handleTakeover(asset.id)}
                  disabled={isOwnedByUser || isTakingOver}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur-2xl ${
                    isOwnedByUser
                      ? 'border-emerald-400/35 bg-emerald-500/20 text-emerald-100'
                      : 'border-rose-400/35 bg-rose-500/20 text-rose-100'
                  } disabled:opacity-75`}
                >
                  {isOwnedByUser ? t('owned') : isTakingOver ? t('taking_over') : t('takeover')}
                </motion.button>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 backdrop-blur-2xl">
          <div className="flex items-center gap-2 text-rose-200">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.18em]">{t('active_threats')}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
