import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

interface AIProcessingLoaderProps {
  message?: string;
  onComplete?: (finalValue: number) => void;
  finalValue?: number;
  duration?: number;
  variant?: 'inline' | 'card' | 'full';
}

export const AIProcessingLoader: React.FC<AIProcessingLoaderProps> = ({
  message = 'Analyzing with ML model…',
  onComplete,
  finalValue = 0,
  duration = 1.8,
  variant = 'inline',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (finalValue <= 0) {
      setDisplayValue(0);
      setDone(true);
      onComplete?.(0);
      return;
    }
    const controls = animate(0, finalValue, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
      onComplete: () => {
        setDone(true);
        onComplete?.(finalValue);
      },
    });
    return () => controls.stop();
  }, [finalValue, duration, onComplete]);

  if (variant === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-400 mb-6"
        />
        <p className="text-white/80 font-medium">{message}</p>
        {finalValue > 0 && (
          <motion.span
            key={displayValue}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-blue-400 mt-2 tabular-nums"
          >
            {displayValue}%
          </motion.span>
        )}
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 flex-shrink-0"
        />
        <div>
          <p className="text-sm text-white/80">{message}</p>
          {finalValue > 0 && (
            <motion.span
              key={displayValue}
              className="text-lg font-bold text-blue-400 tabular-nums"
            >
              {displayValue}%
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-2 text-sm text-white/70"
    >
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <Brain className="w-4 h-4 text-blue-400" />
      </motion.span>
      <span>{message}</span>
      {finalValue > 0 && !done && (
        <motion.span
          key={displayValue}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="font-bold text-blue-400 tabular-nums"
        >
          {displayValue}%
        </motion.span>
      )}
    </motion.span>
  );
};
