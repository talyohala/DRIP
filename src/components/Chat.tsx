import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type LooseRecord = Record<string, any>;

type ChatLine = {
  id: string;
  text: string;
  time: number;
  source: 'system' | 'me';
};

type ChatProps = {
  userId?: string | null;
};

const formatTime = (value: number) => new Date(value).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

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
        text: `נכס ${item.title || 'ללא שם'} כרגע בבעלות ${item.owner?.username || 'משתמש'}`,
        time: new Date(item.last_takeover_at || item.created_at).getTime(),
        source: 'system',
      })) ?? [];

    setSystemLines(lines);
  };

  const lines = useMemo(() => {
    return [...systemLines, ...localLines].sort((a, b) => a.time - b.time);
  }, [systemLines, localLines]);

  const sendLocalMessage = () => {
    if (!value.trim()) return;
    const nowIso = new Date().toISOString();
    setLocalLines((prev) => [
      ...prev,
      {
        id: `${nowIso}-${Math.random().toString(16).slice(2)}`,
        text: value.trim(),
        time: new Date(nowIso).getTime(),
        source: 'me',
      },
    ]);
    setValue('');
  };

  return (
    <article className="glass-panel rounded-[2rem] p-4">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquare size={16} className="text-[#0A84FF]" />
        <h2 className="text-lg font-semibold text-white">צ׳אט מסחר</h2>
      </div>
      <div className="hide-scrollbar mb-2 max-h-44 space-y-2 overflow-y-auto pr-1">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`rounded-xl border px-3 py-2 text-xs ${
              line.source === 'me'
                ? 'border-[#0A84FF]/35 bg-[#0A84FF]/14 text-white'
                : 'border-white/10 bg-black/30 text-white/85'
            }`}
          >
            <p>{line.text}</p>
            <p className="mt-1 text-[10px] text-white/52">{formatTime(line.time)}</p>
          </div>
        ))}
        {lines.length === 0 && <p className="text-xs text-white/52">אין הודעות כרגע</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="כתוב הודעה קצרה"
          className="w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-[#0A84FF]/55"
          disabled={!userId}
        />
        <button
          onClick={sendLocalMessage}
          disabled={!userId}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#0A84FF]/45 bg-[#0A84FF]/14 text-white transition hover:bg-[#0A84FF]/25 disabled:border-white/10 disabled:bg-black/35 disabled:text-white/35"
          aria-label="שליחה"
        >
          <Send size={14} />
        </button>
      </div>
    </article>
  );
}
