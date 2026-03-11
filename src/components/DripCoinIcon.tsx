type DripCoinIconProps = {
  className?: string;
};

export const DripCoinIcon = ({ className = '' }: DripCoinIconProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-b from-[#171717] to-[#090909] px-2.5 py-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] ${className}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
    <span className="select-none text-[9px] font-semibold tracking-[0.2em] text-[#E5E7EB]/85">DRIPCOIN</span>
  </span>
);

export default DripCoinIcon;
