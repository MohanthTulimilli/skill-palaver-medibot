import { Claim, Patient, Invoice, AIBotActivity, Notification, ChartDataPoint } from '@/types';

export const mockClaims: Claim[] = [
  { id: 'CLM-001', patientName: 'Sarah Johnson', patientId: 'P-101', insuranceProvider: 'Blue Cross', amount: 4500, aiRiskScore: 12, status: 'approved', dateSubmitted: '2026-02-05', cptCode: '99213', diagnosis: 'Type 2 Diabetes', aiExplanation: 'Low risk – all documentation complete, matching prior approvals.' },
  { id: 'CLM-002', patientName: 'Michael Chen', patientId: 'P-102', insuranceProvider: 'Aetna', amount: 12800, aiRiskScore: 78, status: 'pending', dateSubmitted: '2026-02-06', cptCode: '27447', diagnosis: 'Knee Replacement', aiExplanation: 'High risk – prior auth missing, amount exceeds typical range by 22%.' },
  { id: 'CLM-003', patientName: 'Emily Davis', patientId: 'P-103', insuranceProvider: 'United Health', amount: 3200, aiRiskScore: 45, status: 'denied', dateSubmitted: '2026-02-04', cptCode: '99214', diagnosis: 'Hypertension', aiExplanation: 'Medium risk – coding mismatch detected between diagnosis and procedure.' },
  { id: 'CLM-004', patientName: 'Robert Wilson', patientId: 'P-104', insuranceProvider: 'Cigna', amount: 8900, aiRiskScore: 8, status: 'approved', dateSubmitted: '2026-02-07', cptCode: '43239', diagnosis: 'GERD', aiExplanation: 'Low risk – standard procedure, all documentation verified.' },
  { id: 'CLM-005', patientName: 'Lisa Martinez', patientId: 'P-105', insuranceProvider: 'Humana', amount: 6700, aiRiskScore: 62, status: 'pending', dateSubmitted: '2026-02-08', cptCode: '29881', diagnosis: 'Meniscus Tear', aiExplanation: 'Elevated risk – prior treatment records incomplete.' },
  { id: 'CLM-006', patientName: 'James Thompson', patientId: 'P-106', insuranceProvider: 'Blue Cross', amount: 2100, aiRiskScore: 15, status: 'approved', dateSubmitted: '2026-02-03', cptCode: '99212', diagnosis: 'Annual Checkup', aiExplanation: 'Low risk – routine visit, fully documented.' },
  { id: 'CLM-007', patientName: 'Amanda Lee', patientId: 'P-107', insuranceProvider: 'Aetna', amount: 15600, aiRiskScore: 88, status: 'denied', dateSubmitted: '2026-02-02', cptCode: '33533', diagnosis: 'Coronary Bypass', aiExplanation: 'High risk – incomplete pre-authorization, bundling issues detected.' },
  { id: 'CLM-008', patientName: 'David Brown', patientId: 'P-108', insuranceProvider: 'United Health', amount: 5400, aiRiskScore: 30, status: 'approved', dateSubmitted: '2026-02-09', cptCode: '99215', diagnosis: 'Chronic Pain Management', aiExplanation: 'Low-medium risk – documentation sufficient, within normal billing range.' },
];

export const mockPatients: Patient[] = [
  { id: 'P-101', fullName: 'Sarah Johnson', dob: '1985-03-15', gender: 'female', insuranceProvider: 'Blue Cross', policyNumber: 'BC-2024-78901', aiValidationStatus: 'validated', riskScore: 12, createdAt: '2026-01-10' },
  { id: 'P-102', fullName: 'Michael Chen', dob: '1972-07-22', gender: 'male', insuranceProvider: 'Aetna', policyNumber: 'AE-2024-45678', aiValidationStatus: 'flagged', riskScore: 78, createdAt: '2026-01-15' },
  { id: 'P-103', fullName: 'Emily Davis', dob: '1990-11-08', gender: 'female', insuranceProvider: 'United Health', policyNumber: 'UH-2024-12345', aiValidationStatus: 'pending', riskScore: 45, createdAt: '2026-01-20' },
  { id: 'P-104', fullName: 'Robert Wilson', dob: '1968-05-30', gender: 'male', insuranceProvider: 'Cigna', policyNumber: 'CG-2024-67890', aiValidationStatus: 'validated', riskScore: 8, createdAt: '2026-01-25' },
];

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', patientName: 'Sarah Johnson', amount: 4500, status: 'paid', dueDate: '2026-02-15', issuedDate: '2026-01-15', items: [{ description: 'Office Visit – 99213', amount: 250 }, { description: 'Lab Work', amount: 4250 }] },
  { id: 'INV-002', patientName: 'Michael Chen', amount: 12800, status: 'pending', dueDate: '2026-02-20', issuedDate: '2026-01-20', items: [{ description: 'Surgical Procedure – 27447', amount: 10800 }, { description: 'Anesthesia', amount: 2000 }] },
  { id: 'INV-003', patientName: 'Emily Davis', amount: 3200, status: 'overdue', dueDate: '2026-01-30', issuedDate: '2025-12-30', items: [{ description: 'Consultation – 99214', amount: 350 }, { description: 'Medication', amount: 2850 }] },
  { id: 'INV-004', patientName: 'Robert Wilson', amount: 8900, status: 'paid', dueDate: '2026-02-10', issuedDate: '2026-01-10', items: [{ description: 'Endoscopy – 43239', amount: 7500 }, { description: 'Facility Fee', amount: 1400 }] },
];

export const mockBotActivities: AIBotActivity[] = [
  { id: 'BOT-1', botName: 'ClaimBot Alpha', action: 'Verified documentation for CLM-001', claimId: 'CLM-001', confidence: 97, timestamp: '2026-02-10T09:15:00', status: 'completed' },
  { id: 'BOT-2', botName: 'RiskAnalyzer', action: 'Flagged CLM-007 for manual review', claimId: 'CLM-007', confidence: 92, timestamp: '2026-02-10T09:12:00', status: 'flagged' },
  { id: 'BOT-3', botName: 'CodingAssist', action: 'Validating CPT codes for CLM-005', claimId: 'CLM-005', confidence: 85, timestamp: '2026-02-10T09:10:00', status: 'processing' },
  { id: 'BOT-4', botName: 'DenialPredictor', action: 'Predicted approval for CLM-008', claimId: 'CLM-008', confidence: 94, timestamp: '2026-02-10T09:08:00', status: 'completed' },
  { id: 'BOT-5', botName: 'ClaimBot Alpha', action: 'Auto-submitted CLM-004 to payer', claimId: 'CLM-004', confidence: 99, timestamp: '2026-02-10T09:05:00', status: 'completed' },
];

export const mockNotifications: Notification[] = [
  { id: 'N-1', title: 'Claim Denied', message: 'CLM-007 was denied by Aetna. Review required.', type: 'error', read: false, timestamp: '2026-02-10T09:00:00' },
  { id: 'N-2', title: 'AI Alert', message: 'Risk score spike detected for patient P-102.', type: 'warning', read: false, timestamp: '2026-02-10T08:45:00' },
  { id: 'N-3', title: 'Payment Received', message: 'INV-001 payment of $4,500 received.', type: 'success', read: true, timestamp: '2026-02-10T08:30:00' },
];

export const claimsPerDay: ChartDataPoint[] = [
  { name: 'Mon', value: 42 }, { name: 'Tue', value: 58 }, { name: 'Wed', value: 45 },
  { name: 'Thu', value: 67 }, { name: 'Fri', value: 53 }, { name: 'Sat', value: 24 }, { name: 'Sun', value: 18 },
];

export const revenueTrend: ChartDataPoint[] = [
  { name: 'Jan', value: 285000 }, { name: 'Feb', value: 310000 }, { name: 'Mar', value: 298000 },
  { name: 'Apr', value: 342000 }, { name: 'May', value: 365000 }, { name: 'Jun', value: 390000 },
  { name: 'Jul', value: 378000 }, { name: 'Aug', value: 412000 }, { name: 'Sep', value: 435000 },
  { name: 'Oct', value: 420000 }, { name: 'Nov', value: 458000 }, { name: 'Dec', value: 480000 },
];

export const denialDistribution = [
  { name: 'Coding Errors', value: 35 }, { name: 'Missing Auth', value: 25 },
  { name: 'Eligibility', value: 20 }, { name: 'Duplicate', value: 12 }, { name: 'Other', value: 8 },
];

export const claimsByPayer = [
  { name: 'Blue Cross', value: 145 }, { name: 'Aetna', value: 112 },
  { name: 'United Health', value: 98 }, { name: 'Cigna', value: 76 }, { name: 'Humana', value: 64 },
];

export const monthlyRevenue: ChartDataPoint[] = revenueTrend;

export const aiPerformance = [
  { name: 'Jan', accuracy: 91, automation: 72, value: 91 }, { name: 'Feb', accuracy: 92, automation: 75, value: 92 },
  { name: 'Mar', accuracy: 93, automation: 78, value: 93 }, { name: 'Apr', accuracy: 94, automation: 80, value: 94 },
  { name: 'May', accuracy: 94.5, automation: 82, value: 94.5 }, { name: 'Jun', accuracy: 95, automation: 85, value: 95 },
];
