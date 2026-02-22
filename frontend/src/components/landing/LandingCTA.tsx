import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const LandingCTA: React.FC = () => {
  return (
    <section className="relative z-10 py-24 lg:py-32 max-w-7xl mx-auto px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl gradient-primary p-12 lg:p-20 text-center"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M27 18h6v24h-6z' fill='white' fill-opacity='0.2'/%3E%3Cpath d='M18 27h24v6H18z' fill='white' fill-opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-white/5 rounded-full blur-3xl" />

        <div className="relative">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your
            <br />
            Revenue Operations?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10">
            Join 500+ healthcare organizations already using MediBots to reduce denials and accelerate collections.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl text-sm font-bold shadow-xl hover:bg-white/95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
};
