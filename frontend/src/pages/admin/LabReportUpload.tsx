import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Loader2, Download, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api, API_BASE } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface LabReport {
  id: string;
  patient_id: string;
  patient_name: string;
  filename: string;
  status: string;
  uploaded_at: string | null;
}

interface Patient {
  id: string;
  full_name?: string;
  fullName?: string;
}

const LabReportUpload: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['lab-reports', user?.hospitalId],
    queryFn: () => api<LabReport[]>(`/api/lab-reports${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-lab'],
    queryFn: () => api<Patient[]>('/api/patients'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/lab-reports/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-reports'] });
      toast.success('Report uploaded');
      setPatientId('');
      setNotes('');
      if (fileRef.current) fileRef.current.value = '';
      setUploading(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) {
      toast.error('Select a patient first');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    if (user?.hospitalId) formData.append('hospital_id', user.hospitalId);
    if (notes) formData.append('notes', notes);
    uploadMutation.mutate(formData);
  };

  const openReport = async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/lab-reports/serve/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      toast.error('Failed to load report');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const filtered = reports.filter(
    (r) =>
      !search ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.filename?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) =>
    s === 'VERIFIED' ? 'bg-success/10 text-success' : s === 'UPLOADED' ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground';

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Lab Report Upload & Tracking" description="Upload and track patient lab reports" gradient />

        <div className="kpi-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><FileUp className="w-5 h-5" /> Upload Report</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="input-glass w-full"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name ?? p.fullName ?? 'Patient'}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="input-glass w-full"
              />
            </div>
            <div className="flex items-end">
              <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={!patientId || uploading}
                className="px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                Choose File
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
          </div>
          {isLoading ? (
            <div className="kpi-card p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="kpi-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{r.filename}</p>
                    <p className="text-sm text-muted-foreground">{r.patient_name} · {r.uploaded_at ? new Date(r.uploaded_at).toLocaleString() : '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>{r.status}</span>
                    <button
                      onClick={() => openReport(r.id)}
                      className="p-2 rounded-lg hover:bg-muted flex items-center gap-1 text-sm"
                    >
                      <Download className="w-4 h-4" /> View
                    </button>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="kpi-card p-12 text-center text-muted-foreground">No lab reports found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default LabReportUpload;
