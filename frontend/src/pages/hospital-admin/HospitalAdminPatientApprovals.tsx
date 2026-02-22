import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Loader2, Check, X, FileImage, Shield, User, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/layout/PageTransition';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPendingPatients,
  fetchPatientById,
  approvePatient,
  rejectPatient,
  fetchDocumentAsObjectUrl,
} from '@/services/dataService';

interface PendingPatient {
  id: string;
  userId?: string;
  user_id?: string;
  fullName?: string;
  full_name?: string;
  dob: string;
  gender: string;
  insuranceProvider?: string;
  insurance_provider?: string;
  policyNumber?: string;
  policy_number?: string;
  photoIdPath?: string | null;
  photo_id_path?: string | null;
  insuranceCardPath?: string | null;
  insurance_card_path?: string | null;
  validationReportJson?: string | null;
  validation_report_json?: string | null;
  onboardingStatus?: string;
  onboarding_status?: string;
  createdAt?: string;
  created_at: string;
}

interface ValidationReport {
  documentVerification?: string;
  documentVerificationReason?: string;
  insuranceEligibility?: string;
  insuranceEligibilityReason?: string;
  riskAssessment?: string;
  riskAssessmentReason?: string;
  confidence?: number;
  allPassed?: boolean;
}

const HospitalAdminPatientApprovals: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PendingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingPatient | null>(null);
  const [detail, setDetail] = useState<PendingPatient | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [insuranceUrl, setInsuranceUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchPendingPatients();
      setPatients(Array.isArray(list) ? list : []);
    } catch {
      setPatients([]);
      toast({ title: 'Failed to load pending patients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (p: PendingPatient) => {
    setSelected(p);
    setDetail(null);
    setPhotoUrl(null);
    setInsuranceUrl(null);
    try {
      const d = await fetchPatientById(p.id);
      setDetail(d);
      const urls: string[] = [];
      const photoPath = d.photoIdPath ?? d.photo_id_path;
      const insPath = d.insuranceCardPath ?? d.insurance_card_path;
      if (photoPath) {
        const u = await fetchDocumentAsObjectUrl(photoPath);
        setPhotoUrl(u);
        urls.push(u);
      }
      if (insPath) {
        const u = await fetchDocumentAsObjectUrl(insPath);
        setInsuranceUrl(u);
        urls.push(u);
      }
      return () => urls.forEach(URL.revokeObjectURL);
    } catch {
      toast({ title: 'Failed to load patient details', variant: 'destructive' });
    }
  };

  const closeDetail = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (insuranceUrl) URL.revokeObjectURL(insuranceUrl);
    setPhotoUrl(null);
    setInsuranceUrl(null);
    setSelected(null);
    setDetail(null);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await approvePatient(selected.id);
      toast({ title: 'Approved', description: `${selected.fullName ?? selected.full_name} has been approved.` });
      closeDetail();
      fetchList();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Approval failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await rejectPatient(selected.id);
      toast({ title: 'Rejected', description: `${selected.fullName ?? selected.full_name} has been rejected.` });
      closeDetail();
      fetchList();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Rejection failed', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const report: ValidationReport | null = (() => {
    const raw = detail?.validationReportJson ?? detail?.validation_report_json;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  })();

  const getStatusClass = (s: string) => {
    const x = (s || '').toLowerCase();
    if (x === 'passed' || x === 'verified' || x === 'low') return 'status-approved';
    if (x === 'review' || x === 'medium') return 'status-pending';
    return 'status-denied';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Onboarding Approvals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review documents and AI validation for {user?.hospitalName || 'your hospital'}
          </p>
        </div>

        {loading ? (
          <div className="kpi-card flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="kpi-card text-center py-16">
            <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">No pending approvals</p>
            <p className="text-muted-foreground text-sm mt-1">All patient applications have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="kpi-card flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => openDetail(p)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{p.fullName || p.full_name || '—'}</p>
                    <p className="text-sm text-muted-foreground">
                      {(p.insuranceProvider ?? p.insurance_provider) || '—'} • {(p.policyNumber ?? p.policy_number) || '—'} • {new Date(p.created_at ?? p.createdAt ?? '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={closeDetail}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h2 className="text-xl font-bold text-foreground">Review Application</h2>
                    <button onClick={closeDetail} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {detail && (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Name</span><p className="font-medium text-foreground">{(detail.fullName ?? detail.full_name) || '—'}</p></div>
                        <div><span className="text-muted-foreground">DOB</span><p className="font-medium text-foreground">{detail.dob || '—'}</p></div>
                        <div><span className="text-muted-foreground">Gender</span><p className="font-medium text-foreground">{detail.gender || '—'}</p></div>
                        <div><span className="text-muted-foreground">Insurance</span><p className="font-medium text-foreground">{(detail.insuranceProvider ?? detail.insurance_provider) || '—'}</p></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Policy</span><p className="font-medium text-foreground">{(detail.policyNumber ?? detail.policy_number) || '—'}</p></div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileImage className="w-4 h-4" /> Documents</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Photo ID</p>
                            {photoUrl ? (
                              <img src={photoUrl} alt="Photo ID" className="w-full h-32 object-contain rounded-lg border border-border bg-muted/30" />
                            ) : (detail.photoIdPath ?? detail.photo_id_path) ? (
                              <div className="w-full h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
                            ) : (
                              <div className="w-full h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">Not uploaded</div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Insurance Card</p>
                            {insuranceUrl ? (
                              <img src={insuranceUrl} alt="Insurance Card" className="w-full h-32 object-contain rounded-lg border border-border bg-muted/30" />
                            ) : (detail.insuranceCardPath ?? detail.insurance_card_path) ? (
                              <div className="w-full h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
                            ) : (
                              <div className="w-full h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">Not uploaded</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {report && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> AI Validation Report</h3>
                          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                            {[
                              { label: 'Document Verification', status: report.documentVerification, reason: report.documentVerificationReason },
                              { label: 'Insurance Eligibility', status: report.insuranceEligibility, reason: report.insuranceEligibilityReason },
                              { label: 'Risk Assessment', status: report.riskAssessment, reason: report.riskAssessmentReason },
                            ].map((item) => (
                              <div key={item.label}>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                                  <span className={`status-badge ${getStatusClass(item.status || '')}`}>{item.status || '—'}</span>
                                </div>
                                {item.reason && <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>}
                              </div>
                            ))}
                            {report.confidence != null && (
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">AI Confidence</span>
                                  <span className="font-semibold text-foreground">{report.confidence}%</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full gradient-primary rounded-full" style={{ width: `${report.confidence}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success/10 text-success hover:bg-success/20 font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default HospitalAdminPatientApprovals;
