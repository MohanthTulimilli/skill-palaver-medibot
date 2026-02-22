import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Activity, Shield } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedCounter from '@/components/layout/AnimatedCounter';
import { api } from '@/lib/api';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ hospitals: 0, users: 0, claims: 0 });

  useEffect(() => {
    const load = async () => {
      const [hospitals, profiles, claims] = await Promise.all([
        api<{ id: string }[]>('/api/hospitals'),
        api<{ id: string }[]>('/api/profiles'),
        api<{ id: string }[]>('/api/claims'),
      ]);
      setStats({
        hospitals: hospitals.length,
        users: profiles.length,
        claims: claims.length,
      });
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Hospitals', value: stats.hospitals, icon: Building2, color: 'text-primary' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-accent' },
    { label: 'Total Claims', value: stats.claims, icon: Activity, color: 'text-secondary' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">System-wide overview across all hospitals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} className="kpi-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    <AnimatedCounter value={c.value} />
                  </p>
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
            Use the sidebar to manage hospitals, view all users, and access system-wide analytics and audit logs.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default SuperAdminDashboard;
