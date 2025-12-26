import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (login(email, password)) {
      toast.success('Welcome back!');
      navigate('/home');
    } else {
      toast.error('Invalid credentials or account not verified');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="vmtb-card p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="vmtb-input"
              placeholder="Enter your password"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="vmtb-link text-sm">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vmtb-btn-primary"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="vmtb-link">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
