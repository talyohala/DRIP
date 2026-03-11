import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import TheFloor from './components/TheFloor';

export default function App() {
  const { i18n } = useTranslation();
  const isRTL = (i18n.resolvedLanguage ?? i18n.language).startsWith('he');

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'he' : 'en';
  }, [isRTL]);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#02030a]" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <TheFloor />
    </main>
  );
}
