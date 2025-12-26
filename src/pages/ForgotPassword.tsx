import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { state, setOTPEmail } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    const user = state.users.find(u => u.email === email);
    if (!user) {
      toast.error('No account found with this email');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setOTPEmail(email);
    toast.success('OTP sent! Check the console for the code.');
    navigate('/otp');

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground mt-1">
            Enter your email to receive a verification code
          </p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full vmtb-btn-primary"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          Remember your password?{' '}
          <Link to="/login" className="vmtb-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
