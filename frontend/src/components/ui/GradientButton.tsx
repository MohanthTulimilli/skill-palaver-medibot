import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClass = 'font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  const sizeClass = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  const variantClass = {
    primary: 'gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:opacity-95',
    outline: 'border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50',
    ghost: 'text-primary hover:bg-primary/10',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(baseClass, sizeClass[size], variantClass[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default GradientButton;
