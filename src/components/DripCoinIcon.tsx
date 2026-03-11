import { DripCoinBadge } from './DripCoinBadge';

type DripCoinIconProps = {
  className?: string;
};

export const DripCoinIcon = ({ className = '' }: DripCoinIconProps) => <DripCoinBadge className={className} />;

export default DripCoinIcon;
