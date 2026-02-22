import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardService } from '@/services/dashboardService';
import { TrendingUp, CheckCircle, XCircle, IndianRupee, Brain } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';

const CHART_COLORS = ['hsl(211,100%,52%)', 'hsl(173,100%,38%)', 'hsl(158,64%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const Dashboard: React.FC = () => {
  const { data: kpis, isLoading: kpiLoading } = useQuery({ queryKey: ['kpis'], queryFn: dashboardService.getKPIs });
  const { data: claimsDay } = useQuery({ queryKey: ['claimsDay'], queryFn: dashboardService.getClaimsPerDay });
  const { data: revenue } = useQuery({ queryKey: ['revenue'], queryFn: dashboardService.getRevenueTrend });
  const { data: denials } = useQuery({ queryKey: ['denials'], queryFn: dashboardService.getDenialDistribution });
  const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: dashboardService.getClaimsByPayer });

  const kpiCards = kpis ? [
    { label: 'Total Claims', value: kpis.totalClaims, icon: TrendingUp, change: '+12.5%', prefix: '', suffix: '', decimals: 0 },
    { label: 'Approved Claims', value: kpis.approvedClaims, icon: CheckCircle, change: '+8.2%', prefix: '', suffix: '', decimals: 0 },
    { label: 'Denial Rate', value: kpis.denialRate, icon: XCircle, change: '-2.1%', prefix: '', suffix: '%', decimals: 1 },
    { label: 'Revenue Collected', value: kpis.revenueCollected / 1e6, icon: IndianRupee, change: '+15.3%', prefix: '₹', suffix: 'M', decimals: 1 },
    { label: 'AI Accuracy', value: kpis.aiAccuracy, icon: Brain, change: '+1.2%', prefix: '', suffix: '%', decimals: 1, glow: true },
  ] : [];

  const Skeleton = () => (
    <div className="kpi-card animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-4" />
      <div className="h-8 w-16 bg-muted rounded mb-2" />
      <div className="h-3 w-20 bg-muted rounded" />
    </div>
  );

  const tooltipStyle = { borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card) / 0.98)', backdropFilter: 'blur(12px)' };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Healthcare revenue cycle overview" gradient />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiLoading
            ? Array(5).fill(0).map((_, i) => <Skeleton key={i} />)
            : kpiCards.map((card, i) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={<AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={card.decimals} />}
                change={card.change}
                icon={card.icon}
                glow={card.glow}
                index={i}
              />
            ))
          }
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Claims Processed Per Day" index={0}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Claims Processed Per Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={claimsDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="hsl(211,100%,52%)" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue Trend" index={1}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="value" stroke="hsl(173,100%,38%)" fill="hsl(173,100%,38%)" fillOpacity={0.12} strokeWidth={2} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Denial Distribution" index={2}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={denials} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11} animationDuration={1200}>
                  {denials?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Claims by Payer" index={3}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={payers}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                  {payers?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
