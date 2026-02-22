import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = BarChart3,
  title,
  description = 'Data will appear here once available.',
  action,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className
    )}
  >
    <div className="w-16 h-16 rounded-2xl gradient-primary/10 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-primary/60" />
    </div>
    <h3 className="text-base font-semibold text-foreground font-heading mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
    {action}
  </motion.div>
);

export default EmptyState;
