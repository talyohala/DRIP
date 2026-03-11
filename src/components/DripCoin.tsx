type DripCoinIconProps = {
  className?: string;
};

export const DripCoinIcon = ({ className = 'w-auto h-5' }: DripCoinIconProps) => (
  <div
    className={`relative inline-flex items-center justify-center rounded-full border border-cyan-300/50 bg-gradient-to-r from-cyan-400 to-blue-600 px-2 py-0.5 shadow-[0_0_12px_rgba(34,211,238,0.5)] ${className}`}
  >
    <span className="select-none text-[10px] font-black uppercase italic tracking-widest text-black drop-shadow-md">
      DRIPCOIN
    </span>
  </div>
);
