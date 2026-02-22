import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@/types';
import PageTransition from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


interface UserRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  hospital_id: string | null;
}

const roleBadgeColor: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-primary/10 text-primary',
  [UserRole.HOSPITAL_ADMIN]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.BILLING]: 'bg-accent/10 text-accent',
  [UserRole.INSURANCE]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.AI_ANALYST]: 'bg-primary/10 text-primary',
  [UserRole.PATIENT]: 'bg-muted text-muted-foreground',
  [UserRole.DOCTOR]: 'bg-accent/10 text-accent',
};

interface HospitalOption {
  id: string;
  name: string;
}

const SuperAdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'HOSPITAL_ADMIN', hospital_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profiles, hospitals] = await Promise.all([
      api<{ id: string; user_id: string; name: string; email: string; created_at: string; hospital_id: string | null; role: string }[]>('/api/profiles'),
      api<{ id: string; name: string }[]>('/api/hospitals?status=ACTIVE'),
    ]);
    const roleMap = new Map(profiles.map(p => [p.user_id, (p as any).role as UserRole]));
    setUsers(profiles.map(p => ({ ...p, role: roleMap.get(p.user_id) || (p as any).role || UserRole.PATIENT })));
    setHospitals(hospitals);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api('/api/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({ ...form, hospital_id: form.hospital_id || undefined }),
      });
      toast({ title: 'Account created', description: `${form.name} added.` });
      setForm({ name: '', email: '', password: '', role: 'HOSPITAL_ADMIN', hospital_id: '' });
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Users</h1>
            <p className="text-muted-foreground text-sm mt-1">Create hospital admins and manage all accounts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Hospital Admin
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Hospital Admin</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" required placeholder="username@admin.medibots.com" pattern=".+@admin\.medibots\.com" title="Email must end with @admin.medibots.com" />
                  <p className="text-xs text-muted-foreground mt-1">Must use <span className="font-medium">@admin.medibots.com</span> domain</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Assign to Hospital</label>
                  <select value={form.hospital_id} onChange={e => setForm(f => ({ ...f, hospital_id: e.target.value }))} className="input-field" required>
                    <option value="">Select a hospital…</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                  {hospitals.length === 0 && <p className="text-xs text-destructive mt-1">No hospitals created yet. Create a hospital first.</p>}
                </div>
                <button type="submit" disabled={creating || !form.hospital_id} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Hospital Admin'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-primary-foreground">{u.name?.charAt(0) || '?'}</span>
                        </div>
                        {u.name || 'Unnamed'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${roleBadgeColor[u.role]}`}>{u.role.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No users</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SuperAdminUsers;
