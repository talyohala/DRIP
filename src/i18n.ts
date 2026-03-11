import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  he: {
    translation: {
      floor: 'הזירה',
      arsenal: 'ארסנל',
      warroom: 'חמ"ל',
      profile: 'פרופיל',
      claim_drop: 'דרוש בעלות',
      backing: 'השקע',
      owned_by: 'בבעלות',
      hype_level: 'מד הייפ',
      history: 'הלדג׳ר',
      send_gift: 'שלח רליק',
      insufficient_drip: 'אין מספיק DRIPCOIN!',
      loading: 'טוען את מועדון ה-VIP...',
      trendsetter: 'הטרנדסטרית',
      phantom: 'הפאנטום',
      critic: 'המבקרת',
      broker: 'הברוקר',
      asset_value: 'שווי הנכס',
      your_balance: 'היתרה שלך',
      dripcoin: 'DRIPCOIN',
      hype_meter: 'הייפ',
      claim_processing: 'מעבד רכישה...',
      ownership_broken: 'הבעלות נשברה, הנכס חזר לבית',
      claim_success: 'Claim הושלם בהצלחה',
      back_success: 'Back חיזק את ההייפ',
      relic_activated: 'רליק הופעל',
      likes: 'לייקים',
      share: 'שיתוף',
      no_owner: 'ללא בעלים',
      relics: 'רליקים',
      live: 'בשידור',
      freeze_active: 'הייפ מוקפא',
      hidden_bid: 'ביד מוסתר',
      broker_fee: 'עמלת ברוקר',
      ledger_empty: 'אין רשומות בלדג׳ר עדיין',
    },
  },
  en: {
    translation: {
      floor: 'The Floor',
      arsenal: 'Arsenal',
      warroom: 'War Room',
      profile: 'Profile',
      claim_drop: 'Claim Drop',
      backing: 'Back Drop',
      owned_by: 'Owned by',
      hype_level: 'Hype Level',
      history: 'The Ledger',
      send_gift: 'Send Relic',
      insufficient_drip: 'Insufficient DRIPCOIN!',
      loading: 'Loading VIP Lounge...',
      trendsetter: 'Trendsetter',
      phantom: 'Phantom',
      critic: 'Critic',
      broker: 'Broker',
      asset_value: 'Asset Value',
      your_balance: 'Your Balance',
      dripcoin: 'DRIPCOIN',
      hype_meter: 'Hype',
      claim_processing: 'Processing claim...',
      ownership_broken: 'Ownership broke, asset returned to House',
      claim_success: 'Claim completed',
      back_success: 'Back boosted hype',
      relic_activated: 'Relic activated',
      likes: 'Likes',
      share: 'Share',
      no_owner: 'No owner',
      relics: 'Relics',
      live: 'LIVE',
      freeze_active: 'Hype Frozen',
      hidden_bid: 'Hidden Bid',
      broker_fee: 'Broker Fee',
      ledger_empty: 'No ledger entries yet',
    },
  },
};

const preferredLanguage =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'he';

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  lng: preferredLanguage,
  fallbackLng: 'he',
  supportedLngs: ['he', 'en'],
  nonExplicitSupportedLngs: true,
  detection: {
    order: ['navigator', 'htmlTag'],
    caches: ['localStorage'],
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
