import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
];

export const LandingNavbar: React.FC = () => {
  const { isDark, toggle } = useTheme();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean);
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.offsetTop <= scrollY) {
          setActiveId(NAV_ITEMS[i].id);
          return;
        }
      }
      setActiveId(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 navbar-glass"
      style={{
        background: 'hsl(var(--card) / 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
        boxShadow: '0 1px 0 0 hsl(var(--background) / 0.5), 0 4px 24px -8px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3 group" aria-label="MediBots Home">
          <img src="/logom.png" alt="MediBots" className="w-10 h-10 rounded-full object-cover group-hover:scale-[1.03] transition-transform" />
          <span className="text-xl font-bold text-foreground tracking-tight">MediBots</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="relative px-4 py-2 text-sm font-medium transition-colors rounded-lg"
            >
              <span className={activeId === item.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}>
                {item.label}
              </span>
              {activeId === item.id && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5 rounded-xl hover:bg-muted/40"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="btn-glow gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
