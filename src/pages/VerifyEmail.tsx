import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Email verification page shown after signup
 * Instructs user to check email before logging in
 */
const VerifyEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a confirmation link to your email address.
          </p>
        </div>

        <div className="vmtb-card p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-foreground font-medium mb-2">
                Please confirm your signup from the email before logging in.
              </p>
              <p className="text-sm text-muted-foreground">
                Check your inbox (and spam folder) for a confirmation email from vMTB.
                Click the link in the email to verify your account.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Once verified, you can log in to access your account.
              </p>
              
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Login
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Didn't receive the email?{' '}
          <button 
            onClick={() => navigate('/auth')}
            className="text-primary hover:underline"
          >
            Try signing up again
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
