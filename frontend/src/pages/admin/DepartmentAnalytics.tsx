import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Building2, Package, CalendarClock, FlaskConical } from 'lucide-react';

interface DeptStat {
  id: string;
  name: string;
  description: string | null;
  service_count: number;
  operation_count: number;
  theatre_count: number;
}

interface AnalyticsResponse {
  by_department: DeptStat[];
  summary: {
    total_departments: number;
    total_services: number;
    total_operations: number;
    total_lab_bookings: number;
  };
}

const COLORS = ['hsl(211,100%,52%)', 'hsl(173,100%,38%)', 'hsl(158,64%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)'];

const DepartmentAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['department-analytics', user?.hospitalId],
    queryFn: () =>
      api<AnalyticsResponse>(
        `/api/department-analytics${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`
      ),
  });

  const depts = data?.by_department ?? [];
  const summary = data?.summary ?? { total_departments: 0, total_services: 0, total_operations: 0, total_lab_bookings: 0 };

  const barData = depts.map((d) => ({
    name: d.name,
    services: d.service_count,
    operations: d.operation_count,
  }));

  const pieData = depts
    .filter((d) => d.service_count + d.operation_count > 0)
    .map((d) => ({ name: d.name, value: d.service_count + d.operation_count }));

  const kpis = [
    { label: 'Departments', value: summary.total_departments, icon: Building2 },
    { label: 'Services', value: summary.total_services, icon: Package },
    { label: 'Operations', value: summary.total_operations, icon: CalendarClock },
    { label: 'Lab Bookings', value: summary.total_lab_bookings, icon: FlaskConical },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader title="Department-wise Analytics" description="Insights by department" gradient />
          <div className="kpi-card p-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Department-wise Analytics" description="Services, operations, and lab activity by department" gradient />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="kpi-card p-6"
          >
            <h3 className="font-semibold mb-4">Services & Operations by Department</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="services" fill={COLORS[0]} name="Services" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="operations" fill={COLORS[1]} name="Operations" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No department data yet
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="kpi-card p-6"
          >
            <h3 className="font-semibold mb-4">Activity Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No distribution data yet
              </div>
            )}
          </motion.div>
        </div>

        <div className="kpi-card p-6">
          <h3 className="font-semibold mb-4">Department Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2">Department</th>
                  <th className="text-right py-3 px-2">Services</th>
                  <th className="text-right py-3 px-2">Operations</th>
                  <th className="text-right py-3 px-2">Theatres</th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.id} className="border-b border-border/30">
                    <td className="py-3 px-2 font-medium">{d.name}</td>
                    <td className="text-right py-3 px-2">{d.service_count}</td>
                    <td className="text-right py-3 px-2">{d.operation_count}</td>
                    <td className="text-right py-3 px-2">{d.theatre_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {depts.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No departments configured. Add departments in Service Catalog or Operation Theatre setup.</p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DepartmentAnalytics;
