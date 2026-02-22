import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { roleDefaultRoute } from '@/config/sidebarConfig';
import { Navigate } from 'react-router-dom';
import {
  LandingNavbar,
  LandingHero,
  LandingSocialProof,
  LandingFeatures,
  LandingMetrics,
  LandingHowItWorks,
  LandingPricing,
  LandingTestimonials,
  LandingCTA,
  LandingFooter,
} from '@/components/landing';

const LandingPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={roleDefaultRoute[user.role]} replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background: grid + radial gradients */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.6]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v60H0zM60 0h1v60h-1z' fill='%2306b6d4' fill-opacity='0.03'/%3E%3Cpath d='M0 0v1h60V0zM0 60v1h60v-1z' fill='%2306b6d4' fill-opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/[0.05] dark:bg-primary/[0.08] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-secondary/[0.04] dark:bg-secondary/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[300px] bg-accent/[0.03] dark:bg-accent/[0.05] rounded-full blur-3xl" />
      </div>

      <LandingNavbar />
      <main className="relative z-10">
        <LandingHero />
        <LandingSocialProof />
        <LandingFeatures />
        <LandingMetrics />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingTestimonials />
        <LandingCTA />
        <LandingFooter />
      </main>
    </div>
  );
};

export default LandingPage;
