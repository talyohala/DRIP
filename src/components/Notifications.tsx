import { Bell, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type LooseRecord = Record<string, any>;

type Notice = {
  id: string;
  title: string;
  time: string;
  type: 'threat' | 'success' | 'neutral';
};

type NotificationsProps = {
  userId?: string | null;
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return 'ללא זמן';
  return new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export default function Notifications({ userId }: NotificationsProps) {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    void fetchNotifications(userId);
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_notifications' }, () => void fetchNotifications(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => void fetchNotifications(userId))
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async (id: string) => {
    setLoading(true);
    const { data: directData, error: directError } = await supabase
      .from('drip_notifications')
      .select('id, title, is_read, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(12);

    if (!directError && directData && directData.length > 0) {
      const directItems: Notice[] = directData.map((item: LooseRecord) => ({
        id: item.id,
        title: item.title || 'עדכון חדש בזירה',
        time: formatTime(item.created_at),
        type: item.is_read ? 'neutral' : 'success',
      }));
      setItems(directItems);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('drip_assets')
      .select('id, title, frozen_until, smoked_until, double_decay_until, taxed_by, last_takeover_at, created_at')
      .eq('owner_id', id)
      .order('last_takeover_at', { ascending: false })
      .limit(8);

    const mapped: Notice[] =
      data?.map((asset: LooseRecord) => {
        const isThreat = Boolean(
          (asset.smoked_until && new Date(asset.smoked_until) > new Date()) ||
            (asset.double_decay_until && new Date(asset.double_decay_until) > new Date()) ||
            asset.taxed_by,
        );
        const isSuccess = Boolean(asset.frozen_until && new Date(asset.frozen_until) > new Date());

        let title = `פעילות על ${asset.title || 'נכס ללא שם'}`;
        let type: Notice['type'] = 'neutral';

        if (isThreat) {
          title = `איום פעיל על ${asset.title || 'נכס ללא שם'}`;
          type = 'threat';
        } else if (isSuccess) {
          title = `הגנה פעילה על ${asset.title || 'נכס ללא שם'}`;
          type = 'success';
        }

        return {
          id: asset.id,
          title,
          type,
          time: formatTime(asset.last_takeover_at || asset.created_at),
        };
      }) ?? [];

    setItems(mapped);
    setLoading(false);
  };

  if (!userId) {
    return (
      <article className="glass-panel rounded-[2rem] p-4">
        <h2 className="text-lg font-semibold text-white">התראות</h2>
        <p className="mt-1 text-xs text-white/55">לאחר התחברות יוצגו כאן עדכוני מצב על הנכסים שלך</p>
      </article>
    );
  }

  return (
    <article className="glass-panel rounded-[2rem] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Bell size={16} className="text-[#0A84FF]" />
        <h2 className="text-lg font-semibold text-white">התראות</h2>
      </div>
      {loading && <p className="text-xs text-white/55">טוען התראות...</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
            {item.type === 'threat' ? (
              <ShieldAlert size={14} className="text-[#FF3B30]" />
            ) : item.type === 'success' ? (
              <ShieldCheck size={14} className="text-[#0A84FF]" />
            ) : (
              <Bell size={14} className="text-white/65" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/90">{item.title}</p>
              <p className="text-[10px] text-white/52">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
      {!loading && items.length === 0 && <p className="text-xs text-white/50">אין התראות פעילות כרגע</p>}
    </article>
  );
}
