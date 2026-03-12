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
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['he'],
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
