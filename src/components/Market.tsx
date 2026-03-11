import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Briefcase, Eye, ShieldCheck, Loader2, Ghost, Lock, Activity, Biohazard, 
  Droplet, CloudFog, Magnet, ChevronsDown, ShieldAlert, FileText, Target, Hourglass, 
  Sparkles, Radio, Crosshair, Printer, Bug, Terminal, DoorOpen, Snowflake, Copy, 
  Monitor, Bot, Eraser, Megaphone, Zap, Circle, WifiOff, Dices, Gem, ScrollText, 
  ArrowDownCircle, Umbrella, Key, Rocket, Bomb, Cpu, Infinity
} from 'lucide-react';
import { DripCoin } from './ui/DripCoin';

// 40 הפריטים - רשימה מלאה (מסונכרנת לזירה ולעתיד)
const relics = [
  { id: 7, name: 'שוגר ראש', enName: 'SUGAR RUSH', desc: '+5% הייפ מיידי לנכס', enDesc: '+5% instant hype', price: 500, icon: Droplet, color: 'text-pink-400' },
  { id: 4, name: 'הזרקת הייפ', enName: 'HYPE INJECT', desc: 'מקפיץ הייפ ל-100%', enDesc: 'Restore hype to 100%', price: 2500, icon: Activity, color: 'text-rose-400' },
  { id: 8, name: 'מסך עשן', enName: 'SMOKE SCREEN', desc: 'מטשטש נכס ל-30 דק\'', enDesc: 'Blur asset for 30m', price: 3000, icon: CloudFog, color: 'text-slate-300' },
  { id: 9, name: 'שאיבת הייפ', enName: 'HYPE DRAIN', desc: 'שואב 10% מנכס אחר', enDesc: 'Drain 10% hype', price: 4000, icon: Magnet, color: 'text-fuchsia-400' },
  { id: 5, name: 'הרעלה', enName: 'SABOTAGE', desc: 'חותך 15% משווי הנכס', enDesc: 'Cut value by 15%', price: 6000, icon: Biohazard, color: 'text-emerald-400' },
  { id: 11, name: 'הכפלת סיכון', enName: 'DOUBLE DECAY', desc: 'הייפ יורד כפול מהר', enDesc: 'Hype decays 2x faster', price: 7500, icon: ChevronsDown, color: 'text-orange-400' },
  { id: 1, name: 'רוח רפאים', enName: 'GHOST MODE', desc: 'מסתיר את זהותך', enDesc: 'Hide your identity', price: 8000, icon: Ghost, color: 'text-purple-400' },
  { id: 10, name: 'מגן ניאון', enName: 'NEON SHIELD', desc: 'חוסם התקפה אחת', enDesc: 'Block 1 attack', price: 10000, icon: ShieldCheck, color: 'text-teal-400' },
  { id: 12, name: 'מס קריפטו', enName: 'TAX TRAP', desc: 'גונב 10% מרוכש הבא', enDesc: 'Steal 10% from next buyer', price: 12000, icon: FileText, color: 'text-lime-400' },
  { id: 2, name: 'חומת מגן', enName: 'FROZEN GUARD', desc: 'מונע השתלטות לשעה', enDesc: 'Prevent takeover for 1h', price: 15000, icon: Lock, color: 'text-blue-400' },
  { id: 15, name: 'עיוות זמן', enName: 'TIME WARP', desc: 'הייפ עולה במקום לרדת', enDesc: 'Hype rises instead of decays', price: 18000, icon: Hourglass, color: 'text-violet-400' },
  { id: 14, name: 'מידע פנים', enName: 'INSIDER INFO', desc: 'חושף מלכודות לשעה', enDesc: 'Reveal tax traps for 1h', price: 20000, icon: Eye, color: 'text-indigo-400' },
  { id: 6, name: 'פצצת EMP', enName: 'EMP BOMB', desc: 'מפיל הייפ לכל הזירה', enDesc: 'Drop hype for all floor', price: 25000, icon: Radio, color: 'text-cyan-400' },
  { id: 13, name: 'ניקוי זירה', enName: 'FLOOR SWEEP', desc: 'משתלט על הזול ביותר', enDesc: 'Auto-takeover cheapest', price: 30000, icon: Target, color: 'text-sky-400' },
  { id: 3, name: 'לוויתן', enName: 'WHALE STATUS', desc: 'הילת זהב פרימיום ל-24ש', enDesc: 'Gold aura for 24h', price: 50000, icon: Sparkles, color: 'text-yellow-400' },
  { id: 16, name: 'הסנדק', enName: 'GODFATHER', desc: 'חסינות מוחלטת להתקפות', enDesc: 'Absolute attack immunity', price: 500000, icon: Briefcase, color: 'text-red-500' },
  { id: 17, name: 'צלף', enName: 'SNIPER', desc: 'מבטל מגן ניאון מרחוק', enDesc: 'Disable neon shield', price: 11000, icon: Crosshair, color: 'text-red-400' },
  { id: 18, name: 'מכונת כסף', enName: 'MONEY PRINTER', desc: 'הכנסה כפולה לשעה', enDesc: '2x passive yield for 1h', price: 35000, icon: Printer, color: 'text-green-400' },
  { id: 19, name: 'באג במערכת', enName: 'GLITCH', desc: 'משנה מחיר נכס רנדומלית', enDesc: 'Randomize asset price', price: 15000, icon: Bug, color: 'text-pink-500' },
  { id: 20, name: 'האקר', enName: 'HACKER', desc: 'גונב נשק ממשתמש אחר', enDesc: 'Steal 1 weapon from user', price: 28000, icon: Terminal, color: 'text-emerald-500' },
  { id: 21, name: 'דלת אחורית', enName: 'BACKDOOR', desc: 'עוקף חומת מגן קפואה', enDesc: 'Bypass frozen guard', price: 22000, icon: DoorOpen, color: 'text-amber-400' },
  { id: 22, name: 'הקפאה עמוקה', enName: 'DEEP FREEZE', desc: 'נועל נכס ל-24 שעות', enDesc: 'Lock asset for 24h', price: 45000, icon: Snowflake, color: 'text-blue-200' },
  { id: 23, name: 'משכפל', enName: 'CLONER', desc: 'משכפל נשק מהמלאי שלך', enDesc: 'Duplicate an inventory item', price: 15000, icon: Copy, color: 'text-purple-300' },
  { id: 24, name: 'מראה', enName: 'MIRROR', desc: 'מחזיר התקפה לשולח', enDesc: 'Reflect attack to sender', price: 16000, icon: Monitor, color: 'text-cyan-200' },
  { id: 25, name: 'בוט מסחר', enName: 'TRADING BOT', desc: 'קונה אוטומטית כשהייפ נמוך', enDesc: 'Buy assets under 20% hype', price: 60000, icon: Bot, color: 'text-gray-300' },
  { id: 26, name: 'מחיקת היסטוריה', enName: 'WIPE', desc: 'מוחק הסטוריית בעלים', enDesc: 'Wipe ownership history', price: 13000, icon: Eraser, color: 'text-rose-200' },
  { id: 27, name: 'הדלפה', enName: 'LEAK', desc: 'מציג מחיר עתידי', enDesc: 'Show future takeover price', price: 9000, icon: Megaphone, color: 'text-yellow-200' },
  { id: 28, name: 'קצר חשמלי', enName: 'SHORT CIRCUIT', desc: 'מכבה מסכי עשן לכולם', enDesc: 'Clear all smoke screens', price: 14000, icon: Zap, color: 'text-yellow-500' },
  { id: 29, name: 'עומס יתר', enName: 'OVERLOAD', desc: 'מפוצץ ומוחק נכס', enDesc: 'Destroy asset entirely', price: 150000, icon: Bomb, color: 'text-red-600' },
  { id: 30, name: 'חור שחור', enName: 'BLACK HOLE', desc: 'בולע 50% מהייפ הזירה', enDesc: 'Swallow 50% of floor hype', price: 85000, icon: Circle, color: 'text-zinc-500' },
  { id: 31, name: 'ניתוק שרת', enName: 'SERVER DROP', desc: 'מונע קניות ל-5 דק\'', enDesc: 'Stop all buys for 5m', price: 40000, icon: WifiOff, color: 'text-red-300' },
  { id: 32, name: 'רולטה', enName: 'ROULETTE', desc: '50% להכפיל, 50% להפסיד', enDesc: '50% double, 50% lose', price: 10000, icon: Dices, color: 'text-orange-500' },
  { id: 33, name: 'יהלום', enName: 'DIAMOND HANDS', desc: 'שומר ערך גם ב-0% הייפ', enDesc: 'Asset holds value at 0%', price: 75000, icon: Gem, color: 'text-cyan-300' },
  { id: 34, name: 'חוזה חכם', enName: 'SMART CONTRACT', desc: 'איסוף רווחים אוטומטי', enDesc: 'Auto-claim yields', price: 55000, icon: ScrollText, color: 'text-indigo-200' },
  { id: 35, name: 'צניחה חופשית', enName: 'FREEFALL', desc: 'מוריד מחיר ב-50%', enDesc: 'Drop asset price by 50%', price: 32000, icon: ArrowDownCircle, color: 'text-red-400' },
  { id: 36, name: 'מצנח זהב', enName: 'GOLD PARACHUTE', desc: 'מגן מפני צניחת מחיר', enDesc: 'Protect from price drop', price: 38000, icon: Umbrella, color: 'text-yellow-300' },
  { id: 37, name: 'מפתח מאסטר', enName: 'MASTER KEY', desc: 'פותח כל נכס קפוא', enDesc: 'Unlock any frozen asset', price: 42000, icon: Key, color: 'text-emerald-300' },
  { id: 38, name: 'וירוס תולעת', enName: 'WORM VIRUS', desc: 'מרעיל נכסים שכנים', enDesc: 'Infect neighbor assets', price: 29000, icon: Cpu, color: 'text-lime-500' },
  { id: 39, name: 'אפקט מאסק', enName: 'MUSK EFFECT', desc: 'מטיס נכס לירח (x2 שווי)', enDesc: 'To the moon (x2 value)', price: 120000, icon: Rocket, color: 'text-orange-300' },
  { id: 40, name: 'נצחיות', enName: 'IMMORTAL', desc: 'הנכס לעולם לא מאבד הייפ', enDesc: 'Asset never loses hype', price: 250000, icon: Infinity, color: 'text-purple-500' },
];

export default function Market() {
  const isHe = navigator.language.startsWith('he');
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const t = {
    title: isHe ? 'השוק השחור' : 'BLACK MARKET',
    desc: isHe ? 'כלי נשק, הגנות וסטטוסים ללוויתנים בלבד.' : 'Weapons, defenses & status relics for whales.',
    balance: isHe ? 'היתרה שלך' : 'YOUR BALANCE',
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
      setCurrentUser(data);
    }
  };

  const handlePurchase = async (power: any) => {
    if (!currentUser) return;
    if (currentUser.drip_coins < power.price) return toast.error(isHe ? "אין מספיק DRIP" : "Not enough DRIP");

    if (navigator.vibrate) navigator.vibrate(50);
    setPurchasing(power.id);

    try {
      const newBalance = currentUser.drip_coins - power.price;
      setCurrentUser({ ...currentUser, drip_coins: newBalance });
      await supabase.from('drip_users').update({ drip_coins: newBalance }).eq('id', currentUser.id);

      const { data: existing } = await supabase.from('drip_inventory').select('id, quantity').eq('user_id', currentUser.id).eq('power_id', power.id).single();
      
      if (existing) {
        await supabase.from('drip_inventory').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('drip_inventory').insert({ user_id: currentUser.id, power_id: power.id, quantity: 1 });
      }

      toast.success(isHe ? 'הפריט נרכש לארסנל' : 'RELIC ACQUIRED', { icon: '⚜️' });
    } catch (err: any) {
      toast.error(err.message);
      loadUser();
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black pb-32 font-sans relative overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* אנימציית רקע חיה - כדור פלזמה סגול/פוקסיה שנושם לאט */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-fuchsia-900/30 blur-[140px] pointer-events-none z-0 rounded-full" 
      />

      <div className="pt-24 px-4 max-w-md mx-auto relative z-10">
        
        {/* ארנק עליון ענק ומרשים שמשולב בעמוד במקום כותרת תפריט */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 mb-10 text-center shadow-[0_15px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />
          <p className="text-[11px] font-black tracking-[0.2em] text-fuchsia-400/60 uppercase mb-2">{t.balance}</p>
          <div className="text-4xl font-black text-white drop-shadow-2xl flex items-center justify-center gap-2.5 tracking-tighter">
            {currentUser?.drip_coins?.toLocaleString() || 0} <DripCoin className="w-8 h-8" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.1em] text-white/30 uppercase mt-5 px-4">{t.desc}</p>
        </div>

        {/* גריד 40 הכוחות */}
        <div className="grid grid-cols-2 gap-4">
          {relics.map((power) => {
            const isLocked = !currentUser || currentUser.drip_coins < power.price;
            
            return (
              <div 
                key={power.id} 
                className={`bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[28px] p-5 flex flex-col items-center text-center shadow-2xl transition-all duration-300 ${isLocked ? 'opacity-50 grayscale-[60%]' : 'hover:border-fuchsia-500/20 hover:bg-white/[0.04]'}`}
              >
                
                {/* אייקון זוהר - עכשיו מעט יותר גדול ומרשים */}
                <div className="w-16 h-16 mb-4 rounded-full bg-black/60 flex items-center justify-center border border-white/5 shadow-inner relative overflow-hidden shrink-0">
                  <div className={`absolute inset-0 opacity-20 ${power.color.replace('text-', 'bg-')}`} />
                  <power.icon size={28} className={`${power.color} drop-shadow-[0_0_12px_currentColor] relative z-10`} />
                </div>
                
                {/* שם הנשק - אדפטציה לשפה */}
                <h3 className="text-[12px] font-black uppercase tracking-widest text-white/90 mb-1.5 leading-tight">
                  {isHe ? power.name : power.enName}
                </h3>
                
                {/* הסבר */}
                <p className="text-[10px] font-bold text-white/40 mb-5 h-8 leading-tight flex items-center justify-center">
                  {isHe ? power.desc : power.enDesc}
                </p>
                
                {/* כפתור רכישה עתידני */}
                <button
                  onClick={() => handlePurchase(power)}
                  disabled={purchasing === power.id || isLocked}
                  className={`w-full py-3.5 rounded-[18px] font-black text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mt-auto ${
                    isLocked 
                      ? 'bg-black/50 text-white/30 border border-white/5 shadow-none' 
                      : 'bg-white/5 text-white border border-white/10 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/30 active:scale-95 shadow-[0_5px_15px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {purchasing === power.id ? (
                    <Loader2 size={16} className="animate-spin text-fuchsia-400" />
                  ) : (
                    <>
                      {power.price.toLocaleString()} <DripCoin className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
