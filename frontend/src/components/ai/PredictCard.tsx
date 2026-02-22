import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Brain, Loader2, Sparkles } from 'lucide-react';

export type PredictVariant = 'claim' | 'invoice' | 'appointment';

interface PredictCardProps {
  variant: PredictVariant;
  score: number; // 1–100 primary metric (acceptance, on-time, attendance)
  secondaryScore?: number;
  insights: string;
  historicalStats?: Record<string, unknown>;
  isLoading?: boolean;
  onPredict?: () => void;
  predictLabel?: string;
}

const VARIANTS = {
  claim: {
    title: 'Claim Acceptance Rate',
    primaryLabel: 'Acceptance',
    secondaryLabel: 'Denial',
    primaryColor: '#10b981',
    secondaryColor: '#ef4444',
  },
  invoice: {
    title: 'On-Time Payment Likelihood',
    primaryLabel: 'On-time',
    secondaryLabel: 'Delay',
    primaryColor: '#10b981',
    secondaryColor: '#f59e0b',
  },
  appointment: {
    title: 'Appointment Attendance',
    primaryLabel: 'Attendance',
    secondaryLabel: 'No-show',
    primaryColor: '#10b981',
    secondaryColor: '#ef4444',
  },
} as const;

export const PredictCard: React.FC<PredictCardProps> = ({
  variant,
  score,
  secondaryScore,
  insights,
  historicalStats,
  isLoading = false,
  onPredict,
  predictLabel = 'Predict',
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const config = VARIANTS[variant];
  const size = 140;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg"
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{config.title}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full border-2 border-primary/30 border-t-primary"
            />
            <p className="text-sm text-muted-foreground">Analyzing with AI…</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  <defs>
                    <linearGradient id={`predict-gauge-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={config.primaryColor} />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={strokeWidth}
                  />
                  <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={`url(#predict-gauge-${variant})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeOffset }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={displayScore}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-bold tabular-nums text-2xl"
                    style={{ color: config.primaryColor }}
                  >
                    {displayScore}%
                  </motion.span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                    {config.primaryLabel}
                  </span>
                </div>
              </div>

              {secondaryScore != null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-4 text-xs"
                >
                  <span className="text-muted-foreground">
                    {config.secondaryLabel}: <strong className="text-foreground">{secondaryScore}%</strong>
                  </span>
                  {historicalStats?.total_claims && (
                    <span className="text-muted-foreground">
                      From {(historicalStats as any).total_claims} past records
                    </span>
                  )}
                  {historicalStats?.total_invoices && (
                    <span className="text-muted-foreground">
                      From {(historicalStats as any).total_invoices} past records
                    </span>
                  )}
                  {historicalStats?.total_appointments && (
                    <span className="text-muted-foreground">
                      From {(historicalStats as any).total_appointments} past records
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {insights && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    AI Insights
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{insights}</p>
              </motion.div>
            )}

            {onPredict && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onPredict}
                disabled={isLoading}
                className="mt-4 w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {predictLabel}
              </motion.button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
