import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  collapsed: boolean;
  onToggleCollapse: () => void;
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
  collapsed,
  onToggleCollapse,
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
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-xl border border-white/15 bg-black/20 p-1.5 text-[#E0E0E0]"
            aria-label={collapsed ? 'פתח לוח נתונים' : 'כווץ לוח נתונים'}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <p className="kinetic-text text-base font-semibold leading-tight text-white">{asset.title}</p>
        </div>
        <div className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-[#CCFF00]">
          הייפ {Math.round(asset.hypeLevel * 100)}%
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">מחיר</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(asset.stakePrice)} DRIPCOIN
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">צופים</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">{formatCoin(asset.viewersLive)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <p className="text-[#E0E0E0]/55">יתרה</p>
          <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
            {formatCoin(wallet)} DRIPCOIN
          </p>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[#E0E0E0]/55">מחיר פתיחה</p>
              <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
                {formatCoin(asset.openingPrice)} DRIPCOIN
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[#E0E0E0]/55">בריכה</p>
              <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
                {formatCoin(asset.foundingPool)} DRIPCOIN
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[#E0E0E0]/55">השתלטויות</p>
              <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">{asset.totalClaims}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[#E0E0E0]/55">ממוצע</p>
              <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">
                {formatCoin(asset.averageClaimPrice)} DRIPCOIN
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
              <p className="text-[#E0E0E0]/55">שינוי</p>
              <p className="biolume-number mt-1 text-sm font-semibold text-[#E0E0E0]">{growthPercent}%</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[#E0E0E0]/75 md:grid-cols-4">
            <p>בעלים {asset.currentOwner}</p>
            <p>מצב {hypeState}</p>
            <p>ויראליות {asset.viralScore}%</p>
            <p>מהירות {asset.transferVelocity}%</p>
            <p>שיווקיות {asset.marketingScore}%</p>
            <p>תרומה {formatCoin(myFoundingStake)} DRIPCOIN</p>
            <p>דיבידנד {formatCoin(myProjectedDividend)} DRIPCOIN</p>
            <p>עלות גבה {formatCoin(backCost)} DRIPCOIN</p>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/20 px-4 py-3 text-sm font-semibold text-[#FFD3EA] disabled:cursor-not-allowed disabled:opacity-45"
        >
          גבה
        </motion.button>
        <motion.button
          type="button"
          onClick={onClaim}
          disabled={!canClaim}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="rounded-2xl border border-[#CCFF00]/45 bg-[#CCFF00]/18 px-4 py-3 text-sm font-semibold text-[#E8FF9A] disabled:cursor-not-allowed disabled:opacity-45"
        >
          תבע
        </motion.button>
      </div>
    </motion.section>
  );
}
