/**
 * AI Risk Component Types
 * Shared types for all AI-powered UI components
 */

export type RiskTier = 'low' | 'medium' | 'high';

export function getRiskTier(score: number): RiskTier {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export const RISK_COLORS = {
  low: { from: '#10b981', to: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
  medium: { from: '#f59e0b', to: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
  high: { from: '#ef4444', to: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
} as const;

export interface ContributingFactor {
  name: string;
  impact: number; // 0-100
  direction: 'increases' | 'decreases';
  description?: string;
}

export interface AIRiskData {
  score: number; // 0-100
  confidence?: number; // 0-1
  trend?: 'up' | 'down' | 'stable';
  trendDelta?: number;
  contributingFactors?: ContributingFactor[];
  explanation?: string;
  lastUpdated?: string;
}
