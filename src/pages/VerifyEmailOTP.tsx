import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

/**
 * VerifyEmailOTP page
 * Allows users to verify a new email address using a 6-digit OTP.
 * Similar to OTP.tsx but for email verification during profile changes.
 */
const VerifyEmailOTP = () => {
  const navigate = useNavigate();
  const { state, verifyEmailOTP } = useApp();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email verification in progress
  useEffect(() => {
    if (!state.emailVerificationPending) {
      navigate('/home');
    }
  }, [state.emailVerificationPending, navigate]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      const success = verifyEmailOTP?.(otpString);
      if (success) {
        toast.success('Email verified successfully!');
        navigate('/home');
      } else {
        toast.error('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = () => {
    toast.info('OTP resent to your new email address');
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Email</h1>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to <br />
            <span className="font-semibold text-foreground">{state.emailVerificationPending}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* OTP Input Fields */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="0"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.join('').length !== 6}
            className="w-full vmtb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOTP}
                className="text-primary hover:underline font-semibold"
              >
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailOTP;
