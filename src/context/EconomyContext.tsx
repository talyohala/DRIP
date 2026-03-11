import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { hasSupabaseEnv, supabase } from '../lib/supabase';
import type { FloorAsset } from '../types/game';

type TakeoverStatus = 'success' | 'insufficient_funds' | 'already_owned' | 'unauthenticated' | 'not_found';

interface EconomyContextValue {
  balance: number;
  passiveIncome: number;
  netWorth: number;
  assets: FloorAsset[];
  ownedAssets: FloorAsset[];
  takeoverInFlightId: string | null;
  loadingFloor: boolean;
  attemptTakeover: (assetId: string) => Promise<TakeoverStatus>;
  spend: (amount: number) => boolean;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

const SEED_ASSETS: FloorAsset[] = [
  { id: 'A-101', symbol: 'KRN', name: 'KERNEL BIO', value: 420, incomePerSecond: 3, ownerId: null },
  { id: 'A-102', symbol: 'GLX', name: 'GALAX LOOP', value: 650, incomePerSecond: 5, ownerId: null },
  { id: 'A-103', symbol: 'NTR', name: 'NEOTERRA GRID', value: 960, incomePerSecond: 8, ownerId: null },
  { id: 'A-104', symbol: 'VRK', name: 'VORTEX KINETIC', value: 1300, incomePerSecond: 11, ownerId: null },
  { id: 'A-105', symbol: 'OMN', name: 'OMNI NIGHT', value: 1800, incomePerSecond: 15, ownerId: null },
  { id: 'A-106', symbol: 'QNT', name: 'QUANT CORE', value: 2400, incomePerSecond: 20, ownerId: null },
];

function normalizeAsset(row: Record<string, unknown>, fallback?: FloorAsset): FloorAsset | null {
  const id = String(row.id ?? fallback?.id ?? '');
  if (!id) {
    return null;
  }

  const symbol = String(row.symbol ?? row.ticker ?? fallback?.symbol ?? 'DRP');
  const name = String(row.name ?? fallback?.name ?? 'Unnamed Asset');
  const value = Number(row.value ?? row.valuation ?? fallback?.value ?? 500);
  const incomePerSecond = Number(row.income_per_second ?? row.incomePerSecond ?? fallback?.incomePerSecond ?? 4);
  const ownerIdValue = row.owner_id ?? row.ownerId ?? fallback?.ownerId ?? null;
  const ownerId = ownerIdValue ? String(ownerIdValue) : null;

  return {
    id,
    symbol,
    name,
    value,
    incomePerSecond,
    ownerId,
  };
}

function balanceStorageKey(userId: string | undefined) {
  return userId ? `drip-balance:${userId}` : 'drip-balance:guest';
}

export function EconomyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<FloorAsset[]>(SEED_ASSETS);
  const [balance, setBalance] = useState(1800);
  const [loadingFloor, setLoadingFloor] = useState(true);
  const [takeoverInFlightId, setTakeoverInFlightId] = useState<string | null>(null);

  useEffect(() => {
    const key = balanceStorageKey(user?.id);
    const stored = localStorage.getItem(key);
    if (stored) {
      setBalance(Number(stored));
      return;
    }
    setBalance(1800);
  }, [user?.id]);

  useEffect(() => {
    const key = balanceStorageKey(user?.id);
    localStorage.setItem(key, String(balance));
  }, [balance, user?.id]);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoadingFloor(false);
      return;
    }

    let isMounted = true;
    setLoadingFloor(true);
    supabase
      .from('assets')
      .select('*')
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }
        if (error || !data?.length) {
          setAssets(SEED_ASSETS);
          setLoadingFloor(false);
          return;
        }

        const mapped = data
          .map((entry) => normalizeAsset(entry as Record<string, unknown>))
          .filter((entry): entry is FloorAsset => Boolean(entry));

        setAssets(mapped.length ? mapped : SEED_ASSETS);
        setLoadingFloor(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setAssets(SEED_ASSETS);
        setLoadingFloor(false);
      });

    const channel = supabase
      .channel('drip-floor-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
        setAssets((current) => {
          const eventPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;
          const currentIndex = current.findIndex((asset) => asset.id === String(eventPayload.new?.id ?? eventPayload.old?.id ?? ''));

          if (eventPayload.eventType === 'DELETE') {
            if (currentIndex < 0) {
              return current;
            }
            const copy = [...current];
            copy.splice(currentIndex, 1);
            return copy;
          }

          const normalized = normalizeAsset(eventPayload.new as Record<string, unknown>, current[currentIndex]);
          if (!normalized) {
            return current;
          }

          if (currentIndex < 0) {
            return [...current, normalized];
          }

          const copy = [...current];
          copy[currentIndex] = normalized;
          return copy;
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const ownedAssets = useMemo(
    () => assets.filter((asset) => Boolean(user?.id) && asset.ownerId === user?.id),
    [assets, user?.id],
  );

  const passiveIncome = useMemo(
    () => ownedAssets.reduce((sum, asset) => sum + asset.incomePerSecond, 0),
    [ownedAssets],
  );

  const netWorth = useMemo(
    () => balance + ownedAssets.reduce((sum, asset) => sum + asset.value, 0),
    [balance, ownedAssets],
  );

  useEffect(() => {
    if (!user || passiveIncome <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setBalance((current) => current + passiveIncome);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [passiveIncome, user]);

  const spend = useCallback((amount: number) => {
    if (balance < amount) {
      return false;
    }
    setBalance((current) => current - amount);
    return true;
  }, [balance]);

  const attemptTakeover = useCallback(
    async (assetId: string): Promise<TakeoverStatus> => {
      if (!user) {
        return 'unauthenticated';
      }

      const selected = assets.find((asset) => asset.id === assetId);
      if (!selected) {
        return 'not_found';
      }

      if (selected.ownerId === user.id) {
        return 'already_owned';
      }

      if (balance < selected.value) {
        return 'insufficient_funds';
      }

      setTakeoverInFlightId(assetId);
      await new Promise((resolve) => {
        window.setTimeout(resolve, 900);
      });

      setBalance((current) => current - selected.value);
      setAssets((current) =>
        current.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                ownerId: user.id,
              }
            : asset,
        ),
      );

      if (hasSupabaseEnv) {
        await supabase.from('assets').upsert({
          id: selected.id,
          symbol: selected.symbol,
          name: selected.name,
          value: selected.value,
          income_per_second: selected.incomePerSecond,
          owner_id: user.id,
        });
      }

      setTakeoverInFlightId(null);
      return 'success';
    },
    [assets, balance, user],
  );

  const value = useMemo(
    () => ({
      balance,
      passiveIncome,
      netWorth,
      assets,
      ownedAssets,
      takeoverInFlightId,
      loadingFloor,
      attemptTakeover,
      spend,
    }),
    [assets, attemptTakeover, balance, loadingFloor, netWorth, ownedAssets, passiveIncome, spend, takeoverInFlightId],
  );

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}

export function useEconomy() {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within EconomyProvider');
  }
  return context;
}
