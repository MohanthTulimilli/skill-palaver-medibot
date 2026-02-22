import React from 'react';
import { motion } from 'framer-motion';

export const AuthCinematicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Light rays from top right */}
      <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1] auth-parallax-slow">
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full"
          style={{
            background: `
              conic-gradient(from 220deg at 85% 15%, 
                transparent 0deg,
                hsl(var(--primary) / 0.08) 15deg,
                transparent 35deg,
                hsl(var(--secondary) / 0.05) 55deg,
                transparent 75deg
              )
            `,
          }}
        />
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full"
          style={{
            background: `linear-gradient(135deg, transparent 40%, hsl(var(--primary) / 0.06) 60%, transparent 80%)`,
          }}
        />
      </div>

      {/* Blurred hospital corridor silhouette (SVG) */}
      <motion.div
        className="absolute inset-0 flex items-end justify-center opacity-[0.35] dark:opacity-[0.25] auth-parallax-corridor"
        animate={{ x: [0, 6, 0], y: [0, 4, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-cover object-bottom"
          preserveAspectRatio="xMidYMax slice"
          style={{ filter: 'blur(60px)' }}
        >
          <defs>
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.03" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="corridorWalls" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Corridor perspective - floor */}
          <path d="M0 600 L800 600 L750 200 L50 200 Z" fill="url(#corridorGrad)" />
          {/* Left wall */}
          <path d="M0 600 L50 200 L50 100 L0 100 Z" fill="url(#corridorWalls)" opacity="0.5" />
          {/* Right wall */}
          <path d="M800 600 L750 200 L750 100 L800 100 Z" fill="url(#corridorWalls)" opacity="0.5" />
          {/* Door silhouettes */}
          <rect x="200" y="250" width="80" height="200" rx="4" fill="hsl(var(--foreground))" fillOpacity="0.04" />
          <rect x="400" y="220" width="80" height="230" rx="4" fill="hsl(var(--foreground))" fillOpacity="0.05" />
          <rect x="580" y="280" width="80" height="170" rx="4" fill="hsl(var(--foreground))" fillOpacity="0.03" />
        </svg>
      </motion.div>

      {/* AI holographic dashboard overlay */}
      <motion.div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.3] auth-parallax-overlay"
        animate={{ x: [0, -5, 0], y: [0, -3, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-[20%] left-[15%] w-32 h-20 rounded-lg border border-primary/10 bg-primary/5 backdrop-blur-sm" />
        <div className="absolute top-[35%] right-[20%] w-28 h-16 rounded-lg border border-secondary/10 bg-secondary/5 backdrop-blur-sm" />
        <div className="absolute bottom-[25%] left-[25%] w-24 h-24 rounded-lg border border-accent/10 bg-accent/5 backdrop-blur-sm" />
        <div className="absolute bottom-[30%] right-[30%] w-36 h-14 rounded-lg border border-primary/10 bg-primary/5 backdrop-blur-sm" />
      </motion.div>

      {/* Floating data points */}
      {[
        { x: '12%', y: '20%', size: 4, delay: 0 },
        { x: '25%', y: '35%', size: 6, delay: 0.5 },
        { x: '75%', y: '25%', size: 5, delay: 1 },
        { x: '88%', y: '45%', size: 3, delay: 0.3 },
        { x: '35%', y: '60%', size: 4, delay: 0.8 },
        { x: '60%', y: '55%', size: 5, delay: 0.2 },
        { x: '50%', y: '18%', size: 3, delay: 1.2 },
        { x: '18%', y: '75%', size: 4, delay: 0.6 },
        { x: '82%', y: '70%', size: 3, delay: 0.4 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/30 dark:bg-primary/40"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Soft gradient orbs (existing style, enhanced) */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 dark:bg-primary/6 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/8 dark:bg-accent/6 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary/5 dark:bg-secondary/4 blur-3xl" />
    </div>
  );
};
