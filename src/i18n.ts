import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  he: {
    translation: {
      floor: 'הזירה',
      arsenal: 'ארסנל',
      warroom: 'חמ״ל',
      profile: 'פרופיל',
      takeover: 'בצע השתלטות עוינת',
      taking_over: 'מבצע השתלטות...',
      owned: 'בבעלותך',
      insufficient_funds: 'אין מספיק DRIP!',
      owner: 'בעלים',
      you: 'אתה',
      success_takeover: 'השתלטות מוצלחת!',
      success_desc: 'רכשת את הנכס בהצלחה.',
      loading: 'טוען את הזירה...',
      no_assets: 'אין נכסים זמינים כרגע.',
      black_market: 'השוק השחור',
      equip_survive: 'הצטייד. תשרוד. תכבוש.',
      buy_gear: 'רכוש ציוד',
      purchased: 'נרכש בהצלחה!',
      active_threats: 'איומים פעילים מזוהים',
      defend: 'הגן',
      counter_attack: 'מתקפת נגד',
      net_worth: 'שווי כולל',
      passive_income: 'הכנסה פסיבית',
      my_assets: 'הנכסים שלי',
      login_title: 'היכנס לזירה',
      signup_title: 'צור משתמש חדש',
      email: 'כתובת אימייל',
      password: 'סיסמה',
      sign_in: 'התחברות',
      sign_up: 'הרשמה',
      toggle_auth: 'עבור למצב',
      sign_out: 'התנתק',
      welcome: 'ברוך הבא',
    },
  },
  en: {
    translation: {
      floor: 'The Floor',
      arsenal: 'Arsenal',
      warroom: 'War Room',
      profile: 'Profile',
      takeover: 'HOSTILE TAKEOVER',
      taking_over: 'TAKING OVER...',
      owned: 'OWNED',
      insufficient_funds: 'INSUFFICIENT DRIP!',
      owner: 'Owner',
      you: 'You',
      success_takeover: 'Takeover Successful!',
      success_desc: 'Asset acquired successfully.',
      loading: 'Loading the Floor...',
      no_assets: 'No assets available.',
      black_market: 'Black Market',
      equip_survive: 'Equip. Survive. Conquer.',
      buy_gear: 'Purchase Gear',
      purchased: 'Purchased!',
      active_threats: 'Active Threats Detected',
      defend: 'Defend',
      counter_attack: 'Counter-Attack',
      net_worth: 'Net Worth',
      passive_income: 'Passive Income',
      my_assets: 'My Assets',
      login_title: 'Enter the Floor',
      signup_title: 'Create Account',
      email: 'Email Address',
      password: 'Password',
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      toggle_auth: 'Switch to',
      sign_out: 'Sign Out',
      welcome: 'Welcome',
    },
  },
};

const preferredLanguage =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'he';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  lng: preferredLanguage,
  fallbackLng: 'en',
  supportedLngs: ['he', 'en'],
  nonExplicitSupportedLngs: true,
  detection: {
    order: ['navigator', 'htmlTag', 'path', 'subdomain'],
    caches: ['localStorage'],
  },
  interpolation: { escapeValue: false },
});

export default i18n;
