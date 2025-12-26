import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ValidationPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  unverifiedDocuments?: string[];
  onContinueAnyway?: () => void;
}

export function ValidationPopup({
  open,
  onClose,
  title,
  description,
  unverifiedDocuments = [],
  onContinueAnyway,
}: ValidationPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-light">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {unverifiedDocuments.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-warning-light border border-warning/20">
            <p className="text-sm font-medium text-warning-foreground mb-2">
              Documents requiring review:
            </p>
            <ul className="space-y-1">
              {unverifiedDocuments.map((docName) => (
                <li
                  key={docName}
                  className="flex items-center gap-2 text-sm text-warning-foreground/80"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                  {docName}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          {onContinueAnyway && (
            <Button variant="ghost" onClick={onContinueAnyway} className="text-muted-foreground">
              Skip (Not Recommended)
            </Button>
          )}
          <Button onClick={onClose} className="gap-2">
            Review Documents
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
