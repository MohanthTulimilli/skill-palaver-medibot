import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  change?: string;
  icon: LucideIcon;
  glow?: boolean;
  index?: number;
  className?: string;
  valueColor?: 'default' | 'success' | 'destructive' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, icon: Icon, glow, index = 0, className, valueColor = 'default' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ y: -2 }}
    className={cn(
      'kpi-card group',
      glow && 'kpi-card-ai ai-glow animate-glow-pulse',
      className
    )}
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
    </div>
    <p className={cn(
      'text-2xl font-bold font-heading',
      valueColor === 'success' && 'text-success',
      valueColor === 'destructive' && 'text-destructive',
      valueColor === 'warning' && 'text-warning',
      valueColor === 'default' && 'text-foreground'
    )}>
      {value}
    </p>
    {change && (
      <span className={cn(
        'text-xs font-semibold mt-1 inline-block',
        change.startsWith('+') ? 'text-success' : 'text-destructive'
      )}>
        {change} vs last month
      </span>
    )}
  </motion.div>
);

export default StatCard;
