export type TabKey = 'floor' | 'arsenal' | 'warroom' | 'profile';

export interface FloorAsset {
  id: string;
  symbol: string;
  name: string;
  value: number;
  incomePerSecond: number;
  ownerId: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  tone: 'success' | 'danger' | 'info';
}

export interface Threat {
  id: string;
  title: string;
  level: 'LOW' | 'MED' | 'HIGH';
  description: string;
}
