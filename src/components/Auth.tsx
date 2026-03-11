import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type LooseRecord = Record<string, any>;

type AuthProps = {
  onProfileChange?: (profile: LooseRecord | null) => void;
};

export default function Auth({ onProfileChange: _onProfileChange }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim() || (isSignUp && !username.trim())) {
      toast.error('יש למלא את כל השדות');
      return;
    }
    try {
      setSubmitting(true);
      if (isSignUp) {
        const cleanUsername = username.trim().replace('@', '');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: cleanUsername } },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) throw loginError;
        }
        toast.success('נרשמת בהצלחה, ברוך הבא לזירה');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('התחברת בהצלחה');
      }
    } catch (err: any) {
      toast.error(err?.message || 'שגיאת התחברות');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black px-6">
      <div className="glass-panel w-full max-w-md rounded-[2.1rem] p-6">
        <div className="mb-7 text-center">
          <h1 className="text-gradient text-6xl font-black tracking-tight">DRIP</h1>
          <p className="mt-3 text-xs font-semibold tracking-[0.16em] text-white/55">מסחר חי בזמן אמת</p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#111112] p-1">
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`rounded-xl py-2 text-xs font-bold transition ${isSignUp ? 'bg-[#0A84FF]/20 text-white' : 'text-white/50'}`}
          >
            הרשמה
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`rounded-xl py-2 text-xs font-bold transition ${!isSignUp ? 'bg-[#0A84FF]/20 text-white' : 'text-white/50'}`}
          >
            כניסה
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {isSignUp && (
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="שם משתמש"
              className="w-full rounded-2xl border border-white/10 bg-[#111112] px-4 py-3 text-sm text-white outline-none transition focus:border-[#0A84FF]/55"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="אימייל"
            className="w-full rounded-2xl border border-white/10 bg-[#111112] px-4 py-3 text-sm text-white outline-none transition focus:border-[#0A84FF]/55"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="סיסמה"
            className="w-full rounded-2xl border border-white/10 bg-[#111112] px-4 py-3 text-sm text-white outline-none transition focus:border-[#0A84FF]/55"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0A84FF]/50 bg-[#0A84FF]/18 px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0A84FF]/25 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
            {submitting ? 'מעבד בקשה...' : isSignUp ? 'יצירת חשבון' : 'כניסה לזירה'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-white/35">הכניסה מהווה אישור לתנאי הפלטפורמה</p>
      </div>
    </section>
  );
}
