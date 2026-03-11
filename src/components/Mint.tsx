import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { UploadCloud, Zap, Loader2, PlusSquare } from 'lucide-react';
import { DripCoin } from './ui/DripCoin';

export default function Mint() {
  const isHe = navigator.language.startsWith('he');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  const t = {
    he: { 
      title: 'העלאה', 
      subtitle: 'יצירת נכס דיגיטלי', 
      name: 'שם הנכס', 
      namePlace: 'לדוגמה: כתר הזהב', 
      upload: 'העלאת מדיה', 
      drag: 'תמונה או וידאו', 
      btn: 'העלאה', 
      processing: 'מעלה...', 
      success: 'הנכס הועלה בהצלחה!', 
      change: 'לחץ להחלפה',
      startValue: 'שווי התחלתי'
    },
    en: { 
      title: 'UPLOAD', 
      subtitle: 'CREATE DIGITAL ASSET', 
      name: 'ASSET NAME', 
      namePlace: 'e.g. Golden Crown', 
      upload: 'UPLOAD MEDIA', 
      drag: 'IMAGE / VIDEO', 
      btn: 'UPLOAD', 
      processing: 'UPLOADING...', 
      success: 'Asset Uploaded!', 
      change: 'Tap to change',
      startValue: 'START VALUE'
    }
  }[isHe ? 'he' : 'en'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type.startsWith('video') ? 'video' : 'image');
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return toast.error(isHe ? "חסרים פרטים" : "Missing fields");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth error");

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('drip_media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('drip_media').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('drip_assets').insert({
        title,
        media_url: publicUrl.publicUrl,
        owner_id: user.id,
        creator_id: user.id,
        current_value: 500,
        initial_value: 500,
        hype_level: 100
      });

      if (dbError) throw dbError;
      
      toast.success(t.success, { icon: '⚡' });
      setTimeout(() => { window.location.hash = 'floor'; }, 1000);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black pb-32 font-sans relative overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* אנימציית רקע חיה - הילה סגולה עדינה */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] bg-fuchsia-900/20 blur-[120px] pointer-events-none z-0 rounded-full" 
      />

      <div className="pt-20 p-6 max-w-md mx-auto space-y-10 relative z-10">
        
        {/* כותרת נקייה ללא פס רקע */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <PlusSquare size={28} className="text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.5)]" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{t.subtitle}</h2>
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full w-fit mx-auto">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">{t.startValue}:</span>
            <span className="text-[11px] text-fuchsia-400 font-black flex items-center gap-1.5">
              500 <DripCoin className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <form onSubmit={handleMint} className="space-y-8">
          
          {/* אזור העלאת מדיה - עיצוב זכוכית עתידני */}
          <div className="relative w-full aspect-square bg-white/[0.02] border border-white/10 hover:border-fuchsia-500/30 rounded-[40px] overflow-hidden flex flex-col items-center justify-center transition-all group shadow-2xl">
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-20 cursor-pointer" />
            
            {preview ? (
              <>
                {fileType === 'video' ? (
                  <video src={preview} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-90 transition-opacity" />
                ) : (
                  <img src={preview} className="w-full h-full object-cover opacity-90 transition-opacity" alt="" />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 pointer-events-none backdrop-blur-[2px]">
                  <p className="text-white font-black tracking-widest uppercase text-[10px] px-5 py-2.5 bg-white/10 rounded-2xl border border-white/20">
                    {t.change}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-5 pointer-events-none">
                <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform group-hover:bg-fuchsia-500/10 group-hover:text-fuchsia-400 border border-white/5">
                  <UploadCloud size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-[0.2em]">{t.upload}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] mt-2">{t.drag}</p>
                </div>
              </div>
            )}
          </div>

          {/* שדה שם הנכס - נקי וכהה */}
          <div className="space-y-2.5 px-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{t.name}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.namePlace}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white outline-none focus:border-fuchsia-500/30 focus:bg-white/[0.04] transition-all font-bold tracking-wide shadow-inner placeholder:text-white/10"
            />
          </div>

          {/* כפתור העלאה מרחף */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading || !file || !title} 
              className="w-full py-5 bg-fuchsia-500 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[12px] active:scale-95 transition-all shadow-[0_15px_30px_rgba(232,121,249,0.2)] disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Zap size={18} fill="currentColor" /> 
                  {t.btn}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
