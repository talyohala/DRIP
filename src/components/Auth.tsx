import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Auth() {
  const isHe = navigator.language.startsWith('he');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const t = {
    he: { mint: 'הרשמה', signin: 'כניסה', userPlace: 'כינוי בזירה...', emailPlace: 'אימייל...', passPlace: 'סיסמה...', terms: 'הכניסה מהווה הסכמה לתקנון הפרוטוקול.', welcome: 'ברוך הבא לזירה!', emptyFields: 'חובה למלא את כל השדות' },
    en: { mint: 'SIGN UP', signin: 'SIGN IN', userPlace: 'Username...', emailPlace: 'Email...', passPlace: 'Password...', terms: 'By entering, you agree to the protocol rules.', welcome: 'Welcome to the floor!', emptyFields: 'Please fill all fields' }
  }[isHe ? 'he' : 'en'];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !username)) {
      toast.error(t.emptyFields);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // ניקוי השם משטרודלים לפני השליחה
        const cleanUsername = username.trim().replace('@', '');
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: cleanUsername } },
        });

        if (error) throw error;

        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
        }

        toast.success(t.welcome);
        setTimeout(() => { window.location.hash = 'floor'; window.location.reload(); }, 800);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t.welcome);
        setTimeout(() => { window.location.hash = 'floor'; window.location.reload(); }, 500);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-8 font-sans text-white relative overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full max-sm space-y-16 relative z-10">
        <div className="text-center">
          <motion.h1 
            animate={{ textShadow: ["0px 0px 0px rgba(34,211,238,0)", "0px 0px 40px rgba(34,211,238,0.5)", "0px 0px 0px rgba(34,211,238,0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl"
          >DRIP</motion.h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className="flex border-b border-white/10 mb-8">
            <button type="button" onClick={() => setIsSignUp(true)} className={`flex-1 pb-4 text-[10px] font-black tracking-widest transition-all ${isSignUp ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/30'}`}>{t.mint}</button>
            <button type="button" onClick={() => setIsSignUp(false)} className={`flex-1 pb-4 text-[10px] font-black tracking-widest transition-all ${!isSignUp ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/30'}`}>{t.signin}</button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isSignUp ? 'signup' : 'signin'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {isSignUp && (
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 px-6 outline-none focus:border-cyan-500/50 text-sm font-medium" placeholder={t.userPlace} />
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 px-6 outline-none focus:border-cyan-500/50 text-sm font-medium" placeholder={t.emailPlace} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 px-6 outline-none focus:border-cyan-500/50 text-sm font-medium" placeholder={t.passPlace} />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center pt-6">
            <button type="submit" disabled={loading} className="w-16 h-16 bg-cyan-400 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              {loading ? <Loader2 size={24} className="animate-spin" /> : <ArrowLeft size={28} />}
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-white/20 font-medium tracking-wide">{t.terms}</p>
      </div>
    </div>
  );
}
