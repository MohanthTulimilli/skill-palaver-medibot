import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Stethoscope, Loader2, Plus } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  patients?: { full_name?: string; fullName?: string };
}

interface ServiceItem {
  id: string;
  name: string;
  service_type: string;
  price: number | null;
  category?: string;
}

function toServiceItem(raw: Record<string, unknown>): ServiceItem {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    service_type: String((raw.service_type ?? raw.serviceType) ?? ''),
    price: raw.price != null ? Number(raw.price) : null,
    category: raw.category != null ? String(raw.category) : undefined,
  };
}

const CARE_CATEGORIES = [
  { label: 'Tests', value: 'LAB_TEST', types: ['LAB_TEST'] },
  { label: 'Checkups & Consultation', value: 'CHECKUP', types: ['CHECKUP', 'CONSULTATION'] },
  { label: 'Diagnostic', value: 'DIAGNOSTIC', types: ['DIAGNOSTIC'] },
  { label: 'Imaging', value: 'IMAGING', types: ['IMAGING'] },
  { label: 'Operations', value: 'SURGERY', types: ['SURGERY'] },
  { label: 'Procedures', value: 'PROCEDURE', types: ['PROCEDURE', 'EMERGENCY'] },
];

const DoctorAssignCare: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['doctor-appointments-for-assign'],
    queryFn: () => api<any[]>('/api/appointments/doctor'),
    enabled: !!user?.id,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['service-catalog-assign', user?.hospitalId],
    queryFn: async () => {
      const raw = await api<Record<string, unknown>[]>(`/api/service-catalog${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`);
      return Array.isArray(raw) ? raw.map(toServiceItem) : [];
    },
    enabled: !!user?.id,
  });

  const categoryTypes = CARE_CATEGORIES.find((c) => c.value === selectedCategory)?.types ?? [];
  const filteredServices = services.filter((s) => categoryTypes.includes(s.service_type));

  const addRecommendation = useMutation({
    mutationFn: async () => {
      if (!selectedAppointment || !selectedServiceId) return;
      const svc = services.find((s) => s.id === selectedServiceId);
      await api('/api/doctor-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          patient_id: selectedAppointment.patient_id,
          service_catalog_id: selectedServiceId,
          hospital_id: selectedAppointment.hospital_id ?? user?.hospitalId,
          recommended_price: svc?.price ?? null,
          notes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment-recommendations'] });
      toast.success('Assigned successfully');
      setSelectedServiceId('');
      setNotes('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getPatientName = (a: Appointment) => {
    const p = a.patients ?? (a as any).patients;
    if (!p) return 'Patient';
    return (p.full_name ?? p.fullName ?? p.name ?? '').trim() || 'Patient';
  };

  const appointmentsWithPatients = appointments.filter(
    (a: any) => a.status === 'APPROVED' || a.status === 'COMPLETED'
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-primary" />
            Assign Tests & Care
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assign tests, checkups, or operations to patients from their appointments
          </p>
        </div>

        <div className="kpi-card p-6 max-w-2xl">
          <h3 className="font-semibold text-foreground mb-4">Assign to patient</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">1. Select patient (from appointments)</label>
              <select
                value={selectedAppointment?.id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const appt = appointmentsWithPatients.find((a: any) => a.id === id);
                  setSelectedAppointment(appt ?? null);
                  setSelectedCategory('');
                  setSelectedServiceId('');
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
              >
                <option value="">Choose a patient...</option>
                {appointmentsWithPatients.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {getPatientName(a)} — {new Date(a.appointment_date ?? a.appointmentDate ?? '').toLocaleDateString()}
                  </option>
                ))}
              </select>
              {appointmentsWithPatients.length === 0 && !appointmentsLoading && (
                <p className="text-xs text-muted-foreground mt-1">No approved/completed appointments. Assign after seeing a patient.</p>
              )}
            </div>

            {selectedAppointment && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">2. Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedServiceId('');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="">Select category...</option>
                    {CARE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">3. Specific test / checkup / operation</label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground"
                    >
                      <option value="">Select service...</option>
                      {filteredServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ₹{s.price ?? '—'}
                        </option>
                      ))}
                    </select>
                    {filteredServices.length === 0 && !servicesLoading && (
                      <p className="text-xs text-muted-foreground mt-1">No services in this category. Ask admin to seed the catalog.</p>
                    )}
                  </div>
                )}

                {selectedServiceId && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional instructions..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[80px]"
                      rows={2}
                    />
                  </div>
                )}

                <button
                  onClick={() => addRecommendation.mutate()}
                  disabled={!selectedServiceId || addRecommendation.isPending}
                  className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addRecommendation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Assign to {selectedAppointment ? getPatientName(selectedAppointment) : 'Patient'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DoctorAssignCare;
