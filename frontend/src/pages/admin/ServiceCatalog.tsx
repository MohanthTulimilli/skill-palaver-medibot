import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Pencil, Trash2, X, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SERVICE_TYPES = ['CHECKUP', 'CONSULTATION', 'LAB_TEST', 'IMAGING', 'SURGERY', 'PROCEDURE', 'EMERGENCY', 'DIAGNOSTIC', 'MEDICATION', 'OTHER'];

interface ServiceItem {
  id: string;
  name: string;
  service_type: string;
  price: number | null;
  description: string | null;
  department_id: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

function toServiceItem(raw: Record<string, unknown>): ServiceItem {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    service_type: String((raw.service_type ?? raw.serviceType) ?? ''),
    price: raw.price != null ? Number(raw.price) : null,
    description: raw.description != null ? String(raw.description) : null,
    department_id: (raw.department_id ?? raw.departmentId) != null ? String(raw.department_id ?? raw.departmentId) : null,
    status: String((raw.status ?? 'ACTIVE')),
  };
}

const ServiceCatalog: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState({ name: '', service_type: 'CONSULTATION', price: '', description: '', department_id: '' });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seedMutation = useMutation({
    mutationFn: () => api<{ count: number }>(`/api/service-catalog/seed?hospitalId=${user?.hospitalId || ''}`, { method: 'POST' }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
      toast.success(`Seeded ${d.count} services`);
      setSeeding(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setSeeding(false);
    },
  });

  const handleSeed = () => {
    if (!user?.hospitalId) {
      toast.error('No hospital assigned. Contact admin.');
      return;
    }
    setSeeding(true);
    seedMutation.mutate();
  };

  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: ['service-catalog', user?.hospitalId],
    queryFn: async () => {
      const raw = await api<Record<string, unknown>[]>(`/api/service-catalog${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`);
      return Array.isArray(raw) ? raw.map(toServiceItem) : [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', user?.hospitalId],
    queryFn: async () => {
      const raw = await api<Record<string, unknown>[]>(`/api/departments${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`);
      return Array.isArray(raw) ? raw.map((d: Record<string, unknown>) => ({ id: String(d.id ?? ''), name: String(d.name ?? '') })) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/api/service-catalog', { method: 'POST', body: JSON.stringify({ ...body, hospital_id: user?.hospitalId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
      toast.success('Service added');
      setDialogOpen(false);
      setForm({ name: '', service_type: 'CONSULTATION', price: '', description: '', department_id: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/api/service-catalog/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
      toast.success('Service updated');
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/service-catalog/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-catalog'] });
      toast.success('Service removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = services.filter(
    (s) =>
      (typeFilter === 'all' || s.service_type === typeFilter) &&
      (search ? s.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', service_type: 'CONSULTATION', price: '', description: '', department_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: ServiceItem) => {
    setEditing(s);
    setForm({
      name: s.name,
      service_type: s.service_type,
      price: s.price != null ? String(s.price) : '',
      description: s.description || '',
      department_id: s.department_id || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !user?.hospitalId) {
      toast.error('No hospital assigned. Contact admin to assign your account to a hospital.');
      return;
    }
    setSaving(true);
    const body = {
      name: form.name,
      service_type: form.service_type,
      price: form.price ? parseFloat(form.price) : null,
      description: form.description || null,
      department_id: form.department_id || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate(body);
    }
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Service Catalog" description="Manage hospital services and pricing" gradient />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-glass w-full pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-glass max-w-[200px]"
          >
            <option value="all">All types</option>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSeed} disabled={seeding || !user?.hospitalId} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-primary text-primary hover:bg-primary/10 flex items-center gap-2 disabled:opacity-50">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Seed Catalog
            </button>
            <button onClick={openCreate} disabled={!user?.hospitalId} className="btn-glow gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title={!user?.hospitalId ? 'Assign a hospital to your account first' : ''}>
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="kpi-card p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="kpi-card p-8 text-center text-destructive">
            Failed to load services: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="kpi-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(s.service_type || '—').replace(/_/g, ' ')} · {s.price != null ? `₹${s.price}` : '—'}
                    </p>
                    {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="kpi-card p-12 text-center text-muted-foreground">No services found. Add one to get started.</div>
            )}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="input-glass w-full"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input-glass w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="input-glass w-full"
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-glass w-full min-h-[80px]"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg bg-muted">
                  Cancel
                </button>
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

export default ServiceCatalog;
