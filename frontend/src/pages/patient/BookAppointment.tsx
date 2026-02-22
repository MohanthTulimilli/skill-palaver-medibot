import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CalendarPlus, Stethoscope, IndianRupee, CreditCard, X, CheckCircle, UserPlus, Shield, Brain } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { PredictCard } from '@/components/ai';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { fetchPatientRecord, predictAppointmentWithInsights } from '@/services/dataService';
import { createRazorpayOrder, verifyRazorpayBooking, fetchPatientLatePaymentCount } from '@/services/dataService';
import { openRazorpayCheckout } from '@/lib/razorpay';

const CONSULTATION_FEE = 150; // Default consultation fee

type PayModalStep = 'confirm' | 'processing' | 'success';

const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState('CONSULTATION');
  const [distanceKm, setDistanceKm] = useState('');
  const [hasMissedAppointment, setHasMissedAppointment] = useState<boolean | null>(null);
  const [missedAppointmentCount, setMissedAppointmentCount] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [payStep, setPayStep] = useState<PayModalStep>('confirm');
  const [predictingAppt, setPredictingAppt] = useState(false);
  const [apptPrediction, setApptPrediction] = useState<{
    score: number;
    secondaryScore: number;
    insights: string;
    historicalStats?: Record<string, unknown>;
  } | null>(null);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['my-patient-record', user?.id],
    queryFn: () => fetchPatientRecord(user!.id),
    enabled: !!user?.id,
  });

  // Backend returns camelCase (hospitalId); support both for compatibility
  const patientHospitalId = patient?.hospital_id ?? (patient as any)?.hospitalId ?? null;
  // When no patient record yet, use logged-in user's hospital from profile (if any) to filter doctors
  const doctorsHospitalId = patientHospitalId ?? user?.hospitalId ?? null;

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors-list', doctorsHospitalId],
    queryFn: () => api<{ user_id: string; name: string; email: string; specialization: string | null; hospital_id: string | null }[]>(
      doctorsHospitalId ? `/api/profiles/doctors?hospitalId=${encodeURIComponent(doctorsHospitalId)}` : '/api/profiles/doctors'
    ),
    enabled: !!user?.id,
  });

  const { data: appointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ['my-appointments', user?.id],
    queryFn: () => api<any[]>('/api/appointments/patient'),
    enabled: !!patient,
  });

  const { data: latePaymentData } = useQuery({
    queryKey: ['late-payment-count', patient?.id],
    queryFn: () => fetchPatientLatePaymentCount(patient!.id),
    enabled: !!patient?.id,
  });

  const getDoctorName = (doctorUserId: string) => {
    const doc = doctors.find(d => d.user_id === doctorUserId);
    return doc ? `Dr. ${doc.name}` : 'Doctor';
  };

  const selectedDoctor = doctors.find(d => d.user_id === doctorId);

  const handlePredictAppointment = async () => {
    if (!patient || !doctorId || !date || !appointmentType || distanceKm === '' || hasMissedAppointment === null) return;
    if (hasMissedAppointment === true && (missedAppointmentCount === '' || parseInt(missedAppointmentCount, 10) < 0)) return;
    setPredictingAppt(true);
    setApptPrediction(null);
    try {
      const missedCount = hasMissedAppointment === false ? 0 : parseInt(missedAppointmentCount || '0', 10);
      const features: Record<string, unknown> = {
        patient_id: patient!.id,
        doctor_id: doctorId,
        appointment_date: new Date(date).toISOString(),
        appointment_type: appointmentType,
        distance_from_hospital_km: parseFloat(distanceKm),
        previous_no_show_count: missedCount,
        reminder_count: 1,
        sms_reminder_sent: true,
        patient_age: patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 40,
        patient_gender: patient?.gender ?? 'MALE',
        previous_late_payments: latePaymentData?.previous_late_payments ?? 0,
        consultation_fee: CONSULTATION_FEE,
        time_slot: new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()],
        booking_lead_time_days: Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      };
      const res = await predictAppointmentWithInsights(features);
      const attendancePct = res.attendance_rate_pct ?? (res.prediction === 1 ? (1 - res.probability) * 100 : res.probability * 100);
      const noShowPct = res.no_show_rate_pct ?? (100 - attendancePct);
      setApptPrediction({
        score: Math.round(attendancePct),
        secondaryScore: Math.round(noShowPct),
        insights: res.insights || 'Unable to load insights.',
        historicalStats: res.historical_stats,
      });
    } catch {
      setApptPrediction({
        score: 70,
        secondaryScore: 30,
        insights: 'Prediction unavailable. Please try again.',
      });
    } finally {
      setPredictingAppt(false);
    }
  };

  const handleBookClick = () => {
    if (!doctorId || !date || !appointmentType || distanceKm === '' || distanceKm == null) return;
    if (hasMissedAppointment === null) return;
    if (hasMissedAppointment === true && (missedAppointmentCount === '' || parseInt(missedAppointmentCount, 10) < 0)) return;
    if (!patient) {
      toast.error('Please complete your profile first to book an appointment.');
      return;
    }
    const missedCount = hasMissedAppointment === false ? 0 : parseInt(missedAppointmentCount || '0', 10);
    setPendingAppointment({ doctorId, date, reason, appointmentType, distanceKm, missedCount });
    setPayStep('confirm');
    setShowPayModal(true);
  };

  const closePayModal = () => {
    if (payStep !== 'processing') {
      setShowPayModal(false);
      setPendingAppointment(null);
      setPayStep('confirm');
    }
  };

  const verifyBookingMutation = useMutation({
    mutationFn: (params: { paymentId: string; orderId: string; signature: string }) =>
      verifyRazorpayBooking(params.orderId, params.paymentId, params.signature, {
        patient_id: patient!.id,
        doctor_id: pendingAppointment!.doctorId,
        appointment_date: new Date(pendingAppointment!.date).toISOString(),
        reason: pendingAppointment!.reason,
        hospital_id: patientHospitalId || undefined,
        amount: CONSULTATION_FEE,
        doctor_name: selectedDoctor?.name,
        appointment_type: pendingAppointment!.appointmentType || undefined,
        distance_from_hospital_km: pendingAppointment!.distanceKm ? parseFloat(pendingAppointment!.distanceKm) : undefined,
        previous_no_show_count: pendingAppointment!.missedCount,
        time_slot: pendingAppointment!.date ? new Date(pendingAppointment!.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
        weekday: pendingAppointment!.date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(pendingAppointment!.date).getDay()] : undefined,
        patient_age: patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
        patient_gender: patient?.gender ?? undefined,
        previous_late_payments: latePaymentData?.previous_late_payments ?? 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      qc.invalidateQueries({ queryKey: ['my-invoices'] });
      setPayStep('success');
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPayStep('confirm');
    },
  });

  const handlePayWithRazorpay = async () => {
    if (!patient || !pendingAppointment) return;
    try {
      const order = await createRazorpayOrder(null, CONSULTATION_FEE);
      openRazorpayCheckout(
        { orderId: order.orderId, keyId: order.keyId, amount: order.amount, currency: order.currency },
        {
          name: 'MediBots Health',
          description: `Consultation — Dr. ${selectedDoctor?.name || 'Doctor'}`,
          onSuccess: (paymentId, orderId, signature) => {
            setPayStep('processing');
            verifyBookingMutation.mutate({ paymentId, orderId, signature });
          },
          onFailed: () => {
            toast.error('Payment failed. Please try again.');
          },
        }
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not start payment. Is Razorpay configured?');
    }
  };

  const statusCls = (s: string) =>
    s === 'APPROVED' ? 'status-approved' : s === 'PENDING' ? 'status-pending' : s === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'status-denied';

  const feePaidBadge = (paid: boolean) =>
    paid ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
        Unpaid
      </span>
    );

  if (patientLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule a visit with a doctor</p>
        </div>

        {/* Always show full booking form: select doctor, date, reason, pay & book */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
          {!patient && (
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center gap-3">
              <UserPlus className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-foreground flex-1">Complete your profile once to book appointments. Then you can select a doctor and pay here.</p>
              <Link to="/patient-onboarding" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium text-sm hover:bg-amber-500/30 transition-colors">
                Complete Profile
              </Link>
            </div>
          )}
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2"><CalendarPlus className="w-4 h-4" /> Book an appointment</h3>
            <p className="text-xs text-muted-foreground mb-6">Select the doctor you want, choose date & time, then pay and confirm.</p>
            {!patientHospitalId && (
              <p className="text-xs text-muted-foreground mb-3 -mt-4">Your profile is not linked to a hospital — showing all available doctors.</p>
            )}

            {/* Step 1: Select your doctor */}
            <div className="mb-6">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 1</span>
              <label className="block text-sm font-medium text-foreground mt-1 mb-2">Select the doctor you want to see</label>
              {doctorsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading doctors…</div>
              ) : doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{patientHospitalId ? 'No doctors available at your hospital yet.' : 'No doctors available yet.'}</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {doctors.map(d => (
                      <button
                        key={d.user_id}
                        type="button"
                        onClick={() => setDoctorId(d.user_id)}
                        className={`text-left p-3 rounded-lg border-2 transition-all ${
                          doctorId === d.user_id
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-accent shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">Dr. {d.name}</p>
                            {d.specialization && <p className="text-xs text-muted-foreground">{d.specialization}</p>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedDoctor && (
                    <p className="mt-2 text-xs text-muted-foreground">You selected <span className="font-medium text-foreground">Dr. {selectedDoctor.name}</span>{selectedDoctor.specialization ? ` (${selectedDoctor.specialization})` : ''}. Now pick date & time below.</p>
                  )}
                </>
              )}
            </div>

            {/* Step 2 & 3: Date, time, reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 2</span>
                <label className="block text-sm font-medium text-foreground mt-1 mb-1">Date & Time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" min={new Date().toISOString().slice(0, 16)} />
              </div>
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 3</span>
                <label className="block text-sm font-medium text-foreground mt-1 mb-1">Reason for visit (optional)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Consultation, Follow-up" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" maxLength={200} />
              </div>
            </div>

            {/* Additional appointment details - mandatory */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Appointment Type</label>
                <select value={appointmentType} onChange={e => setAppointmentType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" required>
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CHECKUP">Checkup</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Distance from Hospital (km)</label>
                <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} placeholder="e.g. 5.2" min="0" step="0.1" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Have you missed any appointment?</label>
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => { setHasMissedAppointment(true); setMissedAppointmentCount(''); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${hasMissedAppointment === true ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHasMissedAppointment(false); setMissedAppointmentCount(''); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${hasMissedAppointment === false ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/50'}`}
                  >
                    No
                  </button>
                </div>
                {hasMissedAppointment === true && (
                  <input type="number" value={missedAppointmentCount} onChange={e => setMissedAppointmentCount(e.target.value)} placeholder="Enter number" min="0" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                )}
                {hasMissedAppointment === false && <span className="text-xs text-muted-foreground">Value: 0</span>}
              </div>
            </div>
            {patient && (
              <div className="p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground mt-2">
                <p>Patient info (from profile): Age {patient.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '—'}, Gender {patient.gender || '—'}, Previous late payments {latePaymentData?.previous_late_payments ?? '—'}</p>
              </div>
            )}

            {/* Consultation Fee & Book */}
            {doctorId && (
              <div className="md:col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">Consultation Fee</span>
                </div>
                <span className="text-lg font-bold text-foreground">₹{CONSULTATION_FEE}</span>
              </div>
            )}

            {apptPrediction && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <PredictCard
                  variant="appointment"
                  score={apptPrediction.score}
                  secondaryScore={apptPrediction.secondaryScore}
                  insights={apptPrediction.insights}
                  historicalStats={apptPrediction.historicalStats}
                  isLoading={predictingAppt}
                />
              </motion.div>
            )}

            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step 4</span>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handlePredictAppointment}
                  disabled={!patient || !doctorId || !date || !appointmentType || !distanceKm || distanceKm === '' || hasMissedAppointment === null || (hasMissedAppointment === true && (missedAppointmentCount === '' || parseInt(missedAppointmentCount, 10) < 0)) || predictingAppt}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {predictingAppt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  Predict
                </button>
                <button
                  onClick={handleBookClick}
                  disabled={!doctorId || !date || !appointmentType || !distanceKm || distanceKm === '' || hasMissedAppointment === null || (hasMissedAppointment === true && (missedAppointmentCount === '' || parseInt(missedAppointmentCount, 10) < 0)) || verifyBookingMutation.isPending}
                  className="flex-1 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {verifyBookingMutation.isPending ? 'Processing…' : doctorId && selectedDoctor ? `Book with Dr. ${selectedDoctor.name} — Pay ₹${CONSULTATION_FEE}` : `Pay ₹${CONSULTATION_FEE} & Book`}
                </button>
              </div>
            </div>
          </motion.div>

        {/* Appointments list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kpi-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">My Appointments</h3>
          {apptsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No appointments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th>Doctor</th><th>Date</th><th>Reason</th><th>Fee</th><th>Status</th></tr></thead>
                <tbody>
                  {appointments.map((a: any, i: number) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="px-4 py-3 font-medium text-foreground">{getDoctorName(a.doctor_id ?? a.doctorId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(a.appointment_date ?? a.appointmentDate ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">₹{(a.consultation_fee ?? a.consultationFee) || 0}</span>
                          {feePaidBadge(!!(a.fee_paid ?? a.feePaid))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`status-badge ${statusCls(a.status)}`}>{a.status}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Razorpay Payment Modal */}
      <AnimatePresence>
        {showPayModal && pendingAppointment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={payStep !== 'processing' ? closePayModal : undefined}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

              <div className="bg-[#2B84EA] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-lg">Razorpay</span>
                </div>
                {payStep !== 'processing' && (
                  <button onClick={closePayModal} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
                )}
              </div>

              <div className="px-6 py-3 bg-[#F4F7FA] dark:bg-muted/20 border-b border-border/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MediBots Health — Consultation</p>
                  <p className="text-xs text-muted-foreground">Dr. {selectedDoctor?.name} · {new Date(pendingAppointment.date).toLocaleString()}</p>
                </div>
                <p className="text-xl font-bold text-foreground">₹{CONSULTATION_FEE}</p>
              </div>

              <div className="p-6">
                {payStep === 'confirm' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Pay securely with Razorpay — UPI, cards, net banking</p>
                    <button
                      onClick={handlePayWithRazorpay}
                      disabled={verifyBookingMutation.isPending}
                      className="w-full py-3 rounded-xl bg-[#2B84EA] text-white text-sm font-semibold hover:bg-[#1A6FD1] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay ₹{CONSULTATION_FEE} & Book
                    </button>
                  </motion.div>
                )}

                {payStep === 'processing' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#2B84EA] mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Confirming your booking…</p>
                    <p className="text-xs text-muted-foreground">Please wait</p>
                  </motion.div>
                )}

                {payStep === 'success' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <p className="text-lg font-bold text-foreground">Payment Successful!</p>
                    <p className="text-sm text-muted-foreground">Appointment booked with Dr. {selectedDoctor?.name}</p>
                    <button
                      onClick={() => { toast.success('Appointment booked!'); closePayModal(); setDoctorId(''); setDate(''); setReason(''); }}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="px-6 py-3 bg-[#F4F7FA] dark:bg-muted/10 border-t border-border/30 flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Secured by Razorpay | 256-bit SSL</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default BookAppointment;
