import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, Users, CheckCircle, Clock, Loader2, Bell, ArrowRight } from 'lucide-react';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import PageTransition from '@/components/layout/PageTransition';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    queryFn: () => api<any[]>('/api/appointments/doctor'),
    enabled: !!user?.id,
  });

  const appointmentDate = (a: any) => a.appointment_date ?? a.appointmentDate ?? '';
  const getPatientName = (a: any) => {
    const p = a.patients ?? a.Patients;
    if (!p) return 'Patient';
    return (p.full_name ?? p.fullName ?? p.name ?? '').trim() || 'Patient';
  };
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => String(appointmentDate(a)).startsWith(today));
  const pendingAppointments = appointments.filter(a => a.status === 'PENDING');
  const pending = pendingAppointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;

  const kpis = [
    { label: "Today's Appointments", value: todayAppts.length, icon: Calendar },
    { label: 'Pending Approval', value: pending, icon: Clock },
    { label: 'Completed', value: completed, icon: CheckCircle },
    { label: 'Total Patients', value: uniquePatients, icon: Users },
  ];

  const statusCls = (s: string) =>
    s === 'APPROVED' ? 'status-approved' : s === 'PENDING' ? 'status-pending' : s === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'status-denied';

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, Dr. {user?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Your appointments overview</p>
        </div>

        {/* Today's Schedule */}
        {todayAppts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="kpi-card border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Today&apos;s Schedule ({todayAppts.length})</h3>
              </div>
              <Link to="/doctor-appointments" className="text-xs text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="space-y-2">
              {todayAppts.slice(0, 4).map((a: any) => (
                <Link key={a.id} to="/doctor-appointments" className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 hover:bg-muted/30 transition-colors block">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {getPatientName(a).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{getPatientName(a)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(appointmentDate(a)).toLocaleTimeString()}{a.reason ? ` — ${a.reason}` : ''}</p>
                    </div>
                  </div>
                  <span className={`status-badge ${statusCls(a.status)}`}>{a.status}</span>
                </Link>
              ))}
              {todayAppts.length > 4 && <p className="text-xs text-muted-foreground pt-1">+{todayAppts.length - 4} more today</p>}
            </div>
          </motion.div>
        )}

        {pending > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="kpi-card border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">New appointment{pending !== 1 ? 's' : ''} available</h3>
                  <p className="text-xs text-muted-foreground">{pending} pending approval — review and approve in Appointments</p>
                </div>
              </div>
              <Link to="/doctor-appointments" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                View appointments <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="mt-3 space-y-1.5">
              {pendingAppointments.slice(0, 3).map(a => (
                <li key={a.id} className="text-sm text-muted-foreground flex justify-between">
                  <span className="font-medium text-foreground">{getPatientName(a)}</span>
                  <span>{new Date(appointmentDate(a)).toLocaleString()}{a.reason ? ` — ${a.reason}` : ''}</span>
                </li>
              ))}
              {pending > 3 && <li className="text-xs text-muted-foreground">+{pending - 3} more</li>}
            </ul>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</span>
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                  <k.icon className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={k.value} /></p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming Appointments</h3>
          <div className="space-y-3">
            {appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'REJECTED').length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
            ) : appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'REJECTED').slice(0, 5).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{getPatientName(a)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(appointmentDate(a)).toLocaleString()} {a.reason ? `— ${a.reason}` : ''}</p>
                </div>
                <span className={`status-badge ${statusCls(a.status)}`}>{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default DoctorDashboard;
