import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, AlertTriangle, Activity, Brain, Loader2, CalendarDays, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';

interface AILog {
  id: string;
  log_time: string;
  flagged: boolean;
  confidence: number;
  prediction_score: number;
  claim_id: string;
  claims: { claim_number: string; status: string } | null;
}

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

function useAILogs(from: Date | undefined, to: Date | undefined) {
  return useQuery({
    queryKey: ['ai-logs', from?.toISOString(), to?.toISOString()],
    queryFn: async () => {
      const data = await api<AILog[]>('/api/ai-logs');
      let list = data ?? [];
      if (from) list = list.filter(l => new Date(l.log_time) >= startOfDay(from));
      if (to) list = list.filter(l => new Date(l.log_time) <= endOfDay(to));
      return list.slice(0, 200);
    },
    refetchInterval: 10000,
  });
}

function deriveKPIs(logs: AILog[]) {
  if (!logs.length) return { automationRate: 0, avgConfidence: 0, flaggedCount: 0, totalLogs: 0 };
  const flaggedCount = logs.filter(l => l.flagged).length;
  const avgConfidence = logs.reduce((s, l) => s + Number(l.confidence), 0) / logs.length;
  const automationRate = ((logs.length - flaggedCount) / logs.length) * 100;
  return { automationRate, avgConfidence, flaggedCount, totalLogs: logs.length };
}

function botNameFromScore(score: number): string {
  if (score >= 70) return 'RiskAnalyzer';
  if (score >= 40) return 'CodingAssist';
  return 'ClaimBot Alpha';
}

function actionFromLog(log: AILog): string {
  const claim = log.claims?.claim_number ?? log.claim_id.slice(0, 8);
  if (log.flagged) return `Flagged ${claim} for manual review`;
  if (log.prediction_score >= 70) return `High-risk prediction on ${claim}`;
  return `Verified documentation for ${claim}`;
}

function statusFromLog(log: AILog): string {
  if (log.flagged) return 'flagged';
  if (log.prediction_score >= 70) return 'processing';
  return 'completed';
}

const statusClass = (s: string) => s === 'completed' ? 'status-approved' : s === 'processing' ? 'status-pending' : 'status-denied';

const AIMonitoring: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { data: logs = [], isLoading } = useAILogs(dateRange?.from, dateRange?.to);
  const { automationRate, avgConfidence, flaggedCount, totalLogs } = deriveKPIs(logs);

  const applyPreset = (days: number) => {
    if (days === 0) {
      const today = new Date();
      setDateRange({ from: today, to: today });
    } else {
      setDateRange({ from: subDays(new Date(), days), to: new Date() });
    }
  };

  const clearFilter = () => setDateRange(undefined);

  const dateLabel = dateRange?.from
    ? dateRange.to && dateRange.from.toDateString() !== dateRange.to.toDateString()
      ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
      : format(dateRange.from, 'MMM d, yyyy')
    : 'All time';

  const kpis = [
    { label: 'Automation Rate', value: automationRate, icon: Zap },
    { label: 'Avg Confidence', value: avgConfidence, icon: Brain },
    { label: 'Claims Flagged', value: flaggedCount, icon: AlertTriangle, isInt: true },
    { label: 'Total Logs', value: totalLogs, icon: Bot, isInt: true },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-info/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>

        {/* Header + Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Monitoring</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time AI agent activity dashboard</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {PRESETS.map(p => (
              <Button key={p.label} variant="outline" size="sm" className="text-xs h-8"
                onClick={() => applyPreset(p.days)}>
                {p.label}
              </Button>
            ))}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {dateRange && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilter}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }} className="kpi-card ai-glow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                  <k.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : k.isInt
                  ? <AnimatedCounter value={k.value} decimals={0} />
                  : <AnimatedCounter value={k.value} decimals={1} suffix="%" />}
              </p>
              <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full gradient-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, k.value)}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Confidence Meter */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card ai-glow">
          <h3 className="text-sm font-semibold text-foreground mb-4">System Confidence Score</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 animate-float">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gaugeGrad)" strokeWidth="8"
                  strokeDasharray={`${avgConfidence * 2.64} ${264 - avgConfidence * 2.64}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(224,76%,33%)" />
                    <stop offset="100%" stopColor="hsl(199,89%,48%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                  {isLoading ? '—' : <AnimatedCounter value={avgConfidence} decimals={1} suffix="%" />}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {avgConfidence >= 90
                  ? <>The AI system is performing within <span className="text-success font-semibold">optimal range</span>.</>
                  : avgConfidence >= 70
                    ? <>The AI system is performing within <span className="text-warning font-semibold">acceptable range</span>.</>
                    : <>The AI system confidence is <span className="text-destructive font-semibold">below threshold</span>.</>}
              </p>
              <p className="text-muted-foreground">{totalLogs} logs analyzed • {flaggedCount} flagged</p>
            </div>
          </div>
        </motion.div>

        {/* Activity Log Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="table-container">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary animate-pulse-soft" />
            <h3 className="text-sm font-semibold text-foreground">Real-Time Bot Activity</h3>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No AI logs found for the selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Bot</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Claim</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Confidence</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Risk Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => {
                    const status = statusFromLog(log);
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.03 }} className="border-b border-border/60 hover:bg-primary/[0.03] transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          {botNameFromScore(Number(log.prediction_score))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{actionFromLog(log)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.claims?.claim_number ?? log.claim_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{Number(log.confidence).toFixed(0)}%</td>
                        <td className="px-4 py-3 font-bold text-foreground">{Number(log.prediction_score).toFixed(0)}</td>
                        <td className="px-4 py-3"><span className={`status-badge ${statusClass(status)}`}>{status}</span></td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AIMonitoring;
