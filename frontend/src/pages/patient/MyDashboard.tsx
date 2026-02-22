import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FileText, IndianRupee, Clock, CheckCircle, Stethoscope } from 'lucide-react';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchPatientClaims, fetchPatientInvoices } from '@/services/dataService';
import { Loader2 } from 'lucide-react';

const MyDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['my-claims', user?.id],
    queryFn: () => fetchPatientClaims(user!.id),
    enabled: !!user?.id,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: () => fetchPatientInvoices(user!.id),
    enabled: !!user?.id,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['my-recommendations', user?.id],
    queryFn: () => api<any[]>('/api/doctor-recommendations/patient'),
    enabled: !!user?.id,
  });

  const isLoading = claimsLoading || invoicesLoading;
  const pendingInvoices = invoices.filter(i => i.payment_status !== 'PAID').length;
  const totalPaid = invoices.filter(i => i.payment_status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0);
  const approvedClaims = claims.filter(c => c.status === 'APPROVED').length;

  const kpis = [
    { label: 'My Claims', value: claims.length, icon: FileText },
    { label: 'Pending Invoices', value: pendingInvoices, icon: Clock },
    { label: 'Total Paid', value: totalPaid, icon: IndianRupee, prefix: '₹' },
    { label: 'Approved Claims', value: approvedClaims, icon: CheckCircle },
  ];

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
        <PageHeader title={`Welcome, ${user?.name}`} description="Your health dashboard overview" gradient />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={<AnimatedCounter value={k.value} prefix={k.prefix} />}
              icon={k.icon}
              index={i}
            />
          ))}
        </div>

        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card border-2 border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Doctor Recommended Tests / Surgeries
            </h3>
            <div className="space-y-2">
              {recommendations.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.service_name}</p>
                    <p className="text-xs text-muted-foreground">{r.doctor_name} · {r.service_type?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                      r.status === 'INVOICED' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
                    }`}>{r.status}</span>
                    {r.recommended_price != null && <span className="text-xs text-muted-foreground">₹{r.recommended_price}</span>}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/billing" className="mt-3 block text-sm text-primary font-medium hover:underline">View all & pay bills →</Link>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Claims</h3>
          <div className="space-y-3">
            {claims.length === 0 ? (
              <EmptyState icon={FileText} title="No claims yet" description="Your claims will appear here once submitted." />
            ) : claims.slice(0, 3).map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.insurance_provider} — ₹{c.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.submitted_at).toLocaleDateString()}</p>
                </div>
                {statusBadge(c.status)}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default MyDashboard;
