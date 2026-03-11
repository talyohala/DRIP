import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type LooseRecord = Record<string, any>;

type ChatLine = {
  id: string;
  text: string;
  time: string;
  source: 'system' | 'me';
};

type ChatProps = {
  userId?: string | null;
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

export default function Chat({ userId }: ChatProps) {
  const [value, setValue] = useState('');
  const [systemLines, setSystemLines] = useState<ChatLine[]>([]);
  const [localLines, setLocalLines] = useState<ChatLine[]>([]);

  useEffect(() => {
    if (!userId) {
      setSystemLines([]);
      return;
    }
    void fetchSystemFeed();
    const channel = supabase
      .channel(`chat-stream-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_assets' }, () => void fetchSystemFeed())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchSystemFeed = async () => {
    const { data } = await supabase
      .from('drip_assets')
      .select('id, title, owner:drip_users!owner_id(username), last_takeover_at, created_at')
      .order('last_takeover_at', { ascending: false })
      .limit(6);

    const lines: ChatLine[] =
      data?.map((item: LooseRecord) => ({
        id: item.id,
        text: `נכס ${item.title || 'ללא שם'} כרגע אצל ${item.owner?.username || 'משתמש'}`,
        time: formatTime(item.last_takeover_at || item.created_at),
        source: 'system',
      })) ?? [];

    setSystemLines(lines);
  };

  const lines = useMemo(() => {
    return [...systemLines, ...localLines].sort((a, b) => a.time.localeCompare(b.time));
  }, [systemLines, localLines]);

  const sendLocalMessage = () => {
    if (!value.trim()) return;
    const nowIso = new Date().toISOString();
    setLocalLines((prev) => [
      ...prev,
      {
        id: `${nowIso}-${Math.random().toString(16).slice(2)}`,
        text: value.trim(),
        time: formatTime(nowIso),
        source: 'me',
      },
    ]);
    setValue('');
  };

  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-[#111111]/76 p-4 backdrop-blur-3xl">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquare size={16} className="text-[#E5E7EB]/75" />
        <h2 className="text-lg font-semibold text-[#E5E7EB]">צ׳אט מסחר</h2>
      </div>
      <div className="hide-scrollbar mb-2 max-h-44 space-y-2 overflow-y-auto pr-1">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`rounded-xl border px-3 py-2 text-xs ${
              line.source === 'me'
                ? 'border-[#007AFF]/35 bg-[#007AFF]/14 text-[#E5E7EB]'
                : 'border-white/10 bg-black/30 text-[#E5E7EB]/85'
            }`}
          >
            <p>{line.text}</p>
            <p className="mt-1 text-[10px] text-[#E5E7EB]/52">{line.time}</p>
          </div>
        ))}
        {lines.length === 0 && <p className="text-xs text-[#E5E7EB]/52">אין הודעות כרגע</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="כתוב הודעה קצרה"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-[#E5E7EB] outline-none transition focus:border-[#007AFF]/55"
          disabled={!userId}
        />
        <button
          onClick={sendLocalMessage}
          disabled={!userId}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#007AFF]/45 bg-[#007AFF]/14 text-[#E5E7EB] transition hover:bg-[#007AFF]/25 disabled:border-white/10 disabled:bg-black/35 disabled:text-[#E5E7EB]/35"
          aria-label="שליחה"
        >
          <Send size={14} />
        </button>
      </div>
    </article>
  );
}
