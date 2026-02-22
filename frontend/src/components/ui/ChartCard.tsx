import React from 'react';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  filter?: React.ReactNode;
  aiGlow?: boolean;
  index?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, filter, aiGlow, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
    className={`kpi-card ${aiGlow ? 'kpi-card-ai' : ''}`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-foreground font-heading">{title}</h3>
      {filter}
    </div>
    {children}
  </motion.div>
);

export default ChartCard;
