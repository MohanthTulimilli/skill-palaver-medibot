import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Bot, Sparkles } from 'lucide-react';
import { CountUp } from './CountUp';

const METRICS = [
  {
    value: 40,
    suffix: '%',
    label: 'Fewer Denials',
    sub: 'Average reduction in claim denials',
    icon: TrendingDown,
    color: 'from-primary to-secondary',
  },
  {
    value: 80,
    suffix: '%',
    label: 'Automation',
    sub: 'Manual work eliminated by AI bots',
    icon: Bot,
    color: 'from-secondary to-accent',
  },
  {
    value: 97,
    suffix: '%',
    label: 'AI Accuracy',
    sub: 'Prediction accuracy on denial risk',
    icon: Sparkles,
    color: 'from-accent to-success',
  },
];

export const LandingMetrics: React.FC = () => {
  return (
    <section className="relative z-10 py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="landing-card p-8 text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} mb-6`}>
                <m.icon className="w-7 h-7 text-primary-foreground" aria-hidden />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl lg:text-6xl font-extrabold"
              >
                <span className={`bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>
                  <CountUp value={m.value} suffix={m.suffix} duration={1500} />
                </span>
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mt-2">{m.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
