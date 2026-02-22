export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
  BILLING = 'BILLING',
  INSURANCE = 'INSURANCE',
  AI_ANALYST = 'AI_ANALYST',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  hospitalId?: string;
  hospitalName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type ClaimStatus = 'approved' | 'pending' | 'denied';

export interface Claim {
  id: string;
  patientName: string;
  patientId: string;
  insuranceProvider: string;
  amount: number;
  aiRiskScore: number;
  status: ClaimStatus;
  dateSubmitted: string;
  cptCode: string;
  diagnosis: string;
  aiExplanation?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  insuranceProvider: string;
  policyNumber: string;
  aiValidationStatus: 'validated' | 'pending' | 'flagged';
  riskScore: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  issuedDate: string;
  items: { description: string; amount: number }[];
}

export interface KPIData {
  totalClaims: number;
  approvedClaims: number;
  denialRate: number;
  revenueCollected: number;
  aiAccuracy: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface AIBotActivity {
  id: string;
  botName: string;
  action: string;
  claimId: string;
  confidence: number;
  timestamp: string;
  status: 'completed' | 'processing' | 'flagged';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  timestamp: string;
}

export interface SidebarItem {
  title: string;
  path: string;
  icon: string;
}

export interface Hospital {
  id: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}
