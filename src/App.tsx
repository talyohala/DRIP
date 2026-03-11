import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import i18n from './i18n';
import AetherFeed from './components/AetherFeed';

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'he');
    return () => {
      document.documentElement.setAttribute('dir', 'rtl');
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <main className="relative h-[100dvh] w-full overflow-hidden" dir="rtl">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(10, 7, 30, 0.86)',
                color: '#E0E0E0',
                borderRadius: '18px',
                border: '1px solid rgba(224, 224, 224, 0.18)',
                backdropFilter: 'blur(20px)',
                fontWeight: 600,
              },
            }}
          />
          <Routes>
            <Route path="/" element={<AetherFeed />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </I18nextProvider>
  );
}
