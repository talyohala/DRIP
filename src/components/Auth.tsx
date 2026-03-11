import { Loader2, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { DripCoinIcon } from './DripCoinIcon';

type LooseRecord = Record<string, any>;

type AuthProps = {
  onProfileChange?: (profile: LooseRecord | null) => void;
};

export default function Auth({ onProfileChange }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<LooseRecord | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);
      if (nextUserId) {
        void loadProfile(nextUserId);
      } else {
        setProfile(null);
        onProfileChange?.(null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const nextUserId = user?.id ?? null;
    setUserId(nextUserId);
    if (nextUserId) {
      await loadProfile(nextUserId);
    }
    setLoading(false);
  };

  const loadProfile = async (id: string) => {
    const { data } = await supabase.from('drip_users').select('*').eq('id', id).maybeSingle();
    setProfile(data ?? null);
    onProfileChange?.(data ?? null);
  };

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('יש להזין אימייל וסיסמה');
      return;
    }
    try {
      setSubmitting(true);
      const signIn = await supabase.auth.signInWithPassword({ email, password });
      if (!signIn.error) {
        toast.success('התחברות הצליחה');
        setEmail('');
        setPassword('');
        return;
      }

      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) throw signUp.error;
      toast.success('חשבון נוצר והתחברות בוצעה');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'שגיאת התחברות');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile(null);
    setUserId(null);
    onProfileChange?.(null);
    toast.success('נותקת מהחשבון');
  };

  if (loading) {
    return (
      <article className="rounded-[1.7rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl">
        <p className="text-sm text-[#E5E7EB]/65">טוען פרטי חשבון...</p>
      </article>
    );
  }

  if (userId && profile) {
    return (
      <article className="rounded-[1.7rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-white/20 bg-black/35">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username || 'משתמש'} className="h-full w-full object-cover" /> : <UserRound size={18} className="text-[#E5E7EB]/75" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[#E5E7EB]">{profile.username || 'חשבון פעיל'}</p>
            <p className="truncate text-[11px] text-[#E5E7EB]/55">{profile.email || 'ללא אימייל ציבורי'}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
            <p className="text-[10px] text-[#E5E7EB]/52">יתרה</p>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#E5E7EB]">
              {(profile.drip_coins ?? 0).toLocaleString('he-IL')}
              <DripCoinIcon />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
            <p className="text-[10px] text-[#E5E7EB]/52">מזהה חשבון</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-[#E5E7EB]/84">{userId.slice(0, 10)}...</p>
          </div>
        </div>
        <button
          onClick={() => void handleSignOut()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs font-semibold text-[#E5E7EB]/85 transition hover:border-[#FF3B30]/45 hover:text-[#E5E7EB]"
        >
          <LogOut size={14} />
          יציאה מהחשבון
        </button>
      </article>
    );
  }

  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl">
      <h2 className="text-lg font-semibold text-[#E5E7EB]">התחברות לחשבון</h2>
      <p className="mt-1 text-xs text-[#E5E7EB]/55">התחברות שומרת את הנתונים האישיים שלך בזמן אמת</p>
      <form onSubmit={handleAuth} className="mt-3 space-y-2.5">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="אימייל"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#E5E7EB] outline-none transition focus:border-[#007AFF]/55"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="סיסמה"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-[#E5E7EB] outline-none transition focus:border-[#007AFF]/55"
        />
        <button
          disabled={submitting}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#007AFF]/45 bg-[#007AFF]/14 px-3 py-2.5 text-sm font-semibold text-[#E5E7EB] transition hover:bg-[#007AFF]/22 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? 'מתחבר...' : 'התחבר / צור חשבון'}
        </button>
      </form>
    </article>
  );
}
