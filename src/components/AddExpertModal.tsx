import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AddExpertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (email: string) => void;
}

/**
 * AddExpertModal allows MTB owners to invite new experts by email.
 */
const AddExpertModal = ({ open, onOpenChange, onAdd }: AddExpertModalProps) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAdd = () => {
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    onAdd(email.trim());
    toast.success('Expert invitation sent');
    setEmail('');
    setEmailError('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className={`vmtb-input ${emailError ? 'border-destructive' : ''}`}
              placeholder="expert@email.com"
            />
            {emailError && (
              <p className="text-xs text-destructive mt-1">{emailError}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="vmtb-btn-outline">
            Cancel
          </button>
          <button onClick={handleAdd} className="vmtb-btn-primary">
            Send Invitation
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpertModal;
