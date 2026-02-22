import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

const Departments: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments', user?.hospitalId],
    queryFn: () => api<Department[]>(`/api/departments${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/api/departments', { method: 'POST', body: JSON.stringify({ ...body, hospital_id: user?.hospitalId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department added');
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/api/departments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated');
      setEditing(null);
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/departments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { name: form.name, description: form.description || null };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Departments" description="Manage hospital departments" gradient />
        <div className="flex justify-end">
          <button onClick={openCreate} className="btn-glow gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
        {isLoading ? (
          <div className="kpi-card p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kpi-card p-5 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{d.name}</h3>
                  {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteMutation.mutate(d.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
            {departments.length === 0 && <div className="col-span-full kpi-card p-12 text-center text-muted-foreground">No departments. Add one to get started.</div>}
          </div>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glass w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-glass w-full min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Departments;
