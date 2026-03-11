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
  onBack,
  onClaim,
  backCost,
  canBack,
  canClaim,
}: StakeDeskProps) {
  const dynamicWeight = 500 + Math.round(asset.hypeLevel * 350);
  const hypeState =
    asset.hypeLevel > 0.78 ? 'התלקחות' : asset.hypeLevel > 0.56 ? 'האצה' : asset.hypeLevel > 0.34 ? 'תנועה' : 'שקט';
  const growthPercent = Math.round(((asset.stakePrice - asset.openingPrice) / Math.max(1, asset.openingPrice)) * 100);

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
          מדד הייפ {Math.round(asset.hypeLevel * 100)}% · {hypeState}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">מחיר החזקה</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.stakePrice)} DRIPCOIN
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">מחיר פתיחה</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.openingPrice)} DRIPCOIN
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

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[#E0E0E0]/75 md:grid-cols-4">
        <p>תרומה מייסדת שלך: {formatCoin(myFoundingStake)} DRIPCOIN</p>
        <p>דיבידנד חזוי: {formatCoin(myProjectedDividend)} DRIPCOIN</p>
        <p>משקיעים מייסדים: {asset.foundingBackers}</p>
        <p>עלות גבה: {formatCoin(backCost)} DRIPCOIN</p>
        <p>השתלטויות מצטברות: {asset.totalClaims}</p>
        <p>מחיר השתלטות ממוצע: {formatCoin(asset.averageClaimPrice)} DRIPCOIN</p>
        <p>וויראליות: {asset.viralScore}% · מהירות מעבר: {asset.transferVelocity}%</p>
        <p>שיווקיות: {asset.marketingScore}% · מגמה: {asset.trendScore} · שינוי: {growthPercent}%</p>
        <p className="md:col-span-2">בעלים נוכחי: {asset.currentOwner}</p>
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
