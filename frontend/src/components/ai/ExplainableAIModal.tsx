import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, Lightbulb } from 'lucide-react';
import { RISK_COLORS, type ContributingFactor, type RiskTier } from './types';

interface ExplainableAIModalProps {
  title: string;
  score: number;
  tier: RiskTier;
  contributingFactors: ContributingFactor[];
  explanation?: string;
  suggestedAction?: string;
  onClose: () => void;
}

export const ExplainableAIModal: React.FC<ExplainableAIModalProps> = ({
  title,
  score,
  tier,
  contributingFactors,
  explanation,
  suggestedAction,
  onClose,
}) => {
  const colors = RISK_COLORS[tier];

  const suggestedActions: Record<RiskTier, string> = {
    low: 'No immediate action required. Monitor for changes.',
    medium: 'Review documentation and consider pre-authorization if applicable.',
    high: suggestedAction || 'Prioritize review. Verify documentation completeness and consider resubmission with corrections.',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Explainable AI — {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="px-3 py-1.5 rounded-lg font-bold text-lg"
                style={{ background: colors.bg, color: colors.from }}
              >
                {score}% Risk
              </div>
              <span className="text-sm text-white/50 capitalize">{tier} risk tier</span>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div>
              <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Top Contributing Factors
              </h4>
              <div className="space-y-2">
                {contributingFactors.slice(0, 5).map((f, i) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                  >
                    <span className="text-sm text-white/90">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: f.direction === 'increases' ? colors.from : '#10b981',
                            width: `${Math.min(Math.abs(f.impact), 100)}%`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(Math.abs(f.impact), 100)}%` }}
                          transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-white/50 w-8">
                        {f.direction === 'increases' ? '+' : ''}{f.impact}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {explanation && (
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">AI Explanation</h4>
                <p className="text-sm text-white/60 leading-relaxed">{explanation}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Suggested Action
              </h4>
              <p className="text-sm text-white/70 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                {suggestedActions[tier]}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
