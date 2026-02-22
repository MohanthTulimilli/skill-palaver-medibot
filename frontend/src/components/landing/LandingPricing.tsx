import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { CountUp } from './CountUp';

const PLANS = [
  {
    name: 'Starter',
    price: 27209,
    period: '/month',
    priceCustom: null as string | null,
    desc: 'For small practices getting started with AI-powered RCM.',
    features: ['Up to 500 claims/month', 'Basic AI denial prediction', '2 user seats', 'Email support', 'Standard analytics'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: 72709,
    period: '/month',
    priceCustom: null as string | null,
    desc: 'For growing organizations that need full automation.',
    features: ['Up to 5,000 claims/month', 'Advanced AI + automation bots', '10 user seats', 'Priority support', 'Real-time analytics & API', 'Custom workflows'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    period: '',
    priceCustom: 'Custom',
    desc: 'For large health systems with complex needs.',
    features: ['Unlimited claims', 'Full AI suite + custom models', 'Unlimited users', 'Dedicated success manager', 'SLA & on-prem options', 'HIPAA BAA included'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const LandingPricing: React.FC = () => {
  return (
    <section id="pricing" className="relative z-10 py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-3"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground"
          >
            Plans That Scale With You
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground mt-3 max-w-md mx-auto"
          >
            Start free, upgrade when you're ready. No hidden fees.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: plan.popular ? -8 : -4 }}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-card/90 backdrop-blur-xl border-2 border-primary/40 shadow-xl shadow-primary/10 ring-2 ring-primary/20'
                  : 'landing-card p-8'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 btn-glow">
                    <Star className="w-3.5 h-3.5" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-foreground">
                  {plan.priceCustom != null ? (
                    plan.priceCustom
                  ) : (
                    <CountUp value={plan.price} prefix="₹" useLocale duration={1800} />
                  )}
                </span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + j * 0.05 }}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + j * 0.05, type: 'spring' }}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-success" />
                    </motion.span>
                    {f}
                  </motion.li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  plan.popular
                    ? 'gradient-primary text-primary-foreground btn-glow'
                    : 'border border-border text-foreground hover:bg-muted/60 hover:border-primary/30'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
