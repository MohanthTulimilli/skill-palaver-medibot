import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, FileText, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import { api } from '@/lib/api';

const HospitalAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ staff: 0, patients: 0, claims: 0, appointments: 0 });

  useEffect(() => {
    const load = async () => {
      if (!user?.hospitalId) return;
      const [profiles, patients, claims, appointments] = await Promise.all([
        api<{ id: string; hospital_id?: string }[]>('/api/profiles'),
        api<{ id: string; hospital_id?: string }[]>('/api/patients'),
        api<{ id: string; hospital_id?: string }[]>('/api/claims'),
        api<{ id: string; hospital_id?: string }[]>('/api/appointments'),
      ]);
      const hid = user.hospitalId;
      setStats({
        staff: profiles.filter((p: any) => p.hospital_id === hid).length,
        patients: patients.filter((p: any) => p.hospital_id === hid).length,
        claims: claims.filter((c: any) => c.hospital_id === hid).length,
        appointments: appointments.filter((a: any) => a.hospital_id === hid).length,
      });
    };
    load();
  }, [user?.hospitalId]);

  const cards = [
    { label: 'Staff Members', value: stats.staff, icon: Users, color: 'text-primary' },
    { label: 'Patients', value: stats.patients, icon: Activity, color: 'text-accent' },
    { label: 'Claims', value: stats.claims, icon: FileText, color: 'text-secondary' },
    { label: 'Appointments', value: stats.appointments, icon: Building2, color: 'text-primary' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.hospitalName || 'Hospital'} Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Hospital administration overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} className="kpi-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1"><AnimatedCounter value={c.value} /></p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="kpi-card">
          <h2 className="text-lg font-semibold text-foreground mb-2">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to manage staff, view patients, claims, billing, AI monitoring, and audit logs for your hospital.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default HospitalAdminDashboard;
