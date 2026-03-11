export const DripCoinBadge = ({
  amount,
  className = '',
}: {
  amount?: number | string;
  className?: string;
}) => (
  <div className={`flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1C1C1E] px-2 py-1 ${className}`}>
    {(amount || amount === 0) && <span className="text-sm font-bold tracking-tight text-white">{amount}</span>}
    <span className="text-[9px] font-black uppercase tracking-widest text-[#0A84FF]">DRIPCOIN</span>
  </div>
);

export default DripCoinBadge;
