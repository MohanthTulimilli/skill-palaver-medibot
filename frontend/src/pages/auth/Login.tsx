import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthCinematicBackground } from '@/components/auth/AuthCinematicBackground';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: 'Successfully signed in.' });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 auth-bg">
      <AuthCinematicBackground />
      <div className="absolute top-4 right-4 z-10">
        <button onClick={toggle} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition-all" aria-label="Toggle theme">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logom.png" alt="MediBots" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MediBots</h1>
            <p className="text-xs text-muted-foreground">AI Healthcare RCM</p>
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur-sm rounded-2xl border border-border shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground mt-1">Staff: use role-based email (e.g. d1@doctor.medibots.com). Patients: use any email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm transition-all hover:shadow-lg hover:opacity-95 disabled:opacity-50 active:scale-[0.99]">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
