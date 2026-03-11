import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Send, MessageSquare, Zap, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  content: string;
  type: 'user' | 'system';
  created_at: string;
}

export default function GlobalFeed() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('global_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drip_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('drip_messages')
      .select('*, drip_users(username, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) {
      setMessages(data.map((m: any) => ({
        ...m,
        username: m.drip_users?.username || 'System',
        avatar_url: m.drip_users?.avatar_url
      })));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase.from('drip_messages').insert({
        user_id: session.user.id,
        content: newMessage.trim(),
        type: 'user'
      });
      if (error) toast.error("Silence! Message failed.");
      else setNewMessage('');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-drip-black text-white flex flex-col font-sans overflow-hidden pb-24" dir="rtl">
      
      {/* Header */}
      <div className="p-6 bg-drip-black/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-drip-cyan/10 flex items-center justify-center text-drip-cyan">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-widest italic">WAR ROOM</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Global Trash Talk</p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col ${msg.type === 'system' ? 'items-center' : 'items-start'}`}
          >
            {msg.type === 'system' ? (
              <div className="bg-drip-danger/10 border border-drip-danger/20 px-4 py-2 rounded-full flex items-center gap-2">
                <Target size={12} className="text-drip-danger" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest italic">{msg.content}</span>
              </div>
            ) : (
              <div className="flex gap-3 max-w-[85%]">
                <img src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} className="w-8 h-8 rounded-full border border-white/10" alt="Avatar" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-drip-cyan uppercase">{msg.username}</p>
                  <div className="bg-drip-velvet border border-white/5 px-4 py-3 rounded-2xl rounded-tr-none">
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-drip-black/90 backdrop-blur-2xl border-t border-white/5 flex gap-3 items-center">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your trash talk..." 
          className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-drip-cyan/30 transition-all"
        />
        <button 
          disabled={loading}
          className="w-14 h-14 bg-white text-drip-black rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg disabled:opacity-50"
        >
          <Send size={20} strokeWidth={3} />
        </button>
      </form>

    </div>
  );
}
