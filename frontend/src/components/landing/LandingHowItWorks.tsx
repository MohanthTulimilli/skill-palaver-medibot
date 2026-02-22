import React from 'react';
import { motion } from 'framer-motion';
import { Plug, Brain, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Connect Your Systems',
    desc: 'Integrate your EHR, practice management, and payer portals in a few clicks.',
    Icon: Plug,
  },
  {
    step: '02',
    title: 'AI Learns Your Data',
    desc: 'Our models analyze your historical claims to identify patterns and optimize workflows.',
    Icon: Brain,
  },
  {
    step: '03',
    title: 'Watch Revenue Grow',
    desc: 'Automated processing, fewer denials, faster payments — results from day one.',
    Icon: TrendingUp,
  },
];

export const LandingHowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="relative z-10 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-3"
          >
            Simple Setup
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground"
          >
            Get Started in Minutes
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connecting line - desktop */}
          <div className="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-4">
            {STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <motion.span
                    className="text-6xl lg:text-7xl font-extrabold bg-gradient-to-b from-primary/20 to-transparent bg-clip-text text-transparent"
                    style={{
                      WebkitTextStroke: '2px hsl(var(--primary) / 0.4)',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {item.step}
                  </motion.span>
                  <div className="absolute -top-2 -right-2 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
