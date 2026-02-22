import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, ChevronRight, Shield } from 'lucide-react';
import { CountUp } from './CountUp';
import { landingService, type LandingStats } from '@/services/landingService';

const TRUST_BADGES = ['HIPAA Compliant', 'SOC 2 Certified', '99.9% Uptime'];

const DEFAULT_STATS: LandingStats = {
  totalClaims: 12847,
  denialRate: 4.2,
  revenueCollected: 218000000, // 21.8 Cr
  aiAccuracy: 97.8,
  claimsTrend: [40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 88],
};

function formatRevenue(revenue: number): { value: number; prefix: string; suffix: string; decimals: number; useLocale: boolean } {
  if (revenue >= 1e7) return { value: revenue / 1e7, prefix: '₹', suffix: ' Cr', decimals: 1, useLocale: false };
  if (revenue >= 1e5) return { value: revenue / 1e5, prefix: '₹', suffix: ' Lakh', decimals: 1, useLocale: false };
  return { value: revenue, prefix: '₹', suffix: '', decimals: 0, useLocale: true };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const LandingHero: React.FC = () => {
  const [stats, setStats] = useState<LandingStats>(DEFAULT_STATS);

  useEffect(() => {
    landingService.getStats().then(setStats).catch(() => {});
  }, []);

  const rev = formatRevenue(stats.revenueCollected);
  const aiPct = stats.aiAccuracy > 0 ? stats.aiAccuracy : 85;

  const desktopCards = [
    { label: 'Total Claims', value: stats.totalClaims, prefix: '', suffix: '', decimals: 0, useLocale: true, color: 'from-primary to-secondary' as const },
    { label: 'Revenue', ...rev, color: 'from-secondary to-accent' as const },
    { label: 'Denial Rate', value: stats.denialRate, prefix: '', suffix: '%', decimals: 1, useLocale: false, color: 'from-warning to-destructive' as const },
    { label: 'AI Accuracy', value: stats.aiAccuracy, prefix: '', suffix: '%', decimals: 1, useLocale: false, color: 'from-primary to-accent' as const },
  ];

  return (
    <section id="hero" className="relative z-10 min-h-[90vh] flex items-center pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.08] border border-primary/15 text-primary text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" /> AI-Powered Revenue Automation
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight"
            >
              Transform Healthcare{' '}
              <br />
              <span className="gradient-text-animated">Revenue Operations</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-lg sm:text-xl text-muted-foreground mt-6 leading-relaxed"
            >
              Reduce claim denials by 40%, automate billing workflows, and unlock real-time AI insights — all in one enterprise-grade platform built for modern healthcare.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-10">
              <Link
                to="/signup"
                className="btn-glow gradient-primary text-primary-foreground px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/60 hover:border-primary/30 transition-all"
              >
                See How It Works <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
              {TRUST_BADGES.map((badge) => (
                <span key={badge} className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success flex-shrink-0" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Floating dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/[0.08] rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/[0.06] rounded-full blur-2xl" />
            </div>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/60 shadow-2xl p-2 overflow-hidden ring-1 ring-white/5">
                <div className="bg-muted/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-destructive/70" />
                    <div className="w-3 h-3 rounded-full bg-warning/70" />
                    <div className="w-3 h-3 rounded-full bg-success/70" />
                    <span className="text-xs text-muted-foreground ml-2 font-mono">dashboard.medibots.io</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {desktopCards.map((card) => (
                      <div key={card.label} className="bg-card/90 rounded-xl border border-border/40 p-4 shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{card.label}</p>
                        <p className={`text-xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                          <CountUp value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={card.decimals} useLocale={card.useLocale} duration={1200} />
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card/90 rounded-xl border border-border/40 p-4 h-32">
                      <p className="text-[10px] text-muted-foreground mb-3 font-medium">Claims Trend</p>
                      <div className="flex items-end gap-1 h-16">
                        {stats.claimsTrend.map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 0.6 + i * 0.03, duration: 0.5 }}
                            className="flex-1 rounded-t-sm gradient-primary"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-card/90 rounded-xl border border-border/40 p-4 h-32">
                      <p className="text-[10px] text-muted-foreground mb-3 font-medium">AI Processing</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="relative w-16 h-16">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                            <motion.circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="url(#heroGrad)"
                              strokeWidth="3"
                              strokeDasharray={`${aiPct} 100`}
                              strokeLinecap="round"
                              initial={{ strokeDasharray: '0 100' }}
                              animate={{ strokeDasharray: `${aiPct} 100` }}
                              transition={{ delay: 0.8, duration: 1 }}
                            />
                            <defs>
                              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                <stop offset="100%" stopColor="hsl(var(--secondary))" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                            <CountUp value={aiPct} suffix="%" duration={1200} />
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>4/5 bots active</p>
                          <p className="text-success font-medium">All systems nominal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile mockup fallback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:hidden mt-8"
          >
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Claims', value: stats.totalClaims, suffix: ' Claims', useLocale: true, prefix: '', decimals: 0 },
                  { label: 'Revenue', ...rev, suffix: rev.suffix ? `${rev.suffix} Revenue` : ' Revenue' },
                  { label: 'Denials', value: stats.denialRate, suffix: '% Denials', decimals: 1, prefix: '', useLocale: false },
                  { label: 'AI', value: stats.aiAccuracy, suffix: '% AI', decimals: 1, prefix: '', useLocale: false },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-foreground">
                      <CountUp value={item.value} prefix={item.prefix ?? ''} suffix={item.suffix ?? ''} decimals={item.decimals ?? 0} useLocale={item.useLocale ?? false} duration={1200} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
