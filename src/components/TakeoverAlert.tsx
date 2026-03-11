import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, X } from 'lucide-react';

interface TakeoverAlertProps {
  data: {
    assetName: string;
    buyer: string;
    amount: number;
  } | null;
  onClose: () => void;
}

export default function TakeoverAlert({ data, onClose }: TakeoverAlertProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-drip-danger/90 backdrop-blur-md flex items-center justify-center p-6 font-sans select-none"
      >
        <motion.div 
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm bg-drip-black border-4 border-white rounded-[40px] p-8 text-center shadow-[0_0_100px_rgba(255,42,95,0.8)] relative overflow-hidden"
        >
          {/* Glitch Effect Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uWUqnW3Ze/giphy.gif')] bg-cover"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-drip-danger rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle size={40} className="text-white" strokeWidth={3} />
            </div>

            <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">Hostile Takeover</h2>
            <p className="text-sm font-bold text-drip-danger uppercase tracking-[0.2em] mb-8">Asset Snatched from your Vault</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-right" dir="rtl">
              <p className="text-[10px] font-black text-white/40 uppercase mb-2">הנכס שאבד:</p>
              <p className="text-xl font-black text-white mb-4">"{data.assetName}"</p>
              <p className="text-[10px] font-black text-white/40 uppercase mb-2">הקונה האגרסיבי:</p>
              <p className="text-lg font-black text-drip-cyan italic">{data.buyer}</p>
            </div>

            <button 
              onClick={onClose}
              className="w-full h-16 bg-white text-drip-black rounded-full font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl"
            >
              <TrendingUp size={20} />
              לך לנקום ב-THE FLOOR
            </button>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/30 hover:text-white"
          >
            <X size={20} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
