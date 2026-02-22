import React from 'react';
import { motion } from 'framer-motion';
import { mockBotActivities } from '@/services/mockData';
import { Activity, Bot } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

const AutomationLogs: React.FC = () => (
  <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automation Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Detailed logs of AI bot actions and decisions</p>
      </div>
      <div className="table-container">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary animate-pulse-soft" />
          <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Bot</th>
                <th>Action</th>
                <th>Claim</th>
                <th>Confidence</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBotActivities.map((bot, i) => (
                <motion.tr key={bot.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />{bot.botName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">{bot.claimId}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{bot.confidence}%</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(bot.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${bot.status === 'completed' ? 'status-approved' : bot.status === 'processing' ? 'status-pending' : 'status-denied'}`}>
                      {bot.status}
                    </span>
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

export default AutomationLogs;
