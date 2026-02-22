import { User, UserRole } from '@/types';

// Legacy mock service - not used with Supabase auth, kept for reference only
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@medibots.com': { password: 'admin123', user: { id: '1', email: 'admin@medibots.com', name: 'Super Admin', role: UserRole.SUPER_ADMIN } },
  'billing@medibots.com': { password: 'billing123', user: { id: '2', email: 'billing@medibots.com', name: 'Jane Billing', role: UserRole.BILLING } },
  'analyst@medibots.com': { password: 'analyst123', user: { id: '3', email: 'analyst@medibots.com', name: 'Alex Analyst', role: UserRole.AI_ANALYST } },
  'insurance@medibots.com': { password: 'insurance123', user: { id: '4', email: 'insurance@medibots.com', name: 'Tom Insurance', role: UserRole.INSURANCE } },
  'patient@medibots.com': { password: 'patient123', user: { id: '5', email: 'patient@medibots.com', name: 'Sarah Patient', role: UserRole.PATIENT } },
};

export const authService = {
  login: (email: string, password: string, _role: UserRole): Promise<{ user: User; token: string }> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const record = MOCK_USERS[email];
        if (record && record.password === password) {
          resolve({ user: { ...record.user, role: _role }, token: 'mock-jwt-token-' + Date.now() });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    }),

  forgotPassword: (email: string): Promise<{ message: string }> =>
    new Promise((resolve) => {
      setTimeout(() => resolve({ message: `Password reset link sent to ${email}` }), 600);
    }),
};
