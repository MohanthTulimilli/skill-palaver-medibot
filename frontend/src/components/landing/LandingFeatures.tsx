import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Bot, BarChart3, Shield, Zap, Activity } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Claim Analysis',
    desc: 'Predict denial risks before submission with 97%+ accuracy using deep learning models trained on millions of claims.',
    color: 'from-primary to-secondary',
  },
  {
    icon: Bot,
    title: 'Automated Workflows',
    desc: 'Intelligent bots handle claim scrubbing, eligibility checks, and prior authorizations — reducing manual work by 80%.',
    color: 'from-secondary to-accent',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Live dashboards with KPI tracking, denial patterns, payer performance, and revenue forecasting at a glance.',
    color: 'from-accent to-success',
  },
  {
    icon: Shield,
    title: 'HIPAA & SOC 2 Ready',
    desc: 'Enterprise-grade security with end-to-end encryption, audit trails, and role-based access controls built in.',
    color: 'from-primary to-accent',
  },
  {
    icon: Zap,
    title: 'Smart Patient Portal',
    desc: 'Self-service portal for patients to view claims, make payments, and track reimbursements in real time.',
    color: 'from-warning to-secondary',
  },
  {
    icon: Activity,
    title: 'Multi-Payer Integration',
    desc: 'Seamless connectivity with all major payers including Blue Cross, Aetna, United Health, Cigna, and Humana.',
    color: 'from-secondary to-primary',
  },
];

export const LandingFeatures: React.FC = () => {
  return (
    <section id="features" className="relative z-10 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-3"
          >
            Platform Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground"
          >
            Everything You Need to Optimize
            <br />
            <span className="gradient-text-animated">Healthcare Revenue</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group landing-card p-6 hover:border-primary/30"
            >
              <motion.div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}
                whileHover={{ rotate: 3 }}
              >
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
