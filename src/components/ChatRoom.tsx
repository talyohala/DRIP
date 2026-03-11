import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, ChevronRight, Loader2, Hexagon, Star, CheckCheck, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatRoomProps {
  targetUserId: string;
}

export default function ChatRoom({ targetUserId }: ChatRoomProps) {
  const isHe = navigator.language.startsWith('he');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join('--');

  useEffect(() => {
    loadRoom();
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadRoom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    const { data: tUser } = await supabase.from('drip_users').select('*').eq('id', targetUserId).single();
    if (tUser) setTargetUser(tUser);

    const roomId = getRoomId(user.id, targetUserId);

    // סימון הודעות כ"נקראו" בכניסה לחדר
    await supabase.from('drip_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .neq('user_id', user.id);

    fetchMessages(roomId);

    // האזנה להודעות חדשות וגם לעדכוני "נקרא" (ווי כפול)
    const channel = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drip_messages', filter: `room_id=eq.${roomId}` }, () => {
        fetchMessages(roomId);
      })
      .subscribe();

    setLoading(false);
    return () => { supabase.removeChannel(channel); };
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase.from('drip_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = newMessage.trim();
    if (!txt || !currentUser || sending) return;

    setSending(true);
    setNewMessage('');
    const roomId = getRoomId(currentUser.id, targetUserId);

    try {
      await supabase.from('drip_messages').insert({
        user_id: currentUser.id,
        room_id: roomId,
        text: txt,
        is_read: false
      });
    } catch (err: any) {
      toast.error(err.message);
      setNewMessage(txt);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020202] z-50 flex flex-col font-sans" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header מעודכן */}
      <div className="px-4 py-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 flex items-center gap-4 z-10 shrink-0 shadow-lg">
        <button onClick={() => window.location.hash = 'chat'} className="p-2 bg-white/5 rounded-full">
          {isHe ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
            {targetUser?.avatar_url ? <img src={targetUser.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🧑🏽‍🚀</div>}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{targetUser?.username || '...'}</h2>
              {targetUser?.is_verified && <Hexagon size={14} className="text-cyan-400 fill-cyan-400/20" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee] animate-pulse" />
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                {isHe ? 'מחובר' : 'Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cyan-400" /></div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.user_id === currentUser?.id;
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[80%] p-3.5 rounded-2xl text-sm font-medium ${
                  isMe ? 'bg-cyan-400 text-black rounded-br-none' : 'bg-[#111] text-white/90 border border-white/10 rounded-bl-none'
                }`}>
                  {msg.text}
                  {/* אינדיקטור ווי כפול להודעות שלי */}
                  {isMe && (
                    <div className="flex justify-end mt-1 -mb-1 opacity-70">
                      {msg.is_read ? (
                        <CheckCheck size={14} className="text-blue-600" />
                      ) : (
                        <Check size={14} className="text-black/40" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-white/5 pb-8">
        <form onSubmit={sendMessage} className="max-w-md mx-auto flex items-center gap-3">
          <input
            type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isHe ? 'הקלד הודעה...' : 'Type a message...'}
            className="flex-1 bg-[#111] border border-white/10 rounded-full py-4 px-6 text-sm text-white outline-none focus:border-cyan-500/50 font-bold"
          />
          <button type="submit" disabled={!newMessage.trim() || sending} className="p-4 bg-cyan-400 text-black rounded-full active:scale-90 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
