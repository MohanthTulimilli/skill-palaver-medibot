import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Bell, Sun, Moon, Globe } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const save = () => toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>

        {[
          { icon: User, title: 'Profile', delay: 0, content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label><input value={name} onChange={e => setName(e.target.value)} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="input-field" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1.5">Role</label><input value={user?.role?.replace('_', ' ') || ''} className="input-field capitalize" disabled /></div>
            </div>
          )},
          { icon: Lock, title: 'Change Password', delay: 0.1, content: (
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label><input type="password" className="input-field" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">New Password</label><input type="password" className="input-field" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label><input type="password" className="input-field" /></div>
            </div>
          )},
          { icon: Bell, title: 'Preferences', delay: 0.2, content: (
            <>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-foreground">Dark Mode</p><p className="text-xs text-muted-foreground">Toggle dark/light appearance</p></div>
                <button onClick={toggle} className="relative w-12 h-6 rounded-full transition-all duration-300" style={{ backgroundColor: isDark ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-foreground">Email Notifications</p><p className="text-xs text-muted-foreground">Receive email alerts for claims</p></div>
                <button className="relative w-12 h-6 rounded-full bg-primary">
                  <div className="absolute top-0.5 translate-x-6 w-5 h-5 rounded-full bg-card shadow-sm" />
                </button>
              </div>
            </>
          )},
          { icon: Globe, title: 'API Configuration', delay: 0.3, content: (
            <div><label className="block text-sm font-medium text-foreground mb-1.5">API Base URL</label><input defaultValue="https://api.medibots.io/v1" className="input-field font-mono text-xs" /></div>
          )},
        ].map(section => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: section.delay }} className="kpi-card space-y-4">
            <div className="flex items-center gap-2 text-primary"><section.icon className="w-5 h-5" /><h3 className="font-semibold text-foreground">{section.title}</h3></div>
            {section.content}
          </motion.div>
        ))}

        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={save} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all hover-lift shadow-sm">
          Save Changes
        </motion.button>
      </div>
    </PageTransition>
  );
};

export default Settings;
