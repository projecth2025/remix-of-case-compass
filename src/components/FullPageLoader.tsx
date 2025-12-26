import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
  submessage?: string;
}

/**
 * FullPageLoader - Full-screen blocking loader overlay.
 * Used during case creation/update to prevent user interaction.
 */
const FullPageLoader = ({ 
  message = 'Processing...', 
  submessage 
}: FullPageLoaderProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-card border border-border shadow-lg max-w-sm mx-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullPageLoader;
