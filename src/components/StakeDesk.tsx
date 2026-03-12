import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';

export type AssetDeskModel = {
  id: string;
  title: string;
  creator: string;
  stakePrice: number;
  openingPrice: number;
  viewersLive: number;
  hypeLevel: number;
  foundingPool: number;
  foundingBackers: number;
  totalClaims: number;
  averageClaimPrice: number;
  viralScore: number;
  transferVelocity: number;
  marketingScore: number;
  currentOwner: string;
  trendScore: number;
};

type StakeDeskProps = {
  asset: AssetDeskModel;
  wallet: number;
  myFoundingStake: number;
  myProjectedDividend: number;
  onBack: () => void;
  onClaim: () => void;
  backCost: number;
  canBack: boolean;
  canClaim: boolean;
};

const formatCoin = (value: number): string =>
  Math.max(0, value).toLocaleString('he-IL', {
    maximumFractionDigits: 0,
  });

export default function StakeDesk({
  asset,
  wallet,
  myFoundingStake,
  myProjectedDividend,
  onClaim,
  canClaim,
}: StakeDeskProps) {
  const dynamicWeight = 500 + Math.round(asset.hypeLevel * 350);
  const hypeState = asset.hypeLevel > 0.78 ? 'התלקחות' : asset.hypeLevel > 0.56 ? 'האצה' : 'תנועה';
  const hypePercent = Math.round(asset.hypeLevel * 100);
  const ownerGlyph = asset.currentOwner.trim().charAt(0) || '•';

  return (
    <motion.section
      className="holo-panel pointer-events-auto w-full rounded-[28px] px-3 py-3 text-right md:px-5 md:py-4"
      initial={{ opacity: 0, y: 34, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 22, mass: 0.85 }}
      style={
        {
          '--wght': dynamicWeight,
        } as CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/20 text-sm font-semibold text-[#E0E0E0]">
            {ownerGlyph}
          </div>
          <div className="min-w-0">
            <p className="kinetic-text truncate text-base font-semibold leading-tight text-white">{asset.currentOwner}</p>
            <p className="truncate text-xs text-[#E0E0E0]/70">
              {asset.title} · {asset.creator}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[11px] text-[#CCFF00]">
                Hype {hypePercent}% · {hypeState}
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full border border-white/10 bg-black/20">
                <div className="h-full bg-[#CCFF00]/75" style={{ width: `${hypePercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-[#E0E0E0]/55">מחיר השתלטות</p>
            <p className="biolume-number text-sm font-semibold text-[#FF007F]">{formatCoin(asset.stakePrice)} DRIPCOIN</p>
            <p className="text-[11px] text-[#E0E0E0]/55">יתרה {formatCoin(wallet)} DRIPCOIN</p>
          </div>
          <motion.button
            type="button"
            onClick={onClaim}
            disabled={!canClaim}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="rounded-2xl border border-[#CCFF00]/45 bg-[#CCFF00]/18 px-4 py-3 text-sm font-semibold text-[#E8FF9A] disabled:cursor-not-allowed disabled:opacity-45"
          >
            תבע (Claim)
          </motion.button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#E0E0E0]/68">
        <p>תרומה מייסדת: {formatCoin(myFoundingStake)}</p>
        <p>דיבידנד חזוי: {formatCoin(myProjectedDividend)}</p>
        <p>תביעות: {asset.totalClaims}</p>
        <p>צופים: {formatCoin(asset.viewersLive)}</p>
      </div>
    </motion.section>
  );
}
