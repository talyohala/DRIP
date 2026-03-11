import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppNotification } from '../types/game';

interface NotificationContextValue {
  notifications: AppNotification[];
  pushNotification: (notification: Omit<AppNotification, 'id'>, durationMs?: number) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushNotification = useCallback(
    (notification: Omit<AppNotification, 'id'>, durationMs = 3200) => {
      const id = crypto.randomUUID();
      setNotifications((current) => [...current, { ...notification, id }]);

      window.setTimeout(() => {
        dismissNotification(id);
      }, durationMs);
    },
    [dismissNotification],
  );

  const value = useMemo(
    () => ({
      notifications,
      pushNotification,
      dismissNotification,
    }),
    [dismissNotification, notifications, pushNotification],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
