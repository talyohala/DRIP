import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      appName: 'פולס',
      feedTitle: 'פיד אתר-פלקס',
      back: 'גבה',
      claim: 'תבע',
      stakePrice: 'מחיר החזקה',
      wallet: 'יתרה',
      founders: 'מייסדים',
      dividendPool: 'בריכת דיבידנד',
      viewers: 'צופים חיים',
      viralVelocity: 'מהירות ויראלית',
      unsupported: 'שפה לא נתמכת',
    },
  },
  en: {
    translation: {
      appName: 'PULSE',
      feedTitle: 'Aether-Flux Feed',
      back: 'Back',
      claim: 'Claim',
      stakePrice: 'Stake Price',
      wallet: 'Balance',
      founders: 'Founders',
      dividendPool: 'Dividend Pool',
      viewers: 'Live Viewers',
      viralVelocity: 'Viral Velocity',
      unsupported: 'Unsupported language',
    },
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['he', 'en'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'he',
    lng: 'he',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
    },
  });

export default i18n;
