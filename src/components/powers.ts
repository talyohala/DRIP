import {
  Activity,
  Biohazard,
  Briefcase,
  ChevronsDown,
  CloudFog,
  Eye,
  FileText,
  Ghost,
  Hourglass,
  Magnet,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';

export type PowerCategory = 'תקיפה' | 'הגנה' | 'כלכלה';

export type PowerDefinition = {
  id: number;
  name: string;
  icon: LucideIcon;
  color: string;
  price: number;
  category: PowerCategory;
};

export const POWERS_DICT: Record<number, PowerDefinition> = {
  1: { id: 1, name: 'רוח רפאים', icon: Ghost, color: 'text-white', price: 400, category: 'הגנה' },
  2: { id: 2, name: 'חומת מגן', icon: ShieldAlert, color: 'text-[#0A84FF]', price: 500, category: 'הגנה' },
  3: { id: 3, name: 'לוויתן', icon: Sparkles, color: 'text-[#0A84FF]', price: 2000, category: 'כלכלה' },
  4: { id: 4, name: 'הזרקת הייפ', icon: Activity, color: 'text-[#0A84FF]', price: 250, category: 'כלכלה' },
  5: { id: 5, name: 'הרעלה', icon: Biohazard, color: 'text-[#FF453A]', price: 800, category: 'תקיפה' },
  6: { id: 6, name: 'פצצת EMP', icon: Radio, color: 'text-[#FF453A]', price: 2500, category: 'תקיפה' },
  7: { id: 7, name: 'שוגר ראש', icon: Sparkles, color: 'text-[#0A84FF]', price: 100, category: 'כלכלה' },
  8: { id: 8, name: 'מסך עשן', icon: CloudFog, color: 'text-[#FF453A]', price: 150, category: 'תקיפה' },
  9: { id: 9, name: 'שאיבת הייפ', icon: Magnet, color: 'text-[#FF453A]', price: 200, category: 'תקיפה' },
  10: { id: 10, name: 'מגן ניאון', icon: ShieldCheck, color: 'text-[#0A84FF]', price: 300, category: 'הגנה' },
  11: { id: 11, name: 'הכפלת סיכון', icon: ChevronsDown, color: 'text-[#FF453A]', price: 450, category: 'תקיפה' },
  12: { id: 12, name: 'מס קריפטו', icon: FileText, color: 'text-[#FF453A]', price: 600, category: 'תקיפה' },
  13: { id: 13, name: 'ניקוי זירה', icon: Target, color: 'text-[#0A84FF]', price: 700, category: 'כלכלה' },
  14: { id: 14, name: 'מידע פנים', icon: Eye, color: 'text-[#0A84FF]', price: 1000, category: 'כלכלה' },
  15: { id: 15, name: 'עיוות זמן', icon: Hourglass, color: 'text-white', price: 1500, category: 'כלכלה' },
  16: { id: 16, name: 'הסנדק', icon: Briefcase, color: 'text-[#FF453A]', price: 5000, category: 'הגנה' },
};

export const POWERS_LIST = Object.values(POWERS_DICT).sort((a, b) => a.price - b.price);
