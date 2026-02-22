import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { mockNotifications } from '@/services/mockData';
import { UserRole } from '@/types';

const roleBadgeColor: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-primary/15 text-primary',
  [UserRole.HOSPITAL_ADMIN]: 'bg-[hsl(260,60%,45%/0.15)] text-[hsl(260,60%,45%)]',
  [UserRole.BILLING]: 'bg-secondary/15 text-secondary',
  [UserRole.INSURANCE]: 'bg-[hsl(270,60%,50%/0.15)] text-[hsl(270,60%,50%)]',
  [UserRole.AI_ANALYST]: 'bg-accent/15 text-accent',
  [UserRole.PATIENT]: 'bg-success/15 text-success',
  [UserRole.DOCTOR]: 'bg-warning/15 text-warning',
};

const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filteredNotifications = mockNotifications.filter(n => {
    if (!user) return false;
    if (user.role === UserRole.PATIENT) return n.type === 'success' || n.type === 'info';
    if (user.role === UserRole.AI_ANALYST) return n.type === 'warning' || n.title.toLowerCase().includes('ai');
    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const dropdownVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
    exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } },
  };

  return (
    <header className="sticky top-0 z-30 h-16 navbar-glass flex items-center justify-between px-6 gap-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search claims, patients, invoices…"
          className="w-full rounded-xl border border-border/60 bg-background/50 px-4 pl-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
        />
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggle} className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-105 active:scale-95">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 transition-all duration-200 relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl p-4">
                <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                  ) : filteredNotifications.map(n => (
                    <div key={n.id} className={`p-3 rounded-lg text-sm transition-colors ${n.read ? 'bg-muted/20' : 'bg-primary/5 border border-primary/10'}`}>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/60 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-primary-foreground">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="hidden md:block text-left">
              <span className="text-sm font-medium block leading-tight">{user?.name}</span>
              {user?.role && (
                <span className={`inline-block mt-0.5 px-1.5 py-0 rounded text-[10px] font-semibold ${roleBadgeColor[user.role]}`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl p-2">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${user?.role ? roleBadgeColor[user.role] : ''}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => logout()} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
