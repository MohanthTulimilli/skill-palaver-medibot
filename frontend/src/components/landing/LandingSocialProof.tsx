import React from 'react';
import { motion } from 'framer-motion';

const LOGOS = [
  'Memorial Health',
  'Summit Medical',
  'Valley Hospital',
  'Unity Health',
  'Premier Care',
  'Metro Healthcare',
];

export const LandingSocialProof: React.FC = () => {
  return (
    <section className="relative z-10 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium text-muted-foreground mb-10"
        >
          Trusted by 500+ healthcare organizations
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 opacity-70"
        >
          {LOGOS.map((name, i) => (
            <span
              key={name}
              className="text-lg font-semibold text-muted-foreground/80 hover:text-foreground/80 transition-colors"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
