import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery } from '@tanstack/react-query';
import { fetchPatientClaims, fetchMlClaimsStats, predictClaimWithInsights, DbClaim } from '@/services/dataService';
import { Loader2, Brain } from 'lucide-react';
import { useRealtimeClaims } from '@/hooks/useRealtimeClaims';
import { PredictCard } from '@/components/ai';

const MyClaims: React.FC = () => {
  const { user } = useAuth();
  const realtimeKeys = useMemo(() => [['my-claims', user?.id ?? '']], [user?.id]);
  useRealtimeClaims(realtimeKeys);
  const [claimAmount, setClaimAmount] = useState('');
  const [prediction, setPrediction] = useState<{
    score: number;
    secondaryScore: number;
    insights: string;
    historicalStats?: Record<string, unknown>;
  } | null>(null);
  const [predicting, setPredicting] = useState(false);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['my-claims', user?.id],
    queryFn: () => fetchPatientClaims(user!.id),
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['ml-claims-stats'],
    queryFn: fetchMlClaimsStats,
  });

  const handlePredict = async () => {
    const amount = parseFloat(claimAmount);
    if (!amount || amount <= 0) return;
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await predictClaimWithInsights({ amount });
      const acceptancePct = res.acceptance_rate_pct ?? (res.prediction === 1 ? (1 - res.probability) * 100 : res.probability * 100);
      const denialPct = res.denial_rate_pct ?? (100 - acceptancePct);
      setPrediction({
        score: Math.round(acceptancePct),
        secondaryScore: Math.round(denialPct),
        insights: res.insights || 'Unable to load insights.',
        historicalStats: res.historical_stats,
      });
    } catch {
      setPrediction({
        score: 50,
        secondaryScore: 50,
        insights: 'Prediction unavailable. Please try again later.',
        historicalStats: stats,
      });
    } finally {
      setPredicting(false);
    }
  };

  const statusBadge = (status: string) => {
    const cls = status === 'APPROVED' ? 'status-approved' : status === 'PENDING' ? 'status-pending' : 'status-denied';
    return <span className={`status-badge ${cls}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
  };

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Claims</h1>
          <p className="text-muted-foreground text-sm mt-1">View your submitted insurance claims</p>
        </div>

        {/* Claim Predictor - AI-powered acceptance/denial rate */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="kpi-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Claim Predictor</h3>
                <p className="text-xs text-muted-foreground">
                  {stats ? `From ${stats.total_claims ?? 400} past claims · ${((stats.acceptance_rate ?? 0.75) * 100).toFixed(0)}% historical acceptance` : 'Check acceptance likelihood before applying'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={claimAmount}
                onChange={e => setClaimAmount(e.target.value)}
                placeholder="Claim amount (₹)"
                min="1"
                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                onClick={handlePredict}
                disabled={!claimAmount || predicting || parseFloat(claimAmount) <= 0}
                className="px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Predict
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {prediction ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="lg:col-span-1"
              >
                <PredictCard
                  variant="claim"
                  score={prediction.score}
                  secondaryScore={prediction.secondaryScore}
                  insights={prediction.insights}
                  historicalStats={prediction.historicalStats}
                />
              </motion.div>
            ) : (
              stats && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="kpi-card rounded-2xl p-5 flex flex-col justify-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Enter a claim amount and click <strong className="text-foreground">Predict</strong> to see AI-powered acceptance and denial rates based on {stats.total_claims ?? 400} past claims.
                  </p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>AI Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No claims found</td></tr>
                ) : claims.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3 font-mono text-xs">{c.claim_number}</td>
                    <td className="px-4 py-3 text-foreground">{c.insurance_provider}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">₹{c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.submitted_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold">{c.ai_risk_score !== null ? `${c.ai_risk_score}%` : '—'}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MyClaims;
