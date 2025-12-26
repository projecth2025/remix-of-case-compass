import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationTickProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPending?: boolean;
}

export function VerificationTick({
  verified,
  size = 'md',
  className,
  showPending = true,
}: VerificationTickProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  if (verified) {
    return (
      <div
        className={cn(
          'verification-tick',
          sizeClasses[size],
          'animate-scale-in',
          className
        )}
      >
        <Check className={iconSizes[size]} />
      </div>
    );
  }

  if (showPending) {
    return (
      <div
        className={cn(
          'verification-pending pulse-gentle',
          sizeClasses[size],
          className
        )}
      >
        <AlertCircle className={iconSizes[size]} />
      </div>
    );
  }

  return null;
}
