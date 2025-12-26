import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const OTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { state, verifyOTP, setOTPEmail } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (verifyOTP(otpString)) {
      toast.success('Email verified successfully!');
      navigate('/login');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }

    setLoading(false);
  };

  const handleResend = () => {
    if (state.otpEmail) {
      setOTPEmail(state.otpEmail);
      toast.success('OTP resent! Check the console for the code.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verify Your Email</h1>
          <p className="text-muted-foreground mt-1">
            Enter the 6-digit code sent to your email
          </p>
          {state.otpEmail && (
            <p className="text-sm text-primary mt-2">{state.otpEmail}</p>
          )}
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="vmtb-card p-8">
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-semibold border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vmtb-btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          Didn't receive the code?{' '}
          <button onClick={handleResend} className="vmtb-link">
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTP;
