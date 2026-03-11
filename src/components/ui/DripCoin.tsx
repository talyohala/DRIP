import React from 'react';

export const DripCoin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`relative rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 p-[1px] shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 inline-flex align-middle ${className}`}>
    <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
      <span className="text-white font-black italic tracking-tighter text-[45%] transform -rotate-12 select-none">
        DRIP
      </span>
    </div>
  </div>
);
