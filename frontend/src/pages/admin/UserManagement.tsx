import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Plus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';
import PageTransition from '@/components/layout/PageTransition';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

const roleBadgeColor: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-primary/10 text-primary',
  [UserRole.HOSPITAL_ADMIN]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.BILLING]: 'bg-accent/10 text-accent',
  [UserRole.INSURANCE]: 'bg-secondary/10 text-secondary-foreground',
  [UserRole.AI_ANALYST]: 'bg-primary/10 text-primary',
  [UserRole.PATIENT]: 'bg-muted text-muted-foreground',
  [UserRole.DOCTOR]: 'bg-accent/10 text-accent',
};

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const profiles = await api<{ id: string; user_id: string; name: string; email: string; created_at: string; role: string }[]>('/api/profiles');
    setUsers(profiles.map(p => ({ ...p, role: (p.role || UserRole.PATIENT) as UserRole })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Users</h1>
          <p className="text-muted-foreground text-sm mt-1">System-wide user directory</p>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-primary-foreground">{u.name?.charAt(0) || '?'}</span>
                        </div>
                        {u.name || 'Unnamed'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${roleBadgeColor[u.role]}`}>{u.role.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserManagement;
