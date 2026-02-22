import { KPIData } from '@/types';
import { api } from '@/lib/api';

export const dashboardService = {
  getKPIs: async (): Promise<KPIData> => {
    const data = await api<{ totalClaims: number; approvedClaims: number; denialRate: number; revenueCollected: number; aiAccuracy: number }>('/api/dashboard/kpis');
    return {
      totalClaims: data.totalClaims,
      approvedClaims: data.approvedClaims,
      denialRate: data.denialRate,
      revenueCollected: data.revenueCollected,
      aiAccuracy: data.aiAccuracy,
    };
  },

  getClaimsPerDay: async () => {
    const data = await api<{ name: string; value: number }[]>('/api/dashboard/claims-per-day');
    return data;
  },

  getRevenueTrend: async () => {
    const data = await api<{ name: string; value: number }[]>('/api/dashboard/revenue-trend');
    return data;
  },

  getDenialDistribution: async () => {
    const data = await api<{ name: string; value: number }[]>('/api/dashboard/denial-distribution');
    return data;
  },

  getClaimsByPayer: async () => {
    const data = await api<{ name: string; value: number }[]>('/api/dashboard/claims-by-payer');
    return data;
  },
};
