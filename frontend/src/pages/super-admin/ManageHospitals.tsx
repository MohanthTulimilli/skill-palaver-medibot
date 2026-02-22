import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Loader2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Hospital } from '@/types';

const ManageHospitals: React.FC = () => {
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '' });

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    const data = await api<Hospital[]>('/api/hospitals');
    setHospitals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api('/api/hospitals', { method: 'POST', body: JSON.stringify({ name: form.name, domain: form.domain }) });
      toast({ title: 'Hospital created', description: `${form.name} (${form.domain}) added.` });
      setForm({ name: '', domain: '' });
      setDialogOpen(false);
      fetchHospitals();
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
            <h1 className="text-2xl font-bold text-foreground">Manage Hospitals</h1>
            <p className="text-muted-foreground text-sm mt-1">Create and manage hospital tenants</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Hospital
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Hospital</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Hospital Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required placeholder="Apollo Healthcare" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Domain</label>
                  <input type="text" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="input-field" required placeholder="apollo.medibots.com" />
                  <p className="text-xs text-muted-foreground mt-1">Staff emails must use this domain (e.g. doctor@apollo.medibots.com)</p>
                </div>
                <button type="submit" disabled={creating} className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Hospital'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Domain</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h, i) => (
                    <motion.tr key={h.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        {h.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{h.domain}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${h.status === 'ACTIVE' ? 'status-approved' : 'status-denied'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(h.created_at).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                  {hospitals.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No hospitals yet. Create your first one!</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ManageHospitals;
