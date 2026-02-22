import React from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, TrendingUp, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { getRiskTier, RISK_COLORS } from './types';

interface HighRiskItem {
  id: string;
  type: 'claim' | 'invoice' | 'appointment';
  label: string;
  amount?: number;
  riskScore: number;
}

interface AIInsightsSidebarProps {
  highRiskClaims?: HighRiskItem[];
  highRiskInvoices?: HighRiskItem[];
  estimatedImpact?: number;
  weeklySummary?: { claimsReviewed: number; invoicesAtRisk: number; apptsNoShow: number };
  onItemClick?: (item: HighRiskItem) => void;
}

export const AIInsightsSidebar: React.FC<AIInsightsSidebarProps> = ({
  highRiskClaims = [],
  highRiskInvoices = [],
  estimatedImpact = 0,
  weeklySummary,
  onItemClick,
}) => {
  const highRiskItems = [...highRiskClaims, ...highRiskInvoices]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 flex-shrink-0 rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
    >
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Insights
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {estimatedImpact > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Est. Financial Impact</span>
            </div>
            <p className="text-xl font-bold text-amber-700">₹{estimatedImpact.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">At-risk revenue this week</p>
          </motion.div>
        )}

        {weeklySummary && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Weekly AI Summary
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-foreground">{weeklySummary.claimsReviewed}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Claims</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-foreground">{weeklySummary.invoicesAtRisk}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">At Risk</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-foreground">{weeklySummary.apptsNoShow}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">No-Show</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            High-Risk Items
          </h4>
          {highRiskItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No high-risk items</p>
          ) : (
            <div className="space-y-2">
              {highRiskItems.map((item, i) => {
                const tier = getRiskTier(item.riskScore);
                const colors = RISK_COLORS[tier];
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onItemClick?.(item)}
                    className="w-full p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-border/60 text-left flex items-center justify-between group transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: colors.bg, color: colors.from }}
                        >
                          {item.riskScore}%
                        </span>
                        {item.amount != null && (
                          <span className="text-xs text-muted-foreground">
                            ₹{item.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
