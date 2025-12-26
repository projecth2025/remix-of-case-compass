import { X, Check, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Invitation } from '@/hooks/useInvitations';

// Re-export the type for convenience
export type { Invitation } from '@/hooks/useInvitations';

interface InvitationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitations: Invitation[];
  onAccept: (invitation: Invitation) => void;
  onDecline: (invitation: Invitation) => void;
}

/**
 * Modal to display and manage MTB invitations.
 * Shows pending invitations with Accept/Decline options.
 */
const InvitationsModal = ({
  open,
  onOpenChange,
  invitations,
  onAccept,
  onDecline,
}: InvitationsModalProps) => {
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Mail className="w-5 h-5" />
            Invitations
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[75vh] overflow-y-auto hide-scrollbar flex-1">
          {pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="p-4 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {invitation.mtbName}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Invited by: {invitation.invitedByName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => onAccept(invitation)}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDecline(invitation)}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No pending invitations</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitationsModal;