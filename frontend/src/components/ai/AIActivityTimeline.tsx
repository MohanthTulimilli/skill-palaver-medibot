import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, FileText, Calendar, RefreshCw } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'model_eval' | 'risk_update' | 'score_change';
  message: string;
  timestamp: string;
  delta?: number;
  entityType?: 'claim' | 'invoice' | 'appointment';
}

interface AIActivityTimelineProps {
  events: ActivityEvent[];
  maxItems?: number;
}

const ICONS = {
  model_eval: Brain,
  risk_update: RefreshCw,
  score_change: TrendingUp,
};

export const AIActivityTimeline: React.FC<AIActivityTimelineProps> = ({
  events,
  maxItems = 10,
}) => {
  const displayed = events.slice(0, maxItems);

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        AI Activity
      </h4>
      <div className="space-y-0">
        {displayed.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        ) : (
          displayed.map((event, i) => {
            const Icon = ICONS[event.type] || Brain;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground group-hover:text-foreground">{event.message}</p>
                  {event.delta != null && (
                    <span
                      className={`text-xs ${
                        event.delta > 0 ? 'text-destructive' : 'text-emerald-600'
                      }`}
                    >
                      {event.delta > 0 ? '+' : ''}{event.delta}%
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{event.timestamp}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
