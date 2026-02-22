import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPatientInvoices, makePayment, fetchInvoiceItems, DbInvoice, DbInvoiceItem } from '@/services/dataService';
import { Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState<DbInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: () => fetchPatientInvoices(user!.id),
    enabled: !!user?.id,
  });

  // Fetch line items for expanded invoice
  const { data: lineItems = [] } = useQuery({
    queryKey: ['invoice-items', expandedInvoice],
    queryFn: () => fetchInvoiceItems(expandedInvoice!),
    enabled: !!expandedInvoice,
  });

  const payMutation = useMutation({
    mutationFn: ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      makePayment(invoiceId, amount, paymentMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invoices'] });
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      qc.invalidateQueries({ queryKey: ['my-claims'] });
      toast.success('Payment successful!');
      setPayModal(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unpaidInvoices = invoices.filter(i => i.payment_status !== 'PAID');
  const paidInvoices = invoices.filter(i => i.payment_status === 'PAID');

  const toggleExpand = (invoiceId: string) => {
    setExpandedInvoice(prev => prev === invoiceId ? null : invoiceId);
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
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground text-sm mt-1">View your invoices, itemized breakdown, and make payments</p>
        </div>

        {/* Unpaid Invoices */}
        {unpaidInvoices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pending Payments</h3>
            <div className="space-y-3">
              {unpaidInvoices.map((inv, i) => (
                <div key={inv.id}>
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => toggleExpand(inv.id)} className="p-1 rounded hover:bg-muted transition-colors">
                        {expandedInvoice === inv.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.invoice_number} — ₹{inv.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayModal(inv)}
                      className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all"
                    >
                      Pay Now
                    </button>
                  </motion.div>
                  {/* Line items breakdown */}
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

        {/* Paid History */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th></th>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paidInvoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No payment history</td></tr>
                ) : paidInvoices.map((inv, i) => (
                  <React.Fragment key={inv.id}>
                    <motion.tr initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleExpand(inv.id)} className="p-1 rounded hover:bg-muted transition-colors">
                          {expandedInvoice === inv.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">₹{inv.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className="status-badge status-approved">Paid</span></td>
                    </motion.tr>
                    {expandedInvoice === inv.id && (
                      <tr>
                        <td colSpan={5} className="px-8 pb-3">
                          <div className="space-y-1.5">
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal */}
        <AnimatePresence>
          {payModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={() => setPayModal(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Make Payment</h3>
                  <button onClick={() => setPayModal(null)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Invoice {payModal.invoice_number}</p>
                <p className="text-lg font-bold text-foreground mb-4">₹{payModal.total_amount.toLocaleString()}</p>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm mb-4">
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>Bank Transfer</option>
                  <option>Insurance</option>
                </select>
                <button
                  disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate({ invoiceId: payModal.id, amount: payModal.total_amount })}
                  className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift disabled:opacity-50"
                >
                  {payMutation.isPending ? 'Processing…' : 'Confirm Payment'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default PaymentHistory;
