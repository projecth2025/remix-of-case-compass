import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CaseConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  mode: 'create' | 'update';
}

/**
 * CaseConfirmModal - Styled confirmation modal for case creation/update.
 * Shows confirmation checkbox, handles loading state, and provides feedback.
 */
const CaseConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  mode,
}: CaseConfirmModalProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!isChecked) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsLoading(true);

    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setIsChecked(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return; // Prevent closing while loading
    setIsChecked(false);
    setShowError(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return; // Prevent closing while loading
    if (!newOpen) {
      setIsChecked(false);
      setShowError(false);
    }
    onOpenChange(newOpen);
  };

  const title = mode === 'create' ? 'Create Case' : 'Update Case';
  const actionLabel = mode === 'create' ? 'Create Case' : 'Update Case';
  const description = mode === 'create' 
    ? 'You are about to create this case. Please ensure all data has been accurately reviewed.'
    : 'You are about to update this case. Please ensure all changes have been accurately reviewed.';

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md border border-border bg-card shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground pt-2">
              <p>{description}</p>
              <p className="text-xs text-muted-foreground/80">
                Incorrect data may lead to inaccurate treatment recommendations.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Confirmation Checkbox */}
        <div className="py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Checkbox
              id="confirm-case"
              checked={isChecked}
              onCheckedChange={(checked) => {
                setIsChecked(checked === true);
                if (checked) setShowError(false);
              }}
              disabled={isLoading}
              className="mt-0.5"
            />
            <label
              htmlFor="confirm-case"
              className="text-sm text-foreground cursor-pointer leading-relaxed"
            >
              I have reviewed all patient data and documents, and confirm their accuracy.
            </label>
          </div>
          {showError && (
            <p className="text-xs text-destructive mt-2 ml-3">
              Please confirm before proceeding.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isChecked || isLoading}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CaseConfirmModal;
