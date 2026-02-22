import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Download, IndianRupee, Clock, AlertTriangle, X, Loader2, FileText, Plus, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/layout/PageTransition';
import { AIRiskGauge } from '@/components/ai';
import { useRealtimeRisk } from '@/hooks/useRealtimeRisk';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fetchInvoices, fetchPatientInvoices, fetchClaims, generateInvoice, createRazorpayOrder, verifyRazorpayPayment, createInvoiceFromRecommendations, fetchReceipt, fetchPatientById, fetchPatientLatePaymentCount } from '@/services/dataService';
import { openRazorpayCheckout } from '@/lib/razorpay';
import type { DbInvoice } from '@/services/dataService';
import AnimatedCounter from '@/components/layout/AnimatedCounter';

interface LineItem {
  description: string;
  amount: number;
  item_type: string;
}

const PROCEDURE_TYPES = [
  { label: 'Doctor Consultation Fee', type: 'CONSULTATION' },
  { label: 'Surgery / Operation', type: 'SURGERY' },
  { label: 'Lab Tests', type: 'LAB' },
  { label: 'Medication', type: 'MEDICATION' },
  { label: 'Imaging (X-Ray/MRI/CT)', type: 'IMAGING' },
  { label: 'Hospital Room Charges', type: 'ROOM' },
  { label: 'Anesthesia Fee', type: 'ANESTHESIA' },
  { label: 'Other', type: 'OTHER' },
];

const BillingPayments: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useRealtimeRisk({ pollIntervalMs: 20000, queryKeys: [['invoices']] });
  const [payModal, setPayModal] = useState<DbInvoice | null>(null);
  const [payStep, setPayStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showInvoiceExtras, setShowInvoiceExtras] = useState(false);
  const [invoiceExtras, setInvoiceExtras] = useState<{ payer_type?: string; invoice_category?: string; reminder_count?: number; installment_plan?: boolean; historical_avg_payment_delay?: number; patient_age?: number; patient_gender?: string; previous_late_payments?: number }>({});
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Doctor Consultation Fee', amount: 0, item_type: 'CONSULTATION' },
  ]);

  const isBillingStaff = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.BILLING;
  const canPay = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.BILLING || user?.role === UserRole.PATIENT;

  const isPatient = user?.role === UserRole.PATIENT;
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', isPatient ? 'patient' : 'all', user?.id],
    queryFn: isPatient ? () => fetchPatientInvoices(user!.id) : fetchInvoices,
    enabled: !isPatient || !!user?.id,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-billing'],
    queryFn: () => api<any[]>('/api/patients'),
    enabled: isBillingStaff && showRecommendModal,
  });

  const { data: patientRecs = [] } = useQuery({
    queryKey: ['recommendations-by-patient', selectedPatientId],
    queryFn: () => api<any[]>(`/api/doctor-recommendations/by-patient?patientId=${selectedPatientId}`),
    enabled: !!selectedPatientId && showRecommendModal,
  });

  // Fetch approved claims that don't have invoices yet (for billing to generate)
  const { data: approvedClaims = [] } = useQuery({
    queryKey: ['approved-claims-for-invoice'],
    queryFn: async () => {
      const claims = await fetchClaims();
      const approvedOnly = claims.filter(c => c.status === 'APPROVED');
      const invoiceClaimIds = new Set(invoices.filter(i => i.claim_id).map(i => i.claim_id));
      return approvedOnly.filter(c => !invoiceClaimIds.has(c.id));
    },
    enabled: isBillingStaff,
  });

  const selectedClaim = approvedClaims.find(c => c.id === selectedClaimId);
  const selectedClaimPatientId = selectedClaim?.patient_id;
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient-for-invoice', selectedClaimPatientId],
    queryFn: () => fetchPatientById(selectedClaimPatientId!),
    enabled: !!selectedClaimPatientId && showGenerateModal,
  });
  const { data: latePaymentData } = useQuery({
    queryKey: ['late-payment-count', selectedClaimPatientId],
    queryFn: () => fetchPatientLatePaymentCount(selectedClaimPatientId!),
    enabled: !!selectedClaimPatientId && showGenerateModal,
  });

  const pendingRecs = patientRecs.filter((r: any) => r.status === 'PENDING');

  const handlePayWithRazorpay = async (inv: DbInvoice) => {
    try {
      const order = await createRazorpayOrder(inv.id, inv.total_amount);
      openRazorpayCheckout(
        { orderId: order.orderId, keyId: order.keyId, amount: order.amount, currency: order.currency },
        {
          name: 'MediBots Health',
          description: inv.invoice_number,
          onSuccess: async (paymentId, orderId, signature) => {
            setPayStep('processing');
            try {
              await verifyRazorpayPayment(orderId, paymentId, signature, inv.id);
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              toast({ title: 'Payment Successful!', description: 'Invoice has been paid.' });
              setPayStep('success');
              setTimeout(() => { setPayModal(null); setPayStep('confirm'); }, 1500);
            } catch (e) {
              toast({ title: 'Verification Failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
              setPayStep('confirm');
            }
          },
          onFailed: () => {
            toast({ title: 'Payment Failed', description: 'Please try again.', variant: 'destructive' });
          },
        }
      );
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Could not start payment. Is Razorpay configured?', variant: 'destructive' });
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClaimId) throw new Error('Select a claim');
      const validItems = lineItems.filter(i => i.amount > 0 && i.description.trim());
      if (validItems.length === 0) throw new Error('Add at least one line item with an amount');
      const extras = Object.keys(invoiceExtras).length > 0 ? invoiceExtras : undefined;
      return generateInvoice(selectedClaimId, validItems, extras);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['approved-claims-for-invoice'] });
      toast({ title: 'Invoice Generated', description: 'The itemized invoice has been created.' });
      setShowGenerateModal(false);
      setSelectedClaimId('');
      setLineItems([{ description: 'Doctor Consultation Fee', amount: 0, item_type: 'CONSULTATION' }]);
      setInvoiceExtras({});
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0, item_type: 'OTHER' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'item_type') {
      const proc = PROCEDURE_TYPES.find(p => p.type === value);
      updated[index] = { ...updated[index], item_type: value as string, description: proc?.label || updated[index].description };
    } else {
      (updated[index] as any)[field] = value;
    }
    setLineItems(updated);
  };

  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const createFromRecsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId || pendingRecs.length === 0) throw new Error('Select patient with pending recommendations');
      const ids = pendingRecs.map((r: any) => r.id);
      return createInvoiceFromRecommendations(selectedPatientId, ids, user?.hospitalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-by-patient'] });
      toast({ title: 'Invoice Created', description: 'Invoice created from doctor recommendations.' });
      setShowRecommendModal(false);
      setSelectedPatientId('');
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const downloadReceipt = async (inv: DbInvoice) => {
    try {
      const data = await fetchReceipt(inv.id);
      const patientName = (data as any).patient_name || 'Patient';
      const itemsHtml = ((data as any).items || []).map((it: any) => `<tr><td>${it.description}</td><td>${it.item_type}</td><td>₹${Number(it.amount).toLocaleString()}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html><head><title>Receipt - ${inv.invoice_number}</title><style>body{font-family:system-ui;max-width:600px;margin:2rem auto;padding:1rem}table{width:100%;border-collapse:collapse}th,td{padding:8px;text-align:left;border-bottom:1px solid #eee}.total{font-weight:bold;font-size:1.2rem}</style></head><body>
        <h1>MediBots Health</h1>
        <h2>Receipt - ${inv.invoice_number}</h2>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${inv.payment_status}</p>
        <table><thead><tr><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <p class="total">Total: ₹${Number((inv as any).total_amount ?? 0).toLocaleString()}</p>
        <p style="margin-top:2rem;font-size:12px;color:#666">Thank you for choosing MediBots Health.</p>
      </body></html>`;
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.print();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Could not load receipt', variant: 'destructive' });
    }
  };

  const statusClass = (s: string) => s === 'PAID' ? 'status-approved' : s === 'PARTIAL' ? 'status-pending' : 'status-denied';
  const statusLabel = (s: string) => s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partial' : 'Unpaid';

  const totalCollected = invoices.filter(i => i.payment_status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0);
  const totalOutstanding = invoices.filter(i => i.payment_status !== 'PAID').reduce((sum, i) => sum + i.total_amount, 0);

  const kpis = [
    { label: 'Avg Payment Time', value: 12, suffix: ' days', icon: Clock },
    { label: 'Outstanding Revenue', value: totalOutstanding, prefix: '₹', icon: AlertTriangle },
    { label: 'Total Collected', value: totalCollected, prefix: '₹', icon: IndianRupee },
  ];

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === UserRole.PATIENT ? 'Invoices' : 'Billing & Payments'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.role === UserRole.PATIENT ? 'View your invoices and make payments' : 'Manage invoices and payment tracking'}
            </p>
          </div>
          {isBillingStaff && (
            <div className="flex gap-2">
              <button onClick={() => setShowRecommendModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
                <Plus className="w-4 h-4" /> From Doctor Recommendations
              </button>
              <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift">
                <FileText className="w-4 h-4" /> Generate Invoice
              </button>
            </div>
          )}
        </div>

        {user?.role !== UserRole.PATIENT && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="kpi-card flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-sm"><k.icon className="w-5 h-5 text-primary-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold text-foreground"><AnimatedCounter value={k.value} prefix={k.prefix} suffix={k.suffix} /></p></div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Delay Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No invoices found</td></tr>
                ) : invoices.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{inv.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">₹{inv.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`status-badge ${statusClass(inv.payment_status)}`}>{statusLabel(inv.payment_status)}</span></td>
                    <td className="px-4 py-2">
                      {(inv as any).ml_payment_delay_probability != null ? (
                        <div className="flex items-center">
                          <AIRiskGauge
                            score={Math.round(((inv as any).ml_payment_delay_probability ?? 0) * 100)}
                            variant="payment-delay"
                            size="sm"
                            showDetails={false}
                            confidence={0.91}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {inv.payment_status === 'PAID' && (
                        <button onClick={() => downloadReceipt(inv)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Download Receipt">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {canPay && inv.payment_status !== 'PAID' && <button onClick={() => setPayModal(inv)} className="text-xs font-medium text-primary hover:underline">Pay Now</button>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal (Razorpay) */}
        <AnimatePresence>
          {payModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={payStep !== 'processing' ? () => setPayModal(null) : undefined}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Pay with Razorpay</h3>
                  {payStep !== 'processing' && <button onClick={() => setPayModal(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>}
                </div>
                <p className="text-sm text-muted-foreground mb-2">Invoice {payModal.invoice_number}</p>
                <p className="text-lg font-bold text-foreground mb-4">₹{payModal.total_amount.toLocaleString()}</p>
                {payStep === 'confirm' && (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">Pay securely via UPI, cards, net banking</p>
                    <button
                      onClick={() => handlePayWithRazorpay(payModal)}
                      className="w-full py-2.5 rounded-lg bg-[#2B84EA] text-white text-sm font-medium hover:bg-[#1A6FD1] transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" /><CreditCard className="w-4 h-4" /> Pay ₹{payModal.total_amount.toLocaleString()}
                    </button>
                  </>
                )}
                {payStep === 'processing' && (
                  <div className="py-6 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#2B84EA] mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Verifying payment…</p>
                  </div>
                )}
                {payStep === 'success' && (
                  <div className="py-4 text-center">
                    <p className="text-sm font-semibold text-emerald-600">Payment successful!</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Invoice from Recommendations Modal */}
        <AnimatePresence>
          {showRecommendModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setShowRecommendModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Create Invoice from Doctor Recommendations</h3>
                  <button onClick={() => setShowRecommendModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Patient</label>
                    <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                      <option value="">Select patient</option>
                      {patients.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.fullName ?? p.full_name ?? 'Patient'}</option>
                      ))}
                    </select>
                  </div>
                  {selectedPatientId && (
                    <>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pending Recommendations</p>
                        {pendingRecs.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No pending recommendations for this patient.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {pendingRecs.map((r: any) => (
                              <div key={r.id} className="flex justify-between p-2 rounded bg-muted/30 text-sm">
                                <span>{r.service_name}</span>
                                <span>₹{(r.recommended_price ?? r.service_price ?? 0).toLocaleString()}</span>
                              </div>
                            ))}
                            <p className="text-sm font-medium">Total: ₹{pendingRecs.reduce((s: number, r: any) => s + (r.recommended_price ?? r.service_price ?? 0), 0).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => createFromRecsMutation.mutate()}
                        disabled={pendingRecs.length === 0 || createFromRecsMutation.isPending}
                        className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                      >
                        {createFromRecsMutation.isPending ? 'Creating…' : 'Create Invoice'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Invoice Modal */}
        <AnimatePresence>
          {showGenerateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setShowGenerateModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Generate Itemized Invoice</h3>
                  <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                {approvedClaims.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No approved claims available for invoice generation.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Approved Claim</label>
                      <select value={selectedClaimId} onChange={e => { setSelectedClaimId(e.target.value); setInvoiceExtras({}); }} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                        <option value="">Select a claim</option>
                        {approvedClaims.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.claim_number} — {c.patients?.full_name || 'Unknown'} (₹{typeof c.amount === 'number' ? c.amount.toLocaleString() : c.amount ?? '—'})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedClaimId && selectedClaimPatientId && (
                      <button type="button" onClick={() => setInvoiceExtras(x => ({ ...x, patient_age: selectedPatient?.dob ? Math.floor((Date.now() - new Date(selectedPatient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined, patient_gender: selectedPatient?.gender ?? undefined, previous_late_payments: latePaymentData?.previous_late_payments ?? undefined }))} className="text-xs text-primary hover:underline">
                        Pre-fill from patient (age, gender, late payments)
                      </button>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground">Invoice Line Items</label>
                        <button onClick={addLineItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {lineItems.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-muted/20 space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={item.item_type}
                                onChange={e => updateLineItem(idx, 'item_type', e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                              >
                                {PROCEDURE_TYPES.map(p => (
                                  <option key={p.type} value={p.type}>{p.label}</option>
                                ))}
                              </select>
                              {lineItems.length > 1 && (
                                <button onClick={() => removeLineItem(idx)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => updateLineItem(idx, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <input
                                type="number"
                                value={item.amount || ''}
                                onChange={e => updateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="Amount"
                                min="0"
                                className="flex-1 px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Total</span>
                        <span className="text-lg font-bold text-foreground">₹{lineItemsTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3">
                      <button type="button" onClick={() => setShowInvoiceExtras(!showInvoiceExtras)} className="text-xs font-medium text-primary hover:underline">
                        {showInvoiceExtras ? '−' : '+'} Additional invoice details
                      </button>
                      {showInvoiceExtras && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Payer Type</label><select value={invoiceExtras.payer_type ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, payer_type: e.target.value || undefined }))} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"><option value="">—</option><option value="INSURANCE">Insurance</option><option value="SELF">Self-Pay</option><option value="GOVERNMENT">Government</option><option value="CORPORATE">Corporate</option></select></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Invoice Category</label><input type="text" value={invoiceExtras.invoice_category ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, invoice_category: e.target.value || undefined }))} placeholder="e.g. Consultation, Surgery" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={50} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Reminder Count</label><input type="number" value={invoiceExtras.reminder_count ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, reminder_count: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="0" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Historical Avg Payment Delay (days)</label><input type="number" value={invoiceExtras.historical_avg_payment_delay ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, historical_avg_payment_delay: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="e.g. 14" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Patient Age</label><input type="number" value={invoiceExtras.patient_age ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, patient_age: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="e.g. 45" min={0} max={120} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Patient Gender</label><select value={invoiceExtras.patient_gender ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, patient_gender: e.target.value || undefined }))} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Previous Late Payments</label><input type="number" value={invoiceExtras.previous_late_payments ?? ''} onChange={e => setInvoiceExtras(x => ({ ...x, previous_late_payments: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="0" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div className="sm:col-span-2"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!invoiceExtras.installment_plan} onChange={e => setInvoiceExtras(x => ({ ...x, installment_plan: e.target.checked }))} className="rounded" /> Installment plan</label></div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => generateMutation.mutate()}
                      disabled={!selectedClaimId || lineItemsTotal <= 0 || generateMutation.isPending}
                      className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {generateMutation.isPending ? 'Generating…' : 'Generate Invoice'}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default BillingPayments;
