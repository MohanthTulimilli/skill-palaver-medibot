import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Theatre {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  status: string;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

const OperationTheatreManagement: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Theatre | null>(null);
  const [form, setForm] = useState({ name: '', description: '', capacity: 1, department_id: '' });
  const [saving, setSaving] = useState(false);

  const { data: theatres = [], isLoading } = useQuery({
    queryKey: ['operation-theatres', user?.hospitalId],
    queryFn: () =>
      api<Theatre[]>(`/api/operation-theatres${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', user?.hospitalId],
    queryFn: () => api<Department[]>(`/api/departments${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/api/operation-theatres', { method: 'POST', body: JSON.stringify({ ...body, hospital_id: user?.hospitalId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operation-theatres'] });
      toast.success('Theatre added');
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/api/operation-theatres/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operation-theatres'] });
      toast.success('Theatre updated');
      setEditing(null);
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/operation-theatres/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operation-theatres'] });
      toast.success('Theatre removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', capacity: 1, department_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: Theatre) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description || '',
      capacity: t.capacity ?? 1,
      department_id: t.department_id || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name,
      description: form.description || null,
      capacity: Number(form.capacity),
      department_id: form.department_id || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Operation Theatre Management" description="Manage operation theatres and availability" gradient />
        <div className="flex justify-end">
          <button onClick={openCreate} className="btn-glow gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Theatre
          </button>
        </div>

        {isLoading ? (
          <div className="kpi-card p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {theatres.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="kpi-card p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-primary/10 flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{t.name}</h3>
                        <p className="text-sm text-muted-foreground">Capacity: {t.capacity ?? 1}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-muted/60 text-muted-foreground'}`}>
                    {t.status}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {theatres.length === 0 && (
              <div className="col-span-full kpi-card p-12 text-center text-muted-foreground">No theatres. Add one to get started.</div>
            )}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Theatre' : 'Add Theatre'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glass w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} className="input-glass w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="input-glass w-full">
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-glass w-full min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default OperationTheatreManagement;
