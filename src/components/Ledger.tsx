import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, ArrowDownLeft, Zap, Target, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'takeover' | 'sold' | 'mint' | 'relic';
  targetUser: string;
  amount: number;
  assetName: string;
  timestamp: string;
}

const MOCK_HISTORY: Transaction[] = [
  { id: '1', type: 'takeover', targetUser: 'Noa_K', amount: -45000, assetName: 'Cyber Elegance', timestamp: '2m ago' },
  { id: '2', type: 'sold', targetUser: 'Dan_B', amount: 82000, assetName: 'Neon Nights', timestamp: '15m ago' },
  { id: '3', type: 'relic', targetUser: 'System', amount: -150000, assetName: 'The Phantom', timestamp: '1h ago' },
  { id: '4', type: 'mint', targetUser: 'Market', amount: -500, assetName: 'Urban Minimal', timestamp: '4h ago' },
];

export default function Ledger() {
  return (
    <div className="fixed inset-0 bg-drip-black text-white overflow-y-auto font-sans hide-scrollbar pb-32" dir="rtl">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-drip-black/80 backdrop-blur-xl z-50 border-b border-white/5">
        <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
          <Activity size={20} className="text-drip-danger" />
          THE LEDGER
        </h1>
        <div className="text-[10px] font-black text-white/30 tracking-widest uppercase bg-white/5 px-3 py-1 rounded-md">
          Live Sync Active
        </div>
      </div>

      <div className="p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-drip-velvet border border-white/5 p-5 rounded-3xl">
            <div className="flex items-center gap-2 text-white/40 mb-2">
              <ArrowUpRight size={14} className="text-drip-cyan" />
              <span className="text-[10px] font-black uppercase">הכנסות</span>
            </div>
            <p className="text-2xl font-black">+124k</p>
          </div>
          <div className="bg-drip-velvet border border-white/5 p-5 rounded-3xl">
            <div className="flex items-center gap-2 text-white/40 mb-2">
              <ArrowDownLeft size={14} className="text-drip-danger" />
              <span className="text-[10px] font-black uppercase">הוצאות</span>
            </div>
            <p className="text-2xl font-black">-195k</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] mb-4">Recent Activity</h2>
          
          {MOCK_HISTORY.map((tx, idx) => (
            <motion.div 
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-drip-velvet border border-drip-glassBorder rounded-2xl p-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-105 ${
                  tx.amount > 0 ? 'bg-drip-cyan/10 border-drip-cyan/20 text-drip-cyan' : 'bg-drip-danger/10 border-drip-danger/20 text-drip-danger'
                }`}>
                  {tx.type === 'takeover' && <Target size={20} />}
                  {tx.type === 'sold' && <TrendingUp size={20} />}
                  {tx.type === 'relic' && <Zap size={20} />}
                  {tx.type === 'mint' && <Activity size={20} />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      {tx.type === 'takeover' && 'השתלטות על נכס'}
                      {tx.type === 'sold' && 'נכס נמכר'}
                      {tx.type === 'relic' && 'רכישת כוח'}
                      {tx.type === 'mint' && 'הנפקת דרופ'}
                    </span>
                    <span className="text-[10px] text-white/30 font-bold">{tx.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/50 font-medium">
                    {tx.targetUser !== 'System' && tx.targetUser !== 'Market' ? `מול @${tx.targetUser}` : tx.assetName}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-sm font-black ${tx.amount > 0 ? 'text-drip-cyan' : 'text-white'}`}>
                  {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                </p>
                <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">Dripcoins</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
