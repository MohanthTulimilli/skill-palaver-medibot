import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Calendar, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchPatientRecord } from '@/services/dataService';

interface ServiceItem {
  id: string;
  name: string;
  service_type: string;
  price: number | null;
  description: string | null;
}

function toServiceItem(raw: Record<string, unknown>): ServiceItem {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    service_type: String((raw.service_type ?? raw.serviceType) ?? ''),
    price: raw.price != null ? Number(raw.price) : null,
    description: raw.description != null ? String(raw.description) : null,
  };
}

interface LabBooking {
  id: string;
  test_name: string;
  scheduled_date: string;
  status: string;
  fee: number | null;
  patient_name?: string;
}

interface PatientOption {
  id: string;
  full_name?: string;
  fullName?: string;
  hospital_id?: string;
  hospitalId?: string;
}

const TestBooking: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === UserRole.HOSPITAL_ADMIN;
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['my-patient-record', user?.id],
    queryFn: () => fetchPatientRecord(user!.id),
    enabled: !!user?.id && !isAdmin,
  });

  const { data: patientsRaw = [] } = useQuery({
    queryKey: ['patients-for-test-booking'],
    queryFn: () => api<PatientOption[]>('/api/patients'),
    enabled: isAdmin,
  });
  const patients = isAdmin && user?.hospitalId
    ? patientsRaw.filter((p: PatientOption) => (p.hospital_id ?? p.hospitalId) === user.hospitalId)
    : patientsRaw;

  const patientHospitalId = isAdmin ? user?.hospitalId ?? null : (patient?.hospital_id ?? (patient as any)?.hospitalId ?? user?.hospitalId ?? null);
  const effectivePatientId = isAdmin ? selectedPatientId : patient?.id;

  const { data: labServices = [] } = useQuery({
    queryKey: ['service-catalog-lab', patientHospitalId],
    queryFn: async () => {
      const raw = await api<Record<string, unknown>[]>(
        `/api/service-catalog?serviceType=LAB_TEST${patientHospitalId ? `&hospitalId=${patientHospitalId}` : ''}`
      );
      return Array.isArray(raw) ? raw.map(toServiceItem) : [];
    },
    enabled: isAdmin ? !!user?.id : !!patientHospitalId,
  });

  const { data: myBookings = [], isLoading } = useQuery({
    queryKey: isAdmin ? ['lab-test-bookings-admin', user?.hospitalId] : ['lab-test-bookings-patient'],
    queryFn: () =>
      isAdmin
        ? api<LabBooking[]>(`/api/lab-test-bookings${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`)
        : api<LabBooking[]>('/api/lab-test-bookings/patient'),
    enabled: isAdmin ? !!user?.id : !!patient,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/api/lab-test-bookings', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-test-bookings-patient'] });
      qc.invalidateQueries({ queryKey: ['lab-test-bookings-admin'] });
      toast.success('Lab test booked');
      setSelectedService(null);
      setScheduledDate('');
      setSelectedPatientId('');
      setBooking(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setBooking(false);
    },
  });

  const handleBook = () => {
    if (!selectedService || !scheduledDate) {
      toast.error('Select a test and date.');
      return;
    }
    if (!effectivePatientId) {
      toast.error(isAdmin ? 'Select a patient.' : 'Please complete your profile first.');
      return;
    }
    setBooking(true);
    createMutation.mutate({
      patient_id: effectivePatientId,
      service_catalog_id: selectedService.id,
      hospital_id: patientHospitalId || undefined,
      test_name: selectedService.name,
      scheduled_date: new Date(scheduledDate).toISOString(),
      fee: selectedService.price,
      status: 'SCHEDULED',
    });
  };

  const statusColor = (s: string) =>
    s === 'COMPLETED' ? 'bg-success/10 text-success' : s === 'CANCELLED' ? 'bg-destructive/10 text-destructive' : 'bg-muted/60 text-muted-foreground';

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader title="Book Lab Tests" description="Schedule diagnostic lab tests" gradient />

        {!isAdmin && !patient && (
          <div className="kpi-card p-6 text-center text-muted-foreground">
            Please complete your profile first to book lab tests.
          </div>
        )}

        {isAdmin && !user?.hospitalId && (
          <div className="kpi-card p-6 text-center text-muted-foreground">
            No hospital assigned. Contact admin to assign your account to a hospital.
          </div>
        )}

        {(isAdmin || patient) && !(isAdmin && !user?.hospitalId) && (
          <>
            {isAdmin && (
              <div className="kpi-card p-6 mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name ?? p.fullName ?? 'Patient'}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="kpi-card p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" /> Available Tests
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {labServices.length === 0 && <p className="text-sm text-muted-foreground">No lab tests in catalog. Contact your hospital.</p>}
                  {labServices.map((s) => (
                    <motion.button
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedService?.id === s.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{s.price ?? '—'} · {(s.service_type || 'Lab Test').replace(/_/g, ' ')}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="kpi-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Book Selected Test</h3>
                {selectedService ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{selectedService.name}</p>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-glass w-full"
                      />
                    </div>
                    <button
                      onClick={handleBook}
                      disabled={!scheduledDate || !effectivePatientId || booking}
                      className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {isAdmin ? 'Book for Patient' : 'Book Test'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a test from the list.</p>
                )}
              </div>
            </div>

            <div className="kpi-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> {isAdmin ? 'All Lab Test Bookings' : 'My Lab Test Bookings'}
              </h3>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : myBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {myBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <span className="font-medium">{b.test_name}</span>
                        {isAdmin && b.patient_name && <span className="text-sm text-muted-foreground block">{b.patient_name}</span>}
                        <span className="text-sm text-muted-foreground ml-0 block">
                          {b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default TestBooking;
