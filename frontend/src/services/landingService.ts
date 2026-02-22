import { API_BASE } from '@/lib/api';

export interface LandingStats {
  totalClaims: number;
  denialRate: number;
  revenueCollected: number;
  aiAccuracy: number;
  claimsTrend: number[];
}

export const landingService = {
  getStats: async (): Promise<LandingStats> => {
    const res = await fetch(`${API_BASE}/api/landing/stats`);
    if (!res.ok) throw new Error('Failed to fetch landing stats');
    return res.json();
  },
};
