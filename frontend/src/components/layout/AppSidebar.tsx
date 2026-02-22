import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, FileCheck, CreditCard, Bot, BarChart3,
  Settings, ChevronLeft, ChevronRight, Activity, Brain, AlertTriangle,
  Receipt, HelpCircle, UserCog, User, UserPlus, Calendar, CalendarPlus, ScrollText,
  Package, FlaskConical, CalendarClock, LayoutGrid, FileUp, PieChart, Building2, Stethoscope, IndianRupee
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sidebarConfig } from '@/config/sidebarConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, FileText, FileCheck, CreditCard, Bot, BarChart3,
  Settings, Activity, Brain, AlertTriangle, Receipt, HelpCircle, UserCog, User, UserPlus,
  Calendar, CalendarPlus, ScrollText, Package, FlaskConical, CalendarClock, LayoutGrid, FileUp, PieChart, Building2, Stethoscope, IndianRupee,
};

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const items = user ? sidebarConfig[user.role] : [];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen sidebar-glass transition-all duration-300 ease-in-out flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/40">
        <img src="/logom.png" alt="MediBots" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold text-sidebar-accent-foreground tracking-tight font-heading"
          >
            MediBots
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = iconMap[item.icon] || LayoutDashboard;

          const link = (
            <NavLink
              key={item.path + item.title}
              to={item.path}
              className={`sidebar-item group ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <Icon className={`sidebar-icon w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-primary'}`} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path + item.title} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-sidebar-border/40">
        <button onClick={onToggle} className="sidebar-item sidebar-item-inactive w-full justify-center">
          <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </motion.span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
