import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Operation {
  id: string;
  procedure_name: string;
  patient_name: string;
  doctor_name: string;
  scheduled_at: string;
  status: string;
  operation_theatre_id: string | null;
}

interface Patient { id: string; full_name: string }
interface Doctor { user_id: string; name: string }
interface Theatre { id: string; name: string }

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];

const OperationScheduling: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    operation_theatre_id: '',
    procedure_name: '',
    scheduled_at: '',
    notes: '',
  });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['operations', user?.hospitalId],
    queryFn: () => api<Operation[]>(`/api/operations${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-op'],
    queryFn: async () => {
      const p = await api<any[]>('/api/patients');
      return p.map((x) => ({ id: x.id, full_name: x.full_name || x.fullName || 'Patient' }));
    },
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-list', user?.hospitalId],
    queryFn: () =>
      api<Doctor[]>(
        user?.hospitalId ? `/api/profiles/doctors?hospitalId=${user.hospitalId}` : '/api/profiles/doctors'
      ),
  });

  const { data: theatres = [] } = useQuery({
    queryKey: ['operation-theatres', user?.hospitalId],
    queryFn: () =>
      api<Theatre[]>(`/api/operation-theatres${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/api/operations', { method: 'POST', body: JSON.stringify({ ...body, hospital_id: user?.hospitalId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Operation scheduled');
      setShowAdd(false);
      setForm({ patient_id: '', doctor_id: '', operation_theatre_id: '', procedure_name: '', scheduled_at: '', notes: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/api/operations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Status updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    createMutation.mutate({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      operation_theatre_id: form.operation_theatre_id || undefined,
      procedure_name: form.procedure_name,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || undefined,
      status: 'SCHEDULED',
    });
    setSaving(false);
  };

  const statusColor = (s: string) =>
    s === 'COMPLETED' ? 'bg-success/10 text-success' : s === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground';

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Operation Scheduling" description="Schedule and manage surgeries" gradient />
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="btn-glow gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Schedule Operation
          </button>
        </div>

        {isLoading ? (
          <div className="kpi-card p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {operations.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="kpi-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold">{o.procedure_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {o.patient_name} · {o.doctor_name} · {o.scheduled_at ? new Date(o.scheduled_at).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor(o.status)}`}>{o.status.replace('_', ' ')}</span>
                  {o.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => updateMutation.mutate({ id: o.id, body: { status: 'IN_PROGRESS' } })}
                        className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: o.id, body: { status: 'COMPLETED' } })}
                        className="text-xs px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20"
                      >
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            {operations.length === 0 && (
              <div className="kpi-card p-12 text-center text-muted-foreground">No operations scheduled.</div>
            )}
          </div>
        )}

        {showAdd && (
          <div className="kpi-card p-6">
            <h3 className="font-semibold mb-4">New Operation</h3>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="input-glass w-full"
                  required
                >
                  <option value="">Select</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Doctor</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="input-glass w-full"
                  required
                >
                  <option value="">Select</option>
                  {doctors.map((d) => (
                    <option key={d.user_id} value={d.user_id}>Dr. {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operation Theatre</label>
                <select
                  value={form.operation_theatre_id}
                  onChange={(e) => setForm({ ...form, operation_theatre_id: e.target.value })}
                  className="input-glass w-full"
                >
                  <option value="">—</option>
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Procedure</label>
                <input
                  type="text"
                  value={form.procedure_name}
                  onChange={(e) => setForm({ ...form, procedure_name: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled At</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="input-glass w-full"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-glass w-full" />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-muted">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Schedule
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default OperationScheduling;
