import { motion } from 'framer-motion';
import { Loader2, LogOut, Settings2, Shield, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Chat from './Chat';
import { DripCoinBadge } from './DripCoinBadge';
import Notifications from './Notifications';

type LooseRecord = Record<string, any>;
type VaultTab = 'vault' | 'notifications' | 'chat';

const isVideo = (url: string) => ['mp4', 'mov', 'webm', 'quicktime'].includes(url.split('.').pop()?.toLowerCase() || '');

type ProfileProps = {
  onOpenSettings: () => void;
};

export default function Profile({ onOpenSettings }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<LooseRecord | null>(null);
  const [assets, setAssets] = useState<LooseRecord[]>([]);
  const [tab, setTab] = useState<VaultTab>('vault');

  useEffect(() => {
    void loadProfile();
    const channel = supabase
      .channel('profile-live-vault')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => void loadAssets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_users' }, () => void loadProfile(false))
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadProfile = async (withAssets = true) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('drip_users').select('*').eq('id', user.id).single();
    setCurrentUser(data);
    if (withAssets) {
      await loadAssets(user.id);
    }
    setLoading(false);
  };

  const loadAssets = async (userId = currentUser?.id) => {
    if (!userId) return;
    const { data } = await supabase
      .from('drip_assets')
      .select('id, title, media_url, current_value, created_at, last_takeover_at, owner_id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    setAssets(data ?? []);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('נותקת מהחשבון');
  };

  if (loading) {
    return (
      <div className="grid h-[100dvh] place-items-center">
        <Loader2 className="animate-spin text-[#0A84FF]" />
      </div>
    );
  }

  return (
    <section className="hide-scrollbar h-[100dvh] overflow-y-auto pb-32 pt-5">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4">
        <article className="glass-panel rounded-[2rem] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/15 bg-[#111112]">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} className="h-full w-full object-cover" alt={currentUser.username || 'משתמש'} />
                ) : (
                  <UserRound size={20} className="text-white/75" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-white">{currentUser?.username || 'משתמש'}</h1>
                <p className="text-xs text-white/55">כספת פרופיל ומרכז שליטה אישי</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSettings}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70"
                aria-label="הגדרות"
              >
                <Settings2 size={16} />
              </button>
              <button
                onClick={() => void handleSignOut()}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#FF453A]/35 bg-[#FF453A]/10 text-[#FF453A]"
                aria-label="יציאה"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#0A84FF]" />
              <span className="text-xs font-semibold text-white/70">יתרת מסחר זמינה</span>
            </div>
            <DripCoinBadge amount={(currentUser?.drip_coins ?? 0).toLocaleString('he-IL')} />
          </div>
        </article>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#1C1C1E]/75 p-1">
          <button
            onClick={() => setTab('vault')}
            className={`rounded-xl py-2 text-xs font-bold transition ${tab === 'vault' ? 'bg-[#0A84FF]/20 text-white' : 'text-white/55'}`}
          >
            כספת
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`rounded-xl py-2 text-xs font-bold transition ${tab === 'notifications' ? 'bg-[#0A84FF]/20 text-white' : 'text-white/55'}`}
          >
            התראות
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`rounded-xl py-2 text-xs font-bold transition ${tab === 'chat' ? 'bg-[#0A84FF]/20 text-white' : 'text-white/55'}`}
          >
            צ׳אט
          </button>
        </div>

        {tab === 'vault' && (
          <article className="glass-panel rounded-[2rem] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">כספת מדיה</h2>
              <span className="text-[11px] font-semibold text-white/55">{assets.length} פריטים</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#111112]"
                >
                  <div className="relative aspect-square">
                    {isVideo(asset.media_url) ? (
                      <video src={asset.media_url} className="h-full w-full object-cover" muted playsInline loop />
                    ) : (
                      <img src={asset.media_url} className="h-full w-full object-cover" alt={asset.title || 'נכס'} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                      <p className="truncate text-[11px] font-bold text-white">{asset.title || 'ללא שם'}</p>
                      <DripCoinBadge amount={(asset.current_value ?? 0).toLocaleString('he-IL')} className="mt-1 w-fit py-0.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {assets.length === 0 && <p className="text-center text-xs text-white/45">הכספת עדיין ריקה</p>}
          </article>
        )}

        {tab === 'notifications' && <Notifications userId={currentUser?.id} />}
        {tab === 'chat' && <Chat userId={currentUser?.id} />}
      </div>
    </section>
  );
}
