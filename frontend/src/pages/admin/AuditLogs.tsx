import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, ScrollText } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

const AuditLogs: React.FC = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api<any[]>('/api/audit-logs'),
  });

  if (isLoading) {
    return <PageTransition><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ScrollText className="w-6 h-6" /> Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">System activity trail</p>
        </div>

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No audit logs yet</td></tr>
                ) : logs.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.user_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AuditLogs;
