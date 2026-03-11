import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { signIn, signUp, loading } = useAuth();
  const { pushNotification } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isBusy, setIsBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    const action = mode === 'login' ? signIn : signUp;
    const { error } = await action(email, password);

    if (error) {
      pushNotification(
        {
          title: t('insufficient_funds'),
          description: error,
          tone: 'danger',
        },
        4200,
      );
      setIsBusy(false);
      return;
    }

    pushNotification({
      title: t('welcome'),
      description: email,
      tone: 'success',
    });
    setIsBusy(false);
  };

  return (
    <div className="grid h-[100dvh] place-items-center overflow-hidden px-5">
      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 18 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-black/55 p-6 backdrop-blur-3xl"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="mb-6 flex items-center justify-center gap-2 text-center">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <h1 className="text-xl font-black tracking-[0.2em] text-white">DRIP</h1>
          <Shield className="h-5 w-5 text-emerald-300" />
        </div>

        <p className="mb-5 text-center text-sm uppercase tracking-[0.2em] text-white/60">
          {mode === 'login' ? t('login_title') : t('signup_title')}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs text-white/60">{t('email')}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 focus:bg-cyan-300/10"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs text-white/60">{t('password')}</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-300/60 focus:bg-emerald-300/10"
            />
          </label>

          <motion.button
            type="submit"
            disabled={isBusy || loading}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01, rotateX: -4 }}
            transition={{ type: 'spring', stiffness: 250, damping: 16 }}
            className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-emerald-200 backdrop-blur-2xl disabled:opacity-60"
          >
            {isBusy ? t('loading') : mode === 'login' ? t('sign_in') : t('sign_up')}
          </motion.button>
        </form>

        <button
          type="button"
          onClick={() => setMode((current) => (current === 'login' ? 'signup' : 'login'))}
          className="mt-4 w-full text-xs text-white/60 transition hover:text-cyan-200"
        >
          {t('toggle_auth')} {mode === 'login' ? t('sign_up') : t('sign_in')}
        </button>
      </motion.div>
    </div>
  );
}
