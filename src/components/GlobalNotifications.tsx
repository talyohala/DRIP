import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';

const toneStyles: Record<string, string> = {
  success: 'border-emerald-400/50 text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.45)]',
  danger: 'border-rose-500/50 text-rose-100 shadow-[0_0_28px_rgba(244,63,94,0.45)]',
  info: 'border-cyan-400/50 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.45)]',
};

export default function GlobalNotifications() {
  const { notifications, dismissNotification } = useNotifications();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[70] flex justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-3">
        <AnimatePresence initial={false}>
          {notifications.map((notification) => (
            <motion.button
              key={notification.id}
              type="button"
              onClick={() => dismissNotification(notification.id)}
              initial={{ opacity: 0, y: -18, scale: 0.95, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -14, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={`pointer-events-auto w-full rounded-2xl border bg-black/60 p-4 text-left backdrop-blur-2xl ${toneStyles[notification.tone]}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <p className="text-sm font-black uppercase tracking-[0.18em]">{notification.title}</p>
              <p className="mt-1 text-xs text-white/75">{notification.description}</p>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
