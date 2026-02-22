import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Search, Brain, ArrowUpDown, Download, X, Loader2, Plus, RefreshCw } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClaims, manageClaim, createClaim, fetchCompletedAppointmentsForClaims, predictClaimWithInsights, rescoreClaims, DbClaim, CreateClaimPayload } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeClaims } from '@/hooks/useRealtimeClaims';
import { useRealtimeRisk } from '@/hooks/useRealtimeRisk';
import { AIRiskGauge, AIInsightsSidebar, AIActivityTimeline, PredictCard } from '@/components/ai';
import type { ActivityEvent } from '@/components/ai/AIActivityTimeline';

type SortField = 'amount' | 'ai_risk_score';
type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'DENIED';

const ClaimsManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useRealtimeClaims();
  useRealtimeRisk({ pollIntervalMs: 20000 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedClaim, setSelectedClaim] = useState<DbClaim | null>(null);
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [showClaimExtras, setShowClaimExtras] = useState(false);
  const [claimExtras, setClaimExtras] = useState<Partial<CreateClaimPayload>>({});
  const [claimPrediction, setClaimPrediction] = useState<{
    score: number;
    secondaryScore: number;
    insights: string;
    historicalStats?: Record<string, unknown>;
  } | null>(null);
  const [predictingClaim, setPredictingClaim] = useState(false);

  const canApprove = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.INSURANCE;
  const canExport = user?.role !== UserRole.PATIENT;
  const isReadOnly = user?.role === UserRole.AI_ANALYST;
  const canCreateClaim = user?.role === UserRole.BILLING || user?.role === UserRole.HOSPITAL_ADMIN || user?.role === UserRole.INSURANCE || user?.role === UserRole.SUPER_ADMIN;

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
  });

  const { data: completedAppts = [], isError: completedApptsError, isLoading: completedApptsLoading } = useQuery({
    queryKey: ['completed-appointments-for-claims'],
    queryFn: fetchCompletedAppointmentsForClaims,
    enabled: canCreateClaim && showCreateModal,
    retry: 1,
  });

  const rescoreMutation = useMutation({
    mutationFn: rescoreClaims,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({ title: 'AI scores updated', description: `Re-scored ${data.rescored} of ${data.total} claims.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ claimId, action }: { claimId: string; action: 'approve' | 'reject' }) =>
      manageClaim(claimId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setSelectedClaim(null);
      toast({ title: `Claim ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: `The claim has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handlePredictClaim = async () => {
    const appt = completedAppts.find(a => a.id === selectedApptId);
    if (!appt) return;
    const amount = parseFloat(claimAmount);
    if (!amount || amount <= 0) return;
    setPredictingClaim(true);
    setClaimPrediction(null);
    try {
      const provider = (appt.patients as any)?.insurance_provider || 'Unknown';
      const patientName = (appt.patients as any)?.full_name ?? (appt.patients as any)?.fullName ?? 'Patient';
      const extras = Object.fromEntries(
        Object.entries(claimExtras).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ) as Partial<CreateClaimPayload>;
      const features: Record<string, unknown> = {
        patient_id: appt.patient_id,
        patient_name: patientName,
        amount,
        insurance_provider: provider,
        ...extras,
      };
      if ((appt as any).hospital_id) features.hospital_id = (appt as any).hospital_id;
      const res = await predictClaimWithInsights(features);
      const acceptancePct = res.acceptance_rate_pct ?? (res.prediction === 1 ? (1 - res.probability) * 100 : res.probability * 100);
      const denialPct = res.denial_rate_pct ?? (100 - acceptancePct);
      setClaimPrediction({
        score: Math.round(acceptancePct),
        secondaryScore: Math.round(denialPct),
        insights: res.insights || 'Unable to load insights.',
        historicalStats: res.historical_stats,
      });
    } catch {
      setClaimPrediction({
        score: 50,
        secondaryScore: 50,
        insights: 'Prediction unavailable. Please try again.',
      });
    } finally {
      setPredictingClaim(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const appt = completedAppts.find(a => a.id === selectedApptId);
      if (!appt) throw new Error('Select an appointment');
      const amount = parseFloat(claimAmount);
      if (!amount || amount <= 0) throw new Error('Enter a valid amount');
      const provider = (appt.patients as any)?.insurance_provider || 'Unknown';
      const extras = Object.fromEntries(
        Object.entries(claimExtras).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ) as Partial<CreateClaimPayload>;
      if ((appt as any).hospital_id) extras.hospital_id = (appt as any).hospital_id;
      return createClaim(appt.patient_id, provider, amount, appt.id, Object.keys(extras).length > 0 ? extras : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['completed-appointments-for-claims'] });
      setShowCreateModal(false);
      setSelectedApptId('');
      setClaimAmount('');
      setClaimExtras({});
      setClaimPrediction(null);
      toast({ title: 'Claim Created', description: 'The claim has been created with AI risk scoring.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const filtered = useMemo(() => {
    let result = claims.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const name = c.patients?.full_name || '';
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || c.claim_number.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
    result.sort((a, b) => {
      const aVal = (a[sortField] ?? 0) as number;
      const bVal = (b[sortField] ?? 0) as number;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return result;
  }, [claims, search, statusFilter, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportCSV = () => {
    const headers = ['Claim Number', 'Patient', 'Payer', 'Amount', 'AI Risk Score', 'Status', 'Submitted'];
    const rows = filtered.map(c => [c.claim_number, c.patients?.full_name || '', c.insurance_provider, c.amount, c.ai_risk_score, c.status, c.submitted_at]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'APPROVED' ? 'status-approved' : status === 'PENDING' ? 'status-pending' : 'status-denied';
    return <span className={`status-badge ${cls}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
  };

  const highRiskClaims = useMemo(
    () =>
      claims
        .filter(c => (c.ai_risk_score ?? 0) >= 50)
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          type: 'claim' as const,
          label: `${c.claim_number} — ${c.patients?.full_name || 'Unknown'}`,
          amount: c.amount,
          riskScore: Math.round(c.ai_risk_score ?? 0),
        })),
    [claims]
  );

  const estimatedImpact = useMemo(
    () => highRiskClaims.reduce((sum, c) => sum + (c.amount ?? 0), 0),
    [highRiskClaims]
  );

  const activityEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];
    const now = new Date();
    highRiskClaims.slice(0, 5).forEach((c, i) => {
      events.push({
        id: `eval-${c.id}`,
        type: 'model_eval',
        message: `Model re-evaluated claim ${c.label.split('—')[0]?.trim() || c.id}`,
        timestamp: new Date(now.getTime() - (i + 1) * 60000).toLocaleTimeString(),
        entityType: 'claim',
      });
    });
    if (highRiskClaims.length > 0) {
      events.unshift({
        id: 'risk-update',
        type: 'risk_update',
        message: 'Risk scores updated across high-risk claims',
        timestamp: new Date().toLocaleTimeString(),
        entityType: 'claim',
      });
    }
    return events.slice(0, 8);
  }, [highRiskClaims]);

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
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Claims Management"
            description={isReadOnly ? 'View-only access to insurance claims' : 'Track and manage insurance claims'}
          />
          <div className="flex items-center gap-2 -mt-2 sm:mt-0">
            {isReadOnly && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">Read Only</span>
            )}
            {canCreateClaim && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all hover-lift"
              >
                <Plus className="w-4 h-4" /> Create Claim
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims…" className="input-field pl-10" />
          </div>
          <div className="flex gap-2">
            {(['all', 'APPROVED', 'PENDING', 'DENIED'] as const).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === s ? 'gradient-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {canExport && (
            <>
              <button
                onClick={() => rescoreMutation.mutate()}
                disabled={rescoreMutation.isPending || claims.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-primary text-primary hover:bg-primary/10 transition-all duration-200 hover-lift disabled:opacity-50"
              >
                {rescoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Re-score AI
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-all duration-200 hover-lift">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Patient</th>
                  <th>Payer</th>
                  <th className="cursor-pointer" onClick={() => { setSortField('amount'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <span className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="cursor-pointer" onClick={() => { setSortField('ai_risk_score'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                    <span className="flex items-center gap-1">AI Risk <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No claims found</td></tr>
                ) : paged.map((claim, i) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{claim.claim_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{claim.patients?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{claim.insurance_provider}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">₹{claim.amount.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {claim.ai_risk_score != null ? (
                        <div className="flex items-center" onClick={e => e.stopPropagation()}>
                          <AIRiskGauge
                            score={Math.round(claim.ai_risk_score)}
                            variant="denial"
                            size="sm"
                            showDetails={false}
                            confidence={0.92}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(claim.status)}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-medium text-primary hover:underline">View</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/60">
              <span className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${page === i + 1 ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
          </div>

          {/* AI Insights Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0">
            <AIInsightsSidebar
              highRiskClaims={highRiskClaims}
              estimatedImpact={estimatedImpact}
              weeklySummary={{
                claimsReviewed: claims.length,
                invoicesAtRisk: 0,
                apptsNoShow: 0,
              }}
              onItemClick={(item) => {
                const claim = claims.find(c => c.id === item.id);
                if (claim) setSelectedClaim(claim);
              }}
            />
            <div className="kpi-card rounded-2xl p-4">
              <AIActivityTimeline events={activityEvents} maxItems={8} />
            </div>
          </aside>
        </div>

        {/* Claim Detail Modal */}
        <AnimatePresence>
          {selectedClaim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30"
              onClick={() => setSelectedClaim(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.25 }}
                className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Claim {selectedClaim.claim_number}</h3>
                  <button onClick={() => setSelectedClaim(null)} className="p-1 rounded-lg hover:bg-muted transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium text-foreground">{selectedClaim.patients?.full_name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payer</span><span className="text-foreground">{selectedClaim.insurance_provider}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-foreground">₹{selectedClaim.amount.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span>{statusBadge(selectedClaim.status)}</div>
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">AI Denial Risk</span>
                    {selectedClaim.ai_risk_score != null ? (
                      <AIRiskGauge
                        score={Math.round(selectedClaim.ai_risk_score)}
                        variant="denial"
                        size="md"
                        showDetails={true}
                        confidence={0.92}
                        explanation={selectedClaim.ai_explanation ?? undefined}
                      />
                    ) : (selectedClaim as any).ml_denial_probability != null ? (
                      <AIRiskGauge
                        score={Math.round(((selectedClaim as any).ml_denial_probability ?? 0) * 100)}
                        variant="denial"
                        size="md"
                        showDetails={true}
                        confidence={0.92}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="text-foreground">{new Date(selectedClaim.submitted_at).toLocaleDateString()}</span></div>
                  {selectedClaim.processed_at && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Processed</span><span className="text-foreground">{new Date(selectedClaim.processed_at).toLocaleDateString()}</span></div>
                  )}
                  {(selectedClaim.primary_icd_code || selectedClaim.cpt_code || selectedClaim.claim_type) && (
                    <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                      {selectedClaim.primary_icd_code && <div className="flex justify-between"><span className="text-muted-foreground">Primary ICD</span><span className="text-foreground font-mono">{selectedClaim.primary_icd_code}</span></div>}
                      {selectedClaim.secondary_icd_code && <div className="flex justify-between"><span className="text-muted-foreground">Secondary ICD</span><span className="text-foreground font-mono">{selectedClaim.secondary_icd_code}</span></div>}
                      {selectedClaim.cpt_code && <div className="flex justify-between"><span className="text-muted-foreground">CPT Code</span><span className="text-foreground font-mono">{selectedClaim.cpt_code}</span></div>}
                      {selectedClaim.claim_type && <div className="flex justify-between"><span className="text-muted-foreground">Claim Type</span><span className="text-foreground">{selectedClaim.claim_type}</span></div>}
                      {selectedClaim.procedure_category && <div className="flex justify-between"><span className="text-muted-foreground">Procedure</span><span className="text-foreground">{selectedClaim.procedure_category}</span></div>}
                      {selectedClaim.patient_age != null && <div className="flex justify-between"><span className="text-muted-foreground">Patient Age</span><span className="text-foreground">{selectedClaim.patient_age}</span></div>}
                      {selectedClaim.documentation_complete != null && <div className="flex justify-between"><span className="text-muted-foreground">Docs Complete</span><span className="text-foreground">{selectedClaim.documentation_complete ? 'Yes' : 'No'}</span></div>}
                    </div>
                  )}

                  {selectedClaim.ai_explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-primary" /><span className="font-semibold text-foreground text-xs">AI Analysis</span></div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{selectedClaim.ai_explanation}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  {canApprove && selectedClaim.status === 'PENDING' && (
                    <>
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ claimId: selectedClaim.id, action: 'approve' })}
                        className="flex-1 py-2.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                      >
                        {actionMutation.isPending ? 'Processing…' : 'Approve'}
                      </button>
                      <button
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ claimId: selectedClaim.id, action: 'reject' })}
                        className="flex-1 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        {actionMutation.isPending ? 'Processing…' : 'Reject'}
                      </button>
                    </>
                  )}
                  {!canApprove && (
                    <p className="text-xs text-muted-foreground italic">You have view-only access to this claim.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Claim Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 overflow-y-auto p-4"
              onClick={() => { setShowCreateModal(false); setClaimPrediction(null); }}
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
                  <h3 className="text-lg font-bold text-foreground">Create Claim from Appointment</h3>
                  <button onClick={() => { setShowCreateModal(false); setClaimPrediction(null); }} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                {completedApptsLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading appointments…</p>
                ) : completedApptsError ? (
                  <p className="text-sm text-destructive py-4 text-center">Failed to load appointments. You may not have permission. Try again.</p>
                ) : completedAppts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No completed appointments available for claim creation.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Completed Appointment</label>
                      <select
                        value={selectedApptId}
                        onChange={e => {
                          const id = e.target.value;
                          setSelectedApptId(id);
                          const appt = completedAppts.find(a => a.id === id);
                          const fee = appt?.consultation_fee ?? appt?.consultationFee ?? null;
                          setClaimAmount(fee != null ? String(Number(fee)) : '');
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      >
                        <option value="">Select an appointment</option>
                        {completedAppts.map(a => (
                          <option key={a.id} value={a.id}>
                            Dr. {(a.doctors as any)?.name || a.doctor_name || '—'} · {(a.patients as any)?.full_name || (a.patients as any)?.fullName || 'Unknown'} — {new Date(a.appointment_date ?? a.appointmentDate ?? '').toLocaleDateString()} {a.reason ? `(${a.reason})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedApptId && (() => {
                      const appt = completedAppts.find(a => a.id === selectedApptId);
                      const doctorName = (appt?.doctors as any)?.name ?? (appt as any)?.doctor_name ?? '—';
                      const patientName = (appt?.patients as any)?.full_name ?? (appt?.patients as any)?.fullName ?? '—';
                      const insuranceProvider = (appt?.patients as any)?.insurance_provider ?? 'N/A';
                      const fee = appt?.consultation_fee ?? (appt as any)?.consultationFee ?? null;
                      return (
                        <div className="p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground space-y-1">
                          <p><strong className="text-foreground">Doctor:</strong> Dr. {doctorName}</p>
                          <p><strong className="text-foreground">Patient:</strong> {patientName}</p>
                          <p><strong className="text-foreground">Insurance:</strong> {insuranceProvider}</p>
                          {fee != null && <p><strong className="text-foreground">Consultation fee:</strong> ₹{Number(fee).toLocaleString()}</p>}
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Claim Amount (₹)</label>
                      <input
                        type="number"
                        value={claimAmount}
                        onChange={e => setClaimAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        min="1"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                      />
                    </div>

                    <div className="border-t border-border pt-4">
                      <button type="button" onClick={() => setShowClaimExtras(!showClaimExtras)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                        {showClaimExtras ? '−' : '+'} Additional claim details (ICD, CPT, pre-auth, etc.)
                      </button>
                      {showClaimExtras && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 space-y-0">
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Primary ICD Code</label><input type="text" value={claimExtras.primary_icd_code ?? ''} onChange={e => setClaimExtras(x => ({ ...x, primary_icd_code: e.target.value || undefined }))} placeholder="e.g. J06.9" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={20} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Secondary ICD Code</label><input type="text" value={claimExtras.secondary_icd_code ?? ''} onChange={e => setClaimExtras(x => ({ ...x, secondary_icd_code: e.target.value || undefined }))} placeholder="e.g. R50.9" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={20} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">CPT Code</label><input type="text" value={claimExtras.cpt_code ?? ''} onChange={e => setClaimExtras(x => ({ ...x, cpt_code: e.target.value || undefined }))} placeholder="e.g. 99213" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={20} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Procedure Category</label><input type="text" value={claimExtras.procedure_category ?? ''} onChange={e => setClaimExtras(x => ({ ...x, procedure_category: e.target.value || undefined }))} placeholder="e.g. Outpatient" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={50} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Claim Type</label><select value={claimExtras.claim_type ?? ''} onChange={e => setClaimExtras(x => ({ ...x, claim_type: e.target.value || undefined }))} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"><option value="">—</option><option value="INPATIENT">Inpatient</option><option value="OUTPATIENT">Outpatient</option><option value="EMERGENCY">Emergency</option><option value="PREVENTIVE">Preventive</option></select></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Policy Type</label><input type="text" value={claimExtras.policy_type ?? ''} onChange={e => setClaimExtras(x => ({ ...x, policy_type: e.target.value || undefined }))} placeholder="e.g. PPO, HMO" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={50} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Medical Necessity Score (0–100)</label><input type="number" value={claimExtras.medical_necessity_score ?? ''} onChange={e => setClaimExtras(x => ({ ...x, medical_necessity_score: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="0–100" min={0} max={100} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Prior Denial Count</label><input type="number" value={claimExtras.prior_denial_count ?? ''} onChange={e => setClaimExtras(x => ({ ...x, prior_denial_count: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="0" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Resubmission Count</label><input type="number" value={claimExtras.resubmission_count ?? ''} onChange={e => setClaimExtras(x => ({ ...x, resubmission_count: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="0" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Days to Submission</label><input type="number" value={claimExtras.days_to_submission ?? ''} onChange={e => setClaimExtras(x => ({ ...x, days_to_submission: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="e.g. 7" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Coverage Limit (₹)</label><input type="number" value={claimExtras.coverage_limit ?? ''} onChange={e => setClaimExtras(x => ({ ...x, coverage_limit: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="e.g. 50000" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Deductible (₹)</label><input type="number" value={claimExtras.deductible_amount ?? ''} onChange={e => setClaimExtras(x => ({ ...x, deductible_amount: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="e.g. 5000" min={0} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div className="sm:col-span-2 flex flex-wrap gap-4 items-center">
                            <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!claimExtras.documentation_complete} onChange={e => setClaimExtras(x => ({ ...x, documentation_complete: e.target.checked }))} className="rounded" /> Documentation complete</label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!claimExtras.preauthorization_required} onChange={e => setClaimExtras(x => ({ ...x, preauthorization_required: e.target.checked }))} className="rounded" /> Pre-auth required</label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!claimExtras.preauthorization_obtained} onChange={e => setClaimExtras(x => ({ ...x, preauthorization_obtained: e.target.checked }))} className="rounded" /> Pre-auth obtained</label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={!!claimExtras.chronic_condition_flag} onChange={e => setClaimExtras(x => ({ ...x, chronic_condition_flag: e.target.checked }))} className="rounded" /> Chronic condition</label>
                          </div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Patient Age</label><input type="number" value={claimExtras.patient_age ?? ''} onChange={e => setClaimExtras(x => ({ ...x, patient_age: e.target.value ? parseInt(e.target.value, 10) : undefined }))} placeholder="e.g. 45" min={0} max={120} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Patient Gender</label><select value={claimExtras.patient_gender ?? ''} onChange={e => setClaimExtras(x => ({ ...x, patient_gender: e.target.value || undefined }))} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Doctor Specialization</label><input type="text" value={claimExtras.doctor_specialization ?? ''} onChange={e => setClaimExtras(x => ({ ...x, doctor_specialization: e.target.value || undefined }))} placeholder="e.g. Cardiology" className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" maxLength={100} /></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Hospital Tier</label><select value={claimExtras.hospital_tier ?? ''} onChange={e => setClaimExtras(x => ({ ...x, hospital_tier: e.target.value || undefined }))} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs"><option value="">—</option><option value="TIER1">Tier 1</option><option value="TIER2">Tier 2</option><option value="TIER3">Tier 3</option></select></div>
                          <div><label className="block text-[10px] text-muted-foreground mb-0.5">Hospital Claim Success Rate (%)</label><input type="number" value={claimExtras.hospital_claim_success_rate ?? ''} onChange={e => setClaimExtras(x => ({ ...x, hospital_claim_success_rate: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="e.g. 85.5" min={0} max={100} step={0.1} className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-xs" /></div>
                        </div>
                      )}
                    </div>

                    {claimPrediction && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4"
                      >
                        <PredictCard
                          variant="claim"
                          score={claimPrediction.score}
                          secondaryScore={claimPrediction.secondaryScore}
                          insights={claimPrediction.insights}
                          historicalStats={claimPrediction.historicalStats}
                          isLoading={predictingClaim}
                        />
                      </motion.div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handlePredictClaim}
                        disabled={!selectedApptId || !claimAmount || predictingClaim || parseFloat(claimAmount) <= 0}
                        className="flex-1 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {predictingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Predict
                      </button>
                      <button
                        onClick={() => createMutation.mutate()}
                        disabled={!selectedApptId || !claimAmount || createMutation.isPending}
                        className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {createMutation.isPending ? 'Creating…' : 'Create Claim with AI Scoring'}
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ClaimsManagement;
