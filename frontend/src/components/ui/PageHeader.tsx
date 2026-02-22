import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  gradient?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, gradient = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={gradient
      ? 'relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground'
      : ''
    }
  >
    {gradient && (
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1z' fill='white' fill-opacity='0.3'/%3E%3Cpath d='M0 0v1h40V0zM0 40v1h40v-1z' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px',
      }} />
    )}
    <div className={gradient ? 'relative' : ''}>
      <h1 className={`text-2xl font-bold font-heading ${gradient ? 'text-primary-foreground' : 'text-foreground'}`}>
        {title}
      </h1>
      {description && (
        <p className={`text-sm mt-1 ${gradient ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
          {description}
        </p>
      )}
    </div>
  </motion.div>
);

export default PageHeader;
