import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { Bell, Zap, Loader2, Biohazard, Crown, FileText, CloudFog, ShieldAlert } from 'lucide-react';

export default function Notifications() {
  const isHe = navigator.language.startsWith('he');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    he: { title: 'חדר בקרה', empty: 'הכל שקט בזירה בינתיים.' },
    en: { title: 'COMMAND CENTER', empty: 'All quiet on the floor.' }
  }[isHe ? 'he' : 'en'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // משיכת ההתראות יחד עם פרטי המשתמש (מי שעשה את הפעולה) והנכס
    const { data } = await supabase
      .from('drip_notifications')
      .select('id, type, is_read, created_at, actor:actor_id(username), asset:asset_id(title, media_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);

    // סימון כל ההתראות כ"נקראו" אוטומטית כפי שהגדרת
    const unreadIds = data?.filter(n => !n.is_read).map(n => n.id) || [];
    if (unreadIds.length > 0) {
      await supabase.from('drip_notifications').update({ is_read: true }).in('id', unreadIds);
    }
  };

  // פונקציית חכמה שקובעת את המראה והטקסט של כל התראה לפי הסוג שלה
  const getNotifData = (notif: any) => {
    const actorName = notif.actor?.username || (isHe ? 'מישהו' : 'Someone');
    const assetTitle = notif.asset?.title || (isHe ? 'נכס' : 'Asset');

    switch (notif.type) {
      case 'takeover':
        return {
          icon: Zap, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', shadow: 'shadow-[0_0_10px_#22d3ee]', lineColor: 'bg-cyan-400',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> השתלט על הנכס שלך <span className="font-bold text-cyan-400">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> took over <span className="font-bold text-cyan-400">{assetTitle}</span></>
        };
      case 'sabotage':
        return {
          icon: Biohazard, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', shadow: 'shadow-[0_0_10px_#10b981]', lineColor: 'bg-emerald-400',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> הרעיל והפיל את השווי של <span className="font-bold text-emerald-400">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> sabotaged <span className="font-bold text-emerald-400">{assetTitle}</span></>
        };
      case 'royalty':
        return {
          icon: Crown, color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', shadow: 'shadow-[0_0_10px_#eab308]', lineColor: 'bg-yellow-400',
          text: isHe ? <>קיבלת עמלת יוצר על <span className="font-bold text-yellow-400">{assetTitle}</span> מ-<span className="font-black text-white">{actorName}</span></> 
                     : <>Received royalties for <span className="font-bold text-yellow-400">{assetTitle}</span> from <span className="font-black text-white">{actorName}</span></>
        };
      case 'tax':
        return {
          icon: FileText, color: 'text-lime-400', border: 'border-lime-500/30', bg: 'bg-lime-500/5', shadow: 'shadow-[0_0_10px_#a3e635]', lineColor: 'bg-lime-400',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> שילם לך מס קריפטו כשהשתלט על <span className="font-bold text-lime-400">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> paid crypto tax for <span className="font-bold text-lime-400">{assetTitle}</span></>
        };
      case 'smoke':
        return {
          icon: CloudFog, color: 'text-slate-300', border: 'border-slate-500/30', bg: 'bg-slate-500/5', shadow: 'shadow-[0_0_10px_#cbd5e1]', lineColor: 'bg-slate-300',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> זרק מסך עשן שמסתיר את <span className="font-bold text-slate-300">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> deployed smoke on <span className="font-bold text-slate-300">{assetTitle}</span></>
        };
      case 'frozen':
        return {
          icon: ShieldAlert, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5', shadow: 'shadow-[0_0_10px_#3b82f6]', lineColor: 'bg-blue-400',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> ננעל בטעות על חומת המגן שלך בנכס <span className="font-bold text-blue-400">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> hit your shield on <span className="font-bold text-blue-400">{assetTitle}</span></>
        };
      default:
        return {
          icon: Bell, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', shadow: 'shadow-[0_0_10px_#22d3ee]', lineColor: 'bg-cyan-400',
          text: isHe ? <><span className="font-black text-white">{actorName}</span> יצר אינטראקציה עם <span className="font-bold text-cyan-400">{assetTitle}</span></> 
                     : <><span className="font-black text-white">{actorName}</span> interacted with <span className="font-bold text-cyan-400">{assetTitle}</span></>
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] pb-32 font-sans relative" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-4 fixed top-0 left-0 right-0 z-40 bg-[#020202]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-black tracking-widest uppercase italic text-white flex items-center gap-2">
          <Bell size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          {t.title}
        </h1>
        <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">Live</span>
        </div>
      </div>

      {/* רשימת ההתראות */}
      <div className="pt-24 p-6 max-w-md mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cyan-400" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const data = getNotifData(notif);
            const Icon = data.icon;
            
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-[#0a0a0a] border ${notif.is_read ? 'border-white/5 opacity-70' : `${data.border} ${data.bg}`} rounded-[20px] p-4 flex gap-4 items-center shadow-lg relative overflow-hidden`}
              >
                {/* קו זוהר אם לא נקרא, משתנה לפי סוג ההתראה! */}
                {!notif.is_read && <div className={`absolute top-0 bottom-0 ${isHe ? 'right-0' : 'left-0'} w-1 ${data.lineColor} ${data.shadow}`} />}

                {/* אייקון זוהר ודינמי */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${notif.is_read ? 'bg-white/5 border-white/5' : `${data.bg} ${data.border}`}`}>
                  <Icon size={20} className={data.color} />
                </div>

                <div className={`flex-1 min-w-0 ${isHe ? 'text-right' : 'text-left'}`}>
                  <p className="text-[13px] text-white/90 font-medium leading-tight mb-1" dir="auto">
                    {data.text}
                  </p>
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                    {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
