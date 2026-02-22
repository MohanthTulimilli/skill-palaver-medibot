import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';
import Chatbot from '@/components/Chatbot';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Loading MediBots…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen layout-bg">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <TopNavbar />
        <main className="relative z-10 p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

export default DashboardLayout;
