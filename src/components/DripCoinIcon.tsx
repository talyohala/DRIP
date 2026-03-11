import React from 'react';

export const DripCoinIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z"
      fill="currentColor"
      className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,113,0.8)]"
    />
    <circle cx="12" cy="12" r="4" fill="#050505" />
    <path d="M12 9V15M9 12H15" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
  </svg>
);
