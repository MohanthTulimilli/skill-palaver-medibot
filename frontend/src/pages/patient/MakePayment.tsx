import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPatientInvoices, fetchInvoiceItems, createRazorpayOrder, verifyRazorpayPayment, predictInvoiceWithInsights, DbInvoice } from '@/services/dataService';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { Loader2, X, CreditCard, IndianRupee, CheckCircle, ChevronDown, ChevronUp, Shield, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { PredictCard } from '@/components/ai';

type PayModalStep = 'confirm' | 'processing' | 'success';

const MakePayment: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState<DbInvoice | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [payStep, setPayStep] = useState<PayModalStep>('confirm');
  const [predictingInvoice, setPredictingInvoice] = useState<string | null>(null);
  const [invoicePrediction, setInvoicePrediction] = useState<{
    invoiceId: string;
    score: number;
    secondaryScore: number;
    insights: string;
    historicalStats?: Record<string, unknown>;
  } | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: () => fetchPatientInvoices(user!.id),
    enabled: !!user?.id,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ['invoice-items', expandedInvoice],
    queryFn: () => fetchInvoiceItems(expandedInvoice!),
    enabled: !!expandedInvoice,
  });


  const unpaidInvoices = invoices.filter(i => i.payment_status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.payment_status === 'PAID');
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  const [isVerifying, setIsVerifying] = useState(false);

  const openRazorpay = (inv: DbInvoice) => {
    setPayModal(inv);
    setPayStep('confirm');
  };

  const closeRazorpay = () => {
    if (payStep !== 'processing') {
      setPayModal(null);
      setPayStep('confirm');
    }
  };

  const handlePayWithRazorpay = async () => {
    if (!payModal) return;
    try {
      const order = await createRazorpayOrder(payModal.id, payModal.total_amount);
      openRazorpayCheckout(
        { orderId: order.orderId, keyId: order.keyId, amount: order.amount, currency: order.currency },
        {
          name: 'MediBots Health',
          description: payModal.invoice_number,
          onSuccess: async (paymentId, orderId, signature) => {
            setPayStep('processing');
            setIsVerifying(true);
            try {
              await verifyRazorpayPayment(orderId, paymentId, signature, payModal.id);
              qc.invalidateQueries({ queryKey: ['my-invoices'] });
              qc.invalidateQueries({ queryKey: ['my-claims'] });
              qc.invalidateQueries({ queryKey: ['my-payments'] });
              setPayStep('success');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Verification failed');
              setPayStep('confirm');
            } finally {
              setIsVerifying(false);
            }
          },
          onFailed: () => {
            toast.error('Payment failed. Please try again.');
          },
        }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start payment. Is Razorpay configured?');
    }
  };

  const handlePredictInvoice = async (inv: DbInvoice) => {
    setPredictingInvoice(inv.id);
    setInvoicePrediction(prev => prev?.invoiceId === inv.id ? prev : null);
    try {
      const features: Record<string, unknown> = {
        total_amount: inv.total_amount,
        days_to_payment: inv.days_to_payment ?? 0,
        payer_type: inv.payer_type ?? 'SELF',
        invoice_category: inv.invoice_category ?? 'CONSULTATION',
        reminder_count: inv.reminder_count ?? 0,
        installment_plan: inv.installment_plan ?? false,
        historical_avg_payment_delay: inv.historical_avg_payment_delay ?? 14,
        patient_age: inv.patient_age ?? 40,
        patient_gender: inv.patient_gender ?? 'MALE',
        previous_late_payments: inv.previous_late_payments ?? 0,
        payment_status: inv.payment_status ?? 'UNPAID',
      };
      const res = await predictInvoiceWithInsights(features);
      const onTimePct = res.on_time_rate_pct ?? (res.prediction === 1 ? (1 - res.probability) * 100 : res.probability * 100);
      const delayPct = res.delay_rate_pct ?? (100 - onTimePct);
      setInvoicePrediction({
        invoiceId: inv.id,
        score: Math.round(onTimePct),
        secondaryScore: Math.round(delayPct),
        insights: res.insights || 'Unable to load insights.',
        historicalStats: res.historical_stats,
      });
    } catch {
      setInvoicePrediction({
        invoiceId: inv.id,
        score: 50,
        secondaryScore: 50,
        insights: 'Prediction unavailable. Please try again.',
      });
    } finally {
      setPredictingInvoice(null);
    }
  };

  const itemTypeIcon = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return '🩺';
      case 'SURGERY': return '🔪';
      case 'LAB': return '🔬';
      case 'MEDICATION': return '💊';
      case 'IMAGING': return '📷';
      case 'ROOM': return '🏥';
      case 'ANESTHESIA': return '💉';
      default: return '📋';
    }
  };

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Make Payment</h1>
          <p className="text-muted-foreground text-sm mt-1">Pay your outstanding doctor fees and invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</span>
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <IndianRupee className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">₹{totalOutstanding.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Invoices</span>
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <CreditCard className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{unpaidInvoices.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{paidInvoices.length}</p>
          </motion.div>
        </div>

        {/* Unpaid Invoices */}
        {unpaidInvoices.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card text-center py-12">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
            <p className="text-foreground font-semibold">All Paid!</p>
            <p className="text-sm text-muted-foreground mt-1">You have no outstanding invoices.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Unpaid Invoices</h3>
            <div className="space-y-3">
              {unpaidInvoices.map((inv, i) => (
                <div key={inv.id}>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedInvoice(prev => prev === inv.id ? null : inv.id)} className="p-1 rounded hover:bg-muted transition-colors">
                        {expandedInvoice === inv.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePredictInvoice(inv); }}
                        disabled={predictingInvoice === inv.id}
                        className="px-3 py-2 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-all flex items-center gap-1.5"
                      >
                        {predictingInvoice === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                        Predict
                      </button>
                      <span className="text-lg font-bold text-foreground">₹{inv.total_amount.toLocaleString()}</span>
                      <button
                        onClick={() => openRazorpay(inv)}
                        className="px-4 py-2 rounded-lg bg-[#2B84EA] text-white text-xs font-medium hover:bg-[#1A6FD1] transition-all hover-lift flex items-center gap-1.5"
                      >
                        <Shield className="w-3 h-3" /> Pay with Razorpay
                      </button>
                    </div>
                  </motion.div>
                  {(invoicePrediction?.invoiceId === inv.id || predictingInvoice === inv.id) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                      <div className="mt-3 mb-2 px-4">
                        <PredictCard
                          variant="invoice"
                          score={invoicePrediction?.invoiceId === inv.id ? invoicePrediction.score : 0}
                          secondaryScore={invoicePrediction?.invoiceId === inv.id ? invoicePrediction.secondaryScore : 0}
                          insights={invoicePrediction?.invoiceId === inv.id ? invoicePrediction.insights : ''}
                          historicalStats={invoicePrediction?.invoiceId === inv.id ? invoicePrediction.historicalStats : undefined}
                          isLoading={predictingInvoice === inv.id}
                        />
                      </div>
                    </motion.div>
                  )}
                  <AnimatePresence>
                    {expandedInvoice === inv.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="ml-10 mt-2 mb-1 space-y-1.5">
                          {lineItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">No itemized breakdown available</p>
                          ) : lineItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/40">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{itemTypeIcon(item.item_type)}</span>
                                <span className="text-xs text-foreground">{item.description}</span>
                              </div>
                              <span className="text-xs font-semibold text-foreground">₹{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment History Section */}
        {paidInvoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Payment History</h3>
            <div className="space-y-2">
              {paidInvoices.map((inv, i) => (
                <motion.div key={inv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">₹{inv.total_amount.toLocaleString()}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">PAID via Razorpay</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Razorpay Payment Modal */}
      <AnimatePresence>
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={payStep !== 'processing' ? closeRazorpay : undefined}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

              <div className="bg-[#2B84EA] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-lg">Razorpay</span>
                </div>
                {payStep !== 'processing' && (
                  <button onClick={closeRazorpay} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
                )}
              </div>

              <div className="px-6 py-3 bg-[#F4F7FA] dark:bg-muted/20 border-b border-border/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MediBots Health</p>
                  <p className="text-xs text-muted-foreground">{payModal.invoice_number}</p>
                </div>
                <p className="text-xl font-bold text-foreground">₹{payModal.total_amount.toLocaleString()}</p>
              </div>

              <div className="p-6">
                {payStep === 'confirm' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Pay securely with Razorpay — UPI, cards, net banking</p>
                    <button
                      onClick={handlePayWithRazorpay}
                      disabled={isVerifying}
                      className="w-full py-3 rounded-xl bg-[#2B84EA] text-white text-sm font-semibold hover:bg-[#1A6FD1] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay ₹{payModal.total_amount.toLocaleString()}
                    </button>
                  </motion.div>
                )}

                {payStep === 'processing' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#2B84EA] mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Verifying payment…</p>
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
                    <p className="text-sm text-muted-foreground">₹{payModal.total_amount.toLocaleString()} paid for {payModal.invoice_number}</p>
                    <button onClick={closeRazorpay}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all">
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

export default MakePayment;
