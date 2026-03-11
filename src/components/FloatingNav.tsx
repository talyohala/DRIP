import React from 'react';
import { Home, Skull, MessageSquare, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function FloatingNav({ activeTab, setActiveTab }: FloatingNavProps) {
  const navItems = [
    { id: 'floor', icon: Home },
    { id: 'feed', icon: MessageSquare },
    { id: 'mint', icon: Plus, isSpecial: true },
    { id: 'market', icon: Skull },
    { id: 'profile', icon: User }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md" dir="rtl">
      <div className="bg-drip-black/60 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          if (item.isSpecial) {
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className="relative mx-1">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-drip-black shadow-xl active:scale-90 transition-transform">
                  <item.icon size={20} className="text-drip-black" strokeWidth={3} />
                </div>
              </button>
            );
          }

          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className="flex-1 flex flex-col items-center justify-center py-2">
              <div className={`transition-all duration-300 ${isActive ? 'text-drip-cyan scale-110' : 'text-white/20'}`}>
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
