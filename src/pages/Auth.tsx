import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import ProfessionSelect from '@/components/ProfessionSelect';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (!profession.trim()) {
        toast.error('Please select or enter your profession');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/home');
        }
      } else {
        const { error } = await signUp(email, password, name, profession, phone, hospitalName);
        if (error) {
          toast.error(error.message.includes('already registered') ? 'An account with this email already exists' : error.message);
        } else {
          toast.success('Account created successfully!');
          navigate('/home');
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-muted-foreground mt-1">{isLogin ? 'Sign in to your account' : 'Sign up to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="vmtb-card p-8 space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="vmtb-input" placeholder="Enter your name" />
            </div>
          )}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Profession</label>
              <ProfessionSelect value={profession} onChange={setProfession} placeholder="Select or type profession" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="vmtb-input" placeholder="Enter your email" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Hospital Name (optional)</label>
              <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)} className="vmtb-input" placeholder="Enter your hospital name" />
            </div>
          )}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone (optional)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="vmtb-input" placeholder="Enter your phone number" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="vmtb-input" placeholder="Enter your password" />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="vmtb-input" placeholder="Confirm your password" />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full vmtb-btn-primary">
            {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="vmtb-link">{isLogin ? 'Create Account' : 'Login'}</button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
