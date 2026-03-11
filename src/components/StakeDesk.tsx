import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';

export type AssetDeskModel = {
  id: string;
  title: string;
  creator: string;
  stakePrice: number;
  viewersLive: number;
  hypeLevel: number;
  foundingPool: number;
  foundingBackers: number;
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
  onBack,
  onClaim,
  backCost,
  canBack,
  canClaim,
}: StakeDeskProps) {
  const dynamicWeight = 500 + Math.round(asset.hypeLevel * 350);

  return (
    <motion.section
      className="holo-panel pointer-events-auto w-full rounded-[28px] p-4 text-right md:p-5"
      initial={{ opacity: 0, y: 34, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 22, mass: 0.85 }}
      style={
        {
          '--wght': dynamicWeight,
        } as CSSProperties
      }
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="kinetic-text text-lg font-semibold leading-tight text-white">{asset.title}</p>
          <p className="mt-1 text-xs text-[#E0E0E0]/70">יוצר: {asset.creator}</p>
        </div>
        <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#CCFF00]">
          מהירות ויראלית {Math.round(asset.hypeLevel * 100)}%
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">מחיר החזקה</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.stakePrice)} DRIPCOIN
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">יתרה</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">{formatCoin(wallet)} DRIPCOIN</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">בריכת דיבידנד</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.foundingPool)} DRIPCOIN
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">צופים חיים</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.viewersLive)}
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[#E0E0E0]/75">
        <p>תרומה מייסדת שלך: {formatCoin(myFoundingStake)} DRIPCOIN</p>
        <p>דיבידנד חזוי: {formatCoin(myProjectedDividend)} DRIPCOIN</p>
        <p>משקיעים מייסדים: {asset.foundingBackers}</p>
        <p>עלות גבה: {formatCoin(backCost)} DRIPCOIN</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/20 px-4 py-3 text-sm font-semibold text-[#FFD3EA] disabled:cursor-not-allowed disabled:opacity-45"
        >
          גבה (Back)
        </motion.button>
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
    </motion.section>
  );
}
