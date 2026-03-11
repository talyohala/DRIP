import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, Search, ChevronLeft, Hexagon, Lock } from 'lucide-react';

export default function Chat() {
  const isHe = navigator.language.startsWith('he');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    he: { title: 'הודעות VIP', sub: 'תקשורת אקסקלוסיבית', search: 'חיפוש אנשי קשר...', noRes: 'לא נמצאו משתמשים', tribute: 'דורש תשלום' },
    en: { title: 'VIP COMMS', sub: 'EXCLUSIVE NETWORK', search: 'Search contacts...', noRes: 'No users found', tribute: 'Tribute Req' }
  }[isHe ? 'he' : 'en'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // משיכת משתמשים כולל כמות המטבעות שלהם כדי לדעת אם הם "לוויתנים" הדורשים תשלום להודעה
    const { data } = await supabase.from('drip_users').select('*').neq('id', user.id).order('drip_coins', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const filteredUsers = useMemo(() =>
    users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, users]
  );

  if (loading) return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <Loader2 className="animate-spin text-white/50" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] pb-40 relative" dir={isHe ? 'rtl' : 'ltr'}>
      
      <div className="px-6 py-5 fixed top-0 left-0 right-0 z-40 bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-black italic uppercase tracking-widest text-white flex items-center gap-2">
          <MessageSquare size={20} className="text-white/80" /> {t.title}
        </h1>
      </div>

      <div className="pt-28 p-5 max-w-md mx-auto space-y-6">
        
        {/* שדה חיפוש יוקרתי */}
        <div className="relative group">
          <Search className={`absolute ${isHe ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors`} size={18} />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className={`w-full bg-[#050505] border border-white/10 rounded-full py-4 ${isHe ? 'pl-12 pr-6' : 'pr-12 pl-6'} text-white outline-none focus:border-white/30 transition-all font-bold text-sm shadow-inner`}
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map((u, i) => {
            // לוגיקה ויזואלית: משתמשים עם מעל 50,000 Dripcoin דורשים "מתנת זהב" כדי לפתוח שיחה
            const requiresTribute = u.drip_coins > 50000;

            return (
              <motion.div
                key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => window.location.hash = `room_${u.id}`}
                className="bg-[#050505] border border-white/5 rounded-[24px] p-4 flex gap-4 items-center cursor-pointer hover:bg-white/5 transition-all group"
              >
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden shrink-0 ${requiresTribute ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-white/10 bg-white/5'}`}>
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover opacity-90" /> : <span className="text-lg">🧑🏽‍🚀</span>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                    {u.username} {u.is_verified && <Hexagon size={12} className="text-yellow-400 fill-yellow-400/20 shrink-0" />}
                  </h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5 truncate">
                    {isHe ? 'הקש לשיחה' : 'Tap to chat'}
                  </p>
                </div>

                {requiresTribute ? (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 shrink-0">
                    <Lock size={10} className="text-yellow-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">{t.tribute}</span>
                  </div>
                ) : (
                  <ChevronLeft size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                )}
              </motion.div>
            );
          })}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{t.noRes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
