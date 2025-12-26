import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface FinalSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * FinalSubmitModal - Custom modal for final case submission with mandatory checkbox.
 */
const FinalSubmitModal = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: FinalSubmitModalProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleConfirm = () => {
    if (!isChecked) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setIsChecked(false);
    onConfirm();
  };

  const handleCancel = () => {
    setIsChecked(false);
    setShowError(false);
    onCancel();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsChecked(false);
      setShowError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Final Submission
          </AlertDialogTitle>
            <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                You are about to submit this case to the Board.
              </p>
              <p>
                Incorrect digitization may lead to inaccurate treatment recommendations.
                Please ensure all the data have been accurately digitized.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Confirmation Checkbox */}
        <div className="py-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm-accuracy"
              checked={isChecked}
              onCheckedChange={(checked) => {
                setIsChecked(checked === true);
                if (checked) setShowError(false);
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="confirm-accuracy"
              className="text-sm text-foreground cursor-pointer leading-relaxed"
            >
              I have reviewed the digitized data and confirm its accuracy for the Tumor Board.
            </label>
          </div>
          {showError && (
            <p className="text-xs text-destructive mt-2 ml-7">
              Please confirm before submitting.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            className="bg-background text-foreground border border-border hover:bg-muted hover:text-foreground"
          >
            Go Back
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isChecked}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Case
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FinalSubmitModal;
