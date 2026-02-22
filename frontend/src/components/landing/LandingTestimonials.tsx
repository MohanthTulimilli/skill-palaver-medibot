import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

const TESTIMONIALS = [
  {
    quote: 'MediBots cut our denial rate by 43% in the first quarter. The AI predictions are remarkably accurate.',
    author: 'Sarah Chen',
    role: 'VP Revenue Cycle, Memorial Health',
    avatar: 'SC',
  },
  {
    quote: 'We reduced manual claim review by 80%. Our team can now focus on patient care instead of paperwork.',
    author: 'Michael Torres',
    role: 'Billing Director, Summit Medical',
    avatar: 'MT',
  },
  {
    quote: 'Enterprise-grade security and compliance out of the box. Exactly what we needed for our health system.',
    author: 'Jennifer Walsh',
    role: 'CIO, Valley Hospital Network',
    avatar: 'JW',
  },
];

export const LandingTestimonials: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="relative z-10 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-primary uppercase tracking-widest mb-3"
          >
            Customer Stories
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-4xl font-bold text-foreground"
          >
            Loved by Revenue Teams
          </motion.h2>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex-[0_0_100%] min-w-0 lg:flex-[0_0_calc(50%-1rem)] landing-card p-8"
              >
                <Quote className="w-10 h-10 text-primary/30 mb-4" />
                <p className="text-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.author}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === selectedIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
