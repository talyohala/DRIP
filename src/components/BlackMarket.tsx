import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import { Ghost, Shield, Zap, Droplet, Skull, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RelicItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  color: string;
}

const RELICS: RelicItem[] = [
  { id: 'ghost', name: 'GHOST PROTOCOL', description: 'בצע השתלטות מבלי להופיע בפיד או ביומן העסקאות של המטרה.', price: 25000, icon: Ghost, color: '#00F0FF' },
  { id: 'shield', name: 'TITAN SHIELD', description: 'נעל את הנכס שלך ל-24 שעות. אף אחד לא יכול לחטוף אותו.', price: 50000, icon: Shield, color: '#FFFFFF' },
  { id: 'booster', name: 'HYPER DRIVE', description: 'כל דקה שהנכס בבעלותך, הוא מייצר פי 2 יותר Dripcoins.', price: 15000, icon: Zap, color: '#FF2A5F' }
];

export default function BlackMarket() {
  const [balance, setBalance] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('drip_users').select('drip_coins').eq('id', session.user.id).single();
      if (data) setBalance(data.drip_coins);
    }
  };

  const buyRelic = async (relic: RelicItem) => {
    if (balance < relic.price) return toast.error("LOW BALANCE");
    
    setLoadingId(relic.id);
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const { error } = await supabase.rpc('purchase_relic', {
        user_id_param: session?.user.id,
        relic_type_param: relic.id,
        price_param: relic.price
      });

      if (error) throw error;

      toast.success(`${relic.name} ACQUIRED`, {
        style: { background: '#020202', color: relic.color, border: `1px solid ${relic.color}` }
      });
      fetchBalance();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-drip-black text-white overflow-y-auto font-sans hide-scrollbar pb-32" dir="rtl">
      
      {/* Header */}
      <div className="p-8 flex justify-between items-center sticky top-0 bg-drip-black/90 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-3">
          <Skull size={24} className="text-white/20" />
          <h1 className="text-2xl font-black tracking-tighter italic">BLACK MARKET</h1>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Droplet size={14} className="text-drip-cyan fill-drip-cyan" />
          <span className="font-black text-sm">{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] text-center mb-10">Forbidden Technology & Social Relics</p>

        {RELICS.map((relic) => (
          <motion.div 
            key={relic.id}
            whileTap={{ scale: 0.98 }}
            className="bg-drip-velvet border border-white/5 rounded-[32px] p-6 relative overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-drip-cyan/5 transition-colors"></div>

            <div className="flex items-start gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-drip-black border border-white/10 flex items-center justify-center shrink-0">
                <relic.icon size={28} style={{ color: relic.color }} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black tracking-wide mb-1 italic">{relic.name}</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium mb-6">{relic.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black">{relic.price.toLocaleString()}</span>
                    <Droplet size={14} className="text-drip-cyan fill-drip-cyan" />
                  </div>
                  
                  <button 
                    onClick={() => buyRelic(relic)}
                    disabled={loadingId === relic.id}
                    className="bg-white text-drip-black px-6 py-2.5 rounded-xl font-black text-xs active:scale-90 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loadingId === relic.id ? <Loader2 size={16} className="animate-spin" /> : 'ACQUIRE'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
