import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, MessageSquare, Crosshair, Loader2 } from 'lucide-react';

interface PublicProfileProps {
  targetUserId: string;
  onClose: () => void;
}

export default function PublicProfile({ targetUserId, onClose }: PublicProfileProps) {
  const isHe = navigator.language.startsWith('he');
  const [profile, setProfile] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [targetUserId]);

  const loadUser = async () => {
    const { data: p } = await supabase.from('drip_users').select('*').eq('id', targetUserId).single();
    const { data: a } = await supabase.from('drip_assets').select('*').eq('owner_id', targetUserId);
    setProfile(p);
    setAssets(a || []);
    setLoading(false);
  };

  const startChat = () => {
    window.location.hash = `room_${targetUserId}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#020202] z-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={40} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-[#020202] z-50 overflow-y-auto pb-32 font-sans custom-scrollbar" dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="sticky top-0 px-4 py-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-10 shadow-lg">
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          {isHe ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Target Acquired</h2>
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="p-6 max-w-md mx-auto space-y-8 mt-4">
        
        {/* פרטי היוזר */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 bg-[#0a0a0a] rounded-full border-2 border-cyan-500/30 flex items-center justify-center text-5xl mb-4 shadow-[0_0_30px_rgba(34,211,238,0.15)]">🧑🏽‍🚀</div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">{profile.username}</h2>
          
          <div className="flex gap-4 mt-6 w-full">
            <button onClick={startChat} className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
              <MessageSquare size={16} /> {isHe ? 'הודעה' : 'Message'}
            </button>
            <button className="flex-1 py-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center gap-2 text-cyan-400 font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors">
              <Crosshair size={16} /> {isHe ? 'השתלטות' : 'Attack'}
            </button>
          </div>
        </div>

        {/* שווי נקי */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-6 text-center shadow-lg">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Total Net Worth</p>
          <div className="text-4xl font-black text-white">💧 {((profile?.drip_coins || 0) + assets.reduce((s,a)=>s+a.current_value,0)).toLocaleString()}</div>
        </div>

        {/* כספת (The Vault) */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-white/40 uppercase px-2">The Vault ({assets.length})</h3>
          {assets.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl">
              <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{isHe ? 'הכספת ריקה' : 'Vault is empty'}</p>
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="bg-[#0a0a0a] border border-white/5 rounded-[20px] p-3 flex gap-4 items-center shadow-lg">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  {asset.media_url.endsWith('.mp4') ? <video src={asset.media_url} muted loop autoPlay className="w-full h-full object-cover" /> : <img src={asset.media_url} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-2">{asset.title}</h4>
                  <span className="text-cyan-400 text-xs font-black">💧 {asset.current_value.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
