import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import Layout from './components/Layout';
import GlobalHUD from './components/GlobalHUD';
import GlobalNotifications from './components/GlobalNotifications';
import AuthScreen from './components/AuthScreen';
import { EconomyProvider } from './context/EconomyContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <GlobalNotifications />
        <div className="grid h-[100dvh] place-items-center text-sm text-white/70">LOADING...</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <GlobalNotifications />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <GlobalHUD />
      <GlobalNotifications />
      <Layout />
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      style={{ direction: i18n.language === 'he' ? 'rtl' : 'ltr' }}
    >
      <AuthProvider>
        <NotificationProvider>
          <EconomyProvider>
            <AppRouter />
          </EconomyProvider>
        </NotificationProvider>
      </AuthProvider>
    </div>
  );
}
