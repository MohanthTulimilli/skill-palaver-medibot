import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Check, X, CheckCircle2, Info, IndianRupee, Calendar, XCircle, Stethoscope, Plus } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { AIRiskGauge } from '@/components/ai';
import { useRealtimeRisk } from '@/hooks/useRealtimeRisk';
import { toast } from 'sonner';

interface ServiceItem { id: string; name: string; service_type: string; price: number | null; category?: string }
interface Recommendation { id: string; service_name: string; service_type: string; status: string; recommended_price: number | null }

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  useRealtimeRisk({ pollIntervalMs: 20000, queryKeys: [['doctor-appointments']] });
  const [detailAppt, setDetailAppt] = useState<any | null>(null);
  const [recommendServiceId, setRecommendServiceId] = useState('');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    queryFn: () => api<any[]>('/api/appointments/doctor'),
    enabled: !!user?.id,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['appointment-recommendations', detailAppt?.id],
    queryFn: () => api<Recommendation[]>(`/api/doctor-recommendations/appointment/${detailAppt!.id}`),
    enabled: !!detailAppt?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['service-catalog-doctor', user?.hospitalId],
    queryFn: () => api<ServiceItem[]>(`/api/service-catalog${user?.hospitalId ? `?hospitalId=${user.hospitalId}` : ''}`),
    enabled: !!detailAppt,
  });

  const addRecommendation = useMutation({
    mutationFn: async () => {
      if (!recommendServiceId || !detailAppt) return;
      const svc = services.find((s: ServiceItem) => s.id === recommendServiceId);
      await api('/api/doctor-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          appointment_id: detailAppt.id,
          patient_id: detailAppt.patient_id,
          service_catalog_id: recommendServiceId,
          hospital_id: detailAppt.hospital_id ?? user?.hospitalId,
          recommended_price: svc?.price ?? null,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment-recommendations', detailAppt?.id] });
      setRecommendServiceId('');
      toast.success('Recommendation added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] });
      setDetailAppt(null);
      toast.success(`Appointment ${status.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusCls = (s: string) =>
    s === 'APPROVED' ? 'status-approved' : s === 'PENDING' ? 'status-pending' : s === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'status-denied';

  const appointmentDate = (a: any) => a.appointment_date ?? a.appointmentDate ?? '';
  const getPatientName = (a: any) => {
    const p = a.patients ?? a.Patients;
    if (!p) return 'Patient';
    return (p.full_name ?? p.fullName ?? p.name ?? '').trim() || 'Patient';
  };
  const feePaid = (a: any) => !!(a.fee_paid ?? a.feePaid);
  const feeAmount = (a: any) => (a.consultation_fee ?? a.consultationFee) ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter((a: any) => String(appointmentDate(a)).startsWith(today));

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your patient appointments</p>
        </div>

        {/* Today's Appointments */}
        {todayAppts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="kpi-card border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Today&apos;s Schedule ({todayAppts.length})</h3>
            </div>
            <div className="space-y-2">
              {todayAppts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {getPatientName(a).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{getPatientName(a)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(appointmentDate(a)).toLocaleTimeString()}{a.reason ? ` — ${a.reason}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${feePaid(a) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {feePaid(a) ? 'Paid' : 'Unpaid'}
                    </span>
                    <span className={`status-badge ${statusCls(a.status)}`}>{a.status}</span>
                    <button onClick={() => setDetailAppt(a)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="View details">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Appointments Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Fee</th>
                  <th>No-Show Risk</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No appointments found</td></tr>
                ) : appointments.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={a.status === 'PENDING' ? 'bg-primary/5' : ''}>
                    <td className="px-4 py-3 font-medium text-foreground">{getPatientName(a)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(appointmentDate(a)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{a.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">₹{feeAmount(a)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${feePaid(a) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {feePaid(a) ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {a.ml_no_show_probability != null ? (
                        <div className="flex items-center">
                          <AIRiskGauge
                            score={Math.round((a.ml_no_show_probability ?? 0) * 100)}
                            variant="no-show"
                            size="sm"
                            showDetails={false}
                            confidence={0.89}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className={`status-badge ${statusCls(a.status)}`}>{a.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => setDetailAppt(a)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors" title="View details">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        {a.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateStatus.mutate({ id: a.id, status: 'APPROVED' })} className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="Approve">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => updateStatus.mutate({ id: a.id, status: 'REJECTED' })} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Reject">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {a.status === 'APPROVED' && (
                          <button onClick={() => updateStatus.mutate({ id: a.id, status: 'COMPLETED' })} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Mark Complete">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AnimatePresence>
        {detailAppt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailAppt(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Appointment Details</h3>
                <button onClick={() => setDetailAppt(null)} className="p-1.5 rounded-lg hover:bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                    {getPatientName(detailAppt).charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{getPatientName(detailAppt)}</p>
                    <p className="text-xs text-muted-foreground">Patient ID: {detailAppt.patient_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="font-medium text-foreground">{new Date(appointmentDate(detailAppt)).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fee</p>
                      <p className="font-medium text-foreground">₹{feeAmount(detailAppt)} — <span className={feePaid(detailAppt) ? 'text-emerald-600' : 'text-amber-600'}>{feePaid(detailAppt) ? 'Paid' : 'Unpaid'}</span></p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reason for visit</p>
                  <p className="text-sm text-foreground">{detailAppt.reason || '—'}</p>
                </div>
                {detailAppt.ml_no_show_probability != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI No-Show Risk</p>
                    <AIRiskGauge
                      score={Math.round((detailAppt.ml_no_show_probability ?? 0) * 100)}
                      variant="no-show"
                      size="md"
                      showDetails={true}
                      confidence={0.89}
                    />
                  </div>
                )}
                {(detailAppt.status === 'APPROVED' || detailAppt.status === 'COMPLETED') && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Recommend Test / Surgery
                    </h4>
                    {recommendations.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {recommendations.map((r: Recommendation) => (
                          <li key={r.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/30">
                            <span>{r.service_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : r.status === 'INVOICED' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2">
                      <select value={recommendServiceId} onChange={(e) => setRecommendServiceId(e.target.value)} className="flex-1 input-glass text-sm py-1.5">
                        <option value="">Select test/surgery...</option>
                        {services.map((s: ServiceItem) => (
                          <option key={s.id} value={s.id}>{s.name} — ₹{s.price ?? '—'}</option>
                        ))}
                      </select>
                      <button onClick={() => addRecommendation.mutate()} disabled={!recommendServiceId || addRecommendation.isPending} className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-1 disabled:opacity-50">
                        {addRecommendation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${statusCls(detailAppt.status)}`}>{detailAppt.status}</span>
                </div>
                {(detailAppt.status === 'PENDING' || detailAppt.status === 'APPROVED') && (
                  <div className="flex gap-2 pt-2">
                    {detailAppt.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus.mutate({ id: detailAppt.id, status: 'APPROVED' })} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 font-medium text-sm hover:bg-emerald-500/20">
                          Approve
                        </button>
                        <button onClick={() => updateStatus.mutate({ id: detailAppt.id, status: 'REJECTED' })} className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/20">
                          Reject
                        </button>
                      </>
                    )}
                    {detailAppt.status === 'APPROVED' && (
                      <button onClick={() => updateStatus.mutate({ id: detailAppt.id, status: 'COMPLETED' })} className="w-full py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90">
                        Mark as Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default DoctorAppointments;
