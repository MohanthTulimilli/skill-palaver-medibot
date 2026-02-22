import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import { getRiskTier, RISK_COLORS, type AIRiskData, type ContributingFactor } from './types';
import { ExplainableAIModal } from './ExplainableAIModal';

interface AIRiskGaugeProps {
  score: number;
  label?: string;
  variant?: 'denial' | 'payment-delay' | 'no-show';
  confidence?: number;
  contributingFactors?: ContributingFactor[];
  explanation?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onExplainClick?: () => void;
}

const VARIANTS = {
  denial: { title: 'Denial Risk', short: 'Denial' },
  'payment-delay': { title: 'Payment Delay Risk', short: 'Delay' },
  'no-show': { title: 'No-Show Risk', short: 'No-Show' },
};

export const AIRiskGauge: React.FC<AIRiskGaugeProps> = ({
  score,
  label,
  variant = 'denial',
  confidence = 0.92,
  contributingFactors = [],
  explanation,
  size = 'md',
  showDetails = true,
}) => {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const tier = getRiskTier(score);
  const colors = RISK_COLORS[tier];
  const sizes = { sm: 64, md: 88, lg: 120 };
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const r = (sizes[size] - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => controls.stop();
  }, [score]);

  const defaultFactors: ContributingFactor[] = contributingFactors.length > 0
    ? contributingFactors
    : getDefaultFactors(variant, score);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="flex items-center gap-3">
          <div className="relative" style={{ width: sizes[size], height: sizes[size] }}>
            <svg width={sizes[size]} height={sizes[size]} className="-rotate-90">
              <defs>
                <linearGradient id={`gauge-${variant}-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.from} />
                  <stop offset="100%" stopColor={colors.to} />
                </linearGradient>
              </defs>
              <circle
                cx={sizes[size] / 2}
                cy={sizes[size] / 2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx={sizes[size] / 2}
                cy={sizes[size] / 2}
                r={r}
                fill="none"
                stroke={`url(#gauge-${variant}-${tier})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="font-bold tabular-nums"
                style={{
                  color: colors.from,
                  fontSize: size === 'sm' ? '0.875rem' : size === 'md' ? '1.125rem' : '1.5rem',
                }}
              >
                {displayScore}%
              </motion.span>
              {confidence > 0 && (
                <span className="text-[10px] text-white/50 mt-0.5">
                  {Math.round(confidence * 100)}% conf
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
              {label || VARIANTS[variant].title}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded-md text-xs font-medium capitalize"
                style={{ background: colors.bg, color: colors.from }}
              >
                {tier} risk
              </span>
            </div>
            {showDetails && defaultFactors.length > 0 && (
              <button
                onClick={() => setShowExplainModal(true)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
              >
                <Brain className="w-3 h-3" /> Explain
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {showExplainModal && (
        <ExplainableAIModal
          title={VARIANTS[variant].title}
          score={score}
          tier={tier}
          contributingFactors={defaultFactors}
          explanation={explanation}
          onClose={() => setShowExplainModal(false)}
        />
      )}
    </>
  );
};

function getDefaultFactors(variant: string, score: number): ContributingFactor[] {
  if (variant === 'denial') {
    return [
      { name: 'Prior denials', impact: 28, direction: score > 50 ? 'increases' : 'decreases' },
      { name: 'Documentation', impact: 22, direction: 'decreases' },
      { name: 'Preauth status', impact: 18, direction: score > 50 ? 'increases' : 'decreases' },
      { name: 'Days to submit', impact: 15, direction: 'increases' },
      { name: 'Coverage ratio', impact: 12, direction: 'decreases' },
    ];
  }
  if (variant === 'payment-delay') {
    return [
      { name: 'Historical delay', impact: 25, direction: 'increases' },
      { name: 'Payer type', impact: 20, direction: 'increases' },
      { name: 'Invoice amount', impact: 18, direction: 'increases' },
      { name: 'Reminder count', impact: -12, direction: 'decreases' },
      { name: 'Previous late payments', impact: 15, direction: 'increases' },
    ];
  }
  return [
    { name: 'Previous no-shows', impact: 30, direction: 'increases' },
    { name: 'Distance to hospital', impact: 20, direction: 'increases' },
    { name: 'SMS reminder', impact: -18, direction: 'decreases' },
    { name: 'Lead time', impact: 12, direction: 'increases' },
    { name: 'Appointment type', impact: 10, direction: 'increases' },
  ];
}
