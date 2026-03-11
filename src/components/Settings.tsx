import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, LogOut, Camera, Loader2, Save } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: () => void;
}

export default function Settings({ isOpen, onClose, profile, onUpdate }: SettingsProps) {
  const isHe = navigator.language.startsWith('he');
  const [username, setUsername] = useState(profile?.username || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const t = {
    he: { title: 'הגדרות', logout: 'התנתקות', save: 'שמירה', name: 'כינוי', avatar: 'שנה תמונה' },
    en: { title: 'SETTINGS', logout: 'LOGOUT', save: 'SAVE', name: 'USERNAME', avatar: 'CHANGE AVATAR' }
  }[isHe ? 'he' : 'en'];

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${profile.id}_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('drip_media').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: publicUrl } = supabase.storage.from('drip_media').getPublicUrl(fileName);
      await supabase.from('drip_users').update({ avatar_url: publicUrl.publicUrl }).eq('id', profile.id);
      
      toast.success(isHe ? 'תמונה עודכנה' : 'Avatar updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim() || username === profile?.username) return onClose();
    setSaving(true);
    try {
      const { error } = await supabase.from('drip_users').update({ username }).eq('id', profile.id);
      if (error) throw error;
      toast.success(isHe ? 'הפרופיל עודכן' : 'Profile updated');
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" dir={isHe ? 'rtl' : 'ltr'}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-10">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">{t.title}</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full border-2 border-white/10 bg-[#111] flex items-center justify-center overflow-hidden mb-3">
              {uploading ? <Loader2 size={24} className="text-cyan-400 animate-spin" /> : 
                (profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="text-3xl">🧑🏽‍🚀</div>)
              }
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 pt-1 pb-2 flex justify-center pointer-events-none">
                <Camera size={14} className="text-white/80" />
              </div>
            </div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{t.avatar}</p>
          </div>

          {/* Username Edit */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">{t.name}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-cyan-500/50 transition-all font-bold" />
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-cyan-400 text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {t.save}</>}
            </button>
            <button onClick={handleLogout} className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-95 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
