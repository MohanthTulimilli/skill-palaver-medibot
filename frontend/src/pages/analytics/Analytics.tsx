import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageHeader from '@/components/ui/PageHeader';
import ChartCard from '@/components/ui/ChartCard';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { IndianRupee, ShieldAlert, Target, BarChart3, TrendingUp } from 'lucide-react';
import { aiPerformance } from '@/services/mockData';

interface AnalyticsData {
  summary: {
    totalClaims: number;
    approvedClaims: number;
    deniedClaims: number;
    pendingClaims: number;
    totalRevenue: number;
    denialRate: number;
    avgRiskScore: number;
    totalBilled: number;
    totalCollected: number;
    collectionRate: number;
  };
  claimsByPayer: { name: string; value: number }[];
  monthlyTrend: { month: string; total: number; approved: number; denied: number; revenue: number }[];
  riskDistribution: { name: string; value: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const [kpis, claimsByPayer, revenueTrend, denialDist] = await Promise.all([
    dashboardService.getKPIs(),
    dashboardService.getClaimsByPayer(),
    dashboardService.getRevenueTrend(),
    dashboardService.getDenialDistribution(),
  ]);
  const totalClaims = kpis.totalClaims;
  const approved = kpis.approvedClaims;
  const denied = totalClaims > 0 ? Math.round(totalClaims * (kpis.denialRate / 100)) : 0;
  const pending = Math.max(0, totalClaims - approved - denied);
  const totalCollected = kpis.revenueCollected;
  return {
    summary: {
      totalClaims,
      approvedClaims: approved,
      deniedClaims: denied,
      pendingClaims: pending,
      totalRevenue: totalCollected,
      denialRate: kpis.denialRate,
      avgRiskScore: 0,
      totalBilled: totalCollected,
      totalCollected,
      collectionRate: totalClaims > 0 ? Math.round((totalCollected / (totalClaims * 100)) * 100) : 0,
    },
    claimsByPayer: claimsByPayer.map((c: any) => ({ name: c.name, value: Number(c.value) })),
    monthlyTrend: revenueTrend.map((r: any) => ({ month: r.name, total: Number(r.value), approved: 0, denied: 0, revenue: Number(r.value) })),
    riskDistribution: denialDist.map((d: any) => ({ name: d.name, value: Number(d.value) })),
  };
}

const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card) / 0.98)', backdropFilter: 'blur(12px)' };
const CHART_COLORS = ['hsl(211,100%,52%)', 'hsl(173,100%,38%)', 'hsl(158,64%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const Analytics: React.FC = () => {
  const [chartRange, setChartRange] = useState<'Today' | 'Weekly' | 'Monthly'>('Monthly');
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  const s = analytics?.summary;
  const hasData = s && s.totalClaims > 0;

  const kpis = [
    { label: 'Total Revenue', value: s?.totalRevenue || 0, prefix: '₹', suffix: '', icon: IndianRupee, valueColor: 'success' as const },
    { label: 'Denial Rate', value: s?.denialRate || 0, suffix: '%', icon: ShieldAlert, valueColor: 'destructive' as const, decimals: 1 },
    { label: 'Collection Rate', value: s?.collectionRate || 0, suffix: '%', icon: Target, valueColor: 'default' as const, decimals: 1 },
    { label: 'Avg Risk Score', value: s?.avgRiskScore || 0, icon: BarChart3, valueColor: 'warning' as const, decimals: 1 },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader title="Analytics" description="Revenue, denials, and AI performance insights" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="kpi-card animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-20 bg-muted rounded mb-2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="kpi-card h-80 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-4" />
                <div className="h-full bg-muted/50 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Revenue, denials, and AI performance insights" gradient />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={<AnimatedCounter value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.decimals} />}
              icon={k.icon}
              index={i}
              valueColor={k.valueColor}
            />
          ))}
        </div>

        {/* Claims Summary Bar */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="kpi-card"
          >
            <h3 className="text-sm font-semibold text-foreground font-heading mb-4">Claims Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                <p className="text-2xl font-bold text-success font-heading"><AnimatedCounter value={s!.approvedClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Approved</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
                <p className="text-2xl font-bold text-warning font-heading"><AnimatedCounter value={s!.pendingClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-2xl font-bold text-destructive font-heading"><AnimatedCounter value={s!.deniedClaims} /></p>
                <p className="text-xs text-muted-foreground mt-1">Denied</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <ChartCard title="Monthly Claims & Revenue" index={0} filter={
            <div className="flex gap-1">
              {(['Today', 'Weekly', 'Monthly'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    chartRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          }>
            {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(211,100%,52%)" fill="hsl(211,100%,52%)" fillOpacity={0.12} strokeWidth={2} name="Revenue" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="No revenue data yet" description="Monthly trends will appear once claims are processed." />
            )}
          </ChartCard>

          {/* Claims by Payer */}
          <ChartCard title="Claims by Payer" index={1}>
            {analytics?.claimsByPayer && analytics.claimsByPayer.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.claimsByPayer}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Claims" animationDuration={1200}>
                    {analytics.claimsByPayer.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No payer data yet" description="Claims by payer will appear once data is available." />
            )}
          </ChartCard>

          {/* Risk Distribution */}
          <ChartCard title="AI Risk Distribution" index={2}>
            {analytics?.riskDistribution && analytics.riskDistribution.some(r => r.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={analytics.riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" animationDuration={1200}>
                    {analytics.riskDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={ShieldAlert} title="No risk data yet" description="AI risk distribution will appear as claims are analyzed." />
            )}
          </ChartCard>

          {/* AI Performance */}
          <ChartCard title="AI Model Performance" index={3} aiGlow>
            <div className="relative">
              <div className="absolute -top-2 right-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-medium text-success">Live</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={aiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[60, 100]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(211,100%,52%)" strokeWidth={2.5} name="Accuracy %" animationDuration={1500} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="automation" stroke="hsl(173,100%,38%)" strokeWidth={2.5} name="Automation %" animationDuration={1500} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;
