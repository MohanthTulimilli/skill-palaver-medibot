import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { roleDefaultRoute } from '@/config/sidebarConfig';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const defaultRoute = user ? roleDefaultRoute[user.role] : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 animate-fade-in max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have permission to access this page.</p>
        </div>
        <button
          onClick={() => navigate(defaultRoute)}
          className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
