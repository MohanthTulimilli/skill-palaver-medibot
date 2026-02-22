import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { roleDefaultRoute } from '@/config/sidebarConfig';

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/landing" replace />;
  }

  return <Navigate to={roleDefaultRoute[user.role]} replace />;
};

export default Index;
