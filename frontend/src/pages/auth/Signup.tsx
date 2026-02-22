import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthCinematicBackground } from '@/components/auth/AuthCinematicBackground';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { isDark, toggle } = useTheme();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMedibotsDomain = (email: string) => {
    const domain = email.substring(email.indexOf('@') + 1);
    return domain === 'medibots.com' || domain.endsWith('.medibots.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMedibotsDomain(email)) {
      toast({ title: 'Registration denied', description: 'Staff accounts must be created by an administrator. Use a personal email for patient registration.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before signing in.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed.';
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
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
            <h2 className="text-xl font-semibold text-foreground">Patient Registration</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your patient account to get started</p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Staff accounts (Doctor, Billing, Insurance) are created by your system administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm transition-all hover:shadow-lg hover:opacity-95 disabled:opacity-50 active:scale-[0.99]">
              {loading ? 'Creating account…' : 'Create Patient Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
