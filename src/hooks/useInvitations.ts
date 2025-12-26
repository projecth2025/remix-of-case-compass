import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invitation {
  id: string;
  mtbId: string;
  mtbName: string;
  invitedBy: string;
  invitedByName: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  read: boolean;
  createdAt: string;
}

export function useInvitations() {
  const { user, profile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInvitations = useCallback(async () => {
    if (!user || !profile?.email) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch invitations where user is invited (by email or user_id)
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .or(`invited_email.eq.${profile.email},invited_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Invitations query error:', error);
        throw error;
      }

      // Fetch MTB names and inviter names separately
      const mtbIds = [...new Set((data || []).map(inv => inv.mtb_id))];
      const inviterIds = [...new Set((data || []).map(inv => inv.invited_by))];

      const [mtbsResult, invitersResult] = await Promise.all([
        supabase.from('mtbs').select('id, name').in('id', mtbIds),
        supabase.from('profiles').select('id, name').in('id', inviterIds),
      ]);

      const mtbMap: Record<string, string> = {};
      const inviterMap: Record<string, string> = {};

      (mtbsResult.data || []).forEach(m => {
        mtbMap[m.id] = m.name;
      });
      (invitersResult.data || []).forEach(p => {
        inviterMap[p.id] = p.name;
      });

      const mapped = (data || []).map(inv => ({
        id: inv.id,
        mtbId: inv.mtb_id,
        mtbName: mtbMap[inv.mtb_id] || 'Unknown MTB',
        invitedBy: inv.invited_by,
        invitedByName: inviterMap[inv.invited_by] || 'Unknown',
        invitedEmail: inv.invited_email,
        status: inv.status as 'pending' | 'accepted' | 'declined',
        read: inv.read,
        createdAt: inv.created_at,
      }));

      setInvitations(mapped);
      setUnreadCount(mapped.filter(i => !i.read && i.status === 'pending').length);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.email]);

  const sendInvitations = async (
    mtbId: string,
    emails: string[]
  ): Promise<{ success: string[]; failed: string[] }> => {
    if (!user) {
      return { success: [], failed: emails };
    }

    const results = { success: [] as string[], failed: [] as string[] };

    for (const email of emails) {
      try {
        // Check if user exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        // Check if already invited
        const { data: existingInvite } = await supabase
          .from('invitations')
          .select('id')
          .eq('mtb_id', mtbId)
          .eq('invited_email', email)
          .maybeSingle();

        if (existingInvite) {
          results.failed.push(email);
          continue;
        }

        // Check if already a member
        if (existingProfile) {
          const { data: existingMember } = await supabase
            .from('mtb_members')
            .select('id')
            .eq('mtb_id', mtbId)
            .eq('user_id', existingProfile.id)
            .maybeSingle();

          if (existingMember) {
            results.failed.push(email);
            continue;
          }
        }

        // Create invitation
        const { error } = await supabase
          .from('invitations')
          .insert({
            mtb_id: mtbId,
            invited_by: user.id,
            invited_email: email,
            invited_user_id: existingProfile?.id || null,
          });

        if (error) {
          results.failed.push(email);
        } else {
          results.success.push(email);
        }
      } catch (err) {
        results.failed.push(email);
      }
    }

    if (results.success.length > 0) {
      toast.success(`Invited ${results.success.length} user(s)`);
    }
    if (results.failed.length > 0) {
      toast.error(`Failed to invite ${results.failed.length} user(s)`);
    }

    return results;
  };

  const acceptInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('mtb_id')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) throw fetchError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          invited_user_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Add user as member
      const { error: memberError } = await supabase
        .from('mtb_members')
        .insert({
          mtb_id: invitation.mtb_id,
          user_id: user.id,
          role: 'expert',
        });

      if (memberError && memberError.code !== '23505') {
        // Ignore duplicate key error
        throw memberError;
      }

      await fetchInvitations();
      toast.success('Invitation accepted');
      return true;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error('Failed to accept invitation');
      return false;
    }
  };

  const declineInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'declined',
          invited_user_id: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      await fetchInvitations();
      toast.success('Invitation declined');
      return true;
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error('Failed to decline invitation');
      return false;
    }
  };

  const markInvitationsRead = async (): Promise<void> => {
    if (!user || !profile?.email) return;

    try {
      await supabase
        .from('invitations')
        .update({ read: true })
        .or(`invited_email.eq.${profile.email},invited_user_id.eq.${user.id}`)
        .eq('read', false);

      setInvitations(prev => prev.map(i => ({ ...i, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking invitations read:', err);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    unreadCount,
    pendingInvitations: invitations.filter(i => i.status === 'pending'),
    sendInvitations,
    acceptInvitation,
    declineInvitation,
    markInvitationsRead,
    refetch: fetchInvitations,
  };
}
