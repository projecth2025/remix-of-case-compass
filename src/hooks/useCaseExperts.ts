import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Expert } from '@/lib/storage';

interface CaseExpert extends Expert {
  role?: string;
}

/**
 * Hook to fetch all MTB members (experts) for a given case.
 * A case can be part of multiple MTBs, so we get all unique members.
 */
export function useCaseExperts(caseId: string) {
  const { user } = useAuth();
  const [experts, setExperts] = useState<CaseExpert[]>([]);
  const [mtbId, setMtbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExperts = useCallback(async () => {
    if (!user || !caseId) {
      setExperts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First, find all MTBs that contain this case
      const { data: mtbCases, error: mtbCasesError } = await supabase
        .from('mtb_cases')
        .select('mtb_id')
        .eq('case_id', caseId);

      if (mtbCasesError) throw mtbCasesError;

      if (!mtbCases || mtbCases.length === 0) {
        setExperts([]);
        setLoading(false);
        return;
      }

      // Store the first MTB ID for group messaging
      setMtbId(mtbCases[0].mtb_id);

      const mtbIds = mtbCases.map(mc => mc.mtb_id);

      // Fetch all members from these MTBs
      const { data: members, error: membersError } = await supabase
        .from('mtb_members')
        .select(`
          user_id,
          role
        `)
        .in('mtb_id', mtbIds);

      if (membersError) throw membersError;

      // Get unique user IDs from members
      const memberUserIds = members?.map(m => m.user_id) || [];

      // Fetch profiles for members
      const { data: memberProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, profession, avatar_url')
        .in('id', memberUserIds);

      if (profilesError) throw profilesError;

      // Also fetch MTB owners
      const { data: mtbs, error: mtbsError } = await supabase
        .from('mtbs')
        .select('id, owner_id')
        .in('id', mtbIds);

      if (mtbsError) throw mtbsError;

      // Get owner IDs
      const ownerIds = mtbs?.map(m => m.owner_id) || [];

      // Fetch profiles for owners
      const { data: ownerProfiles, error: ownerProfilesError } = await supabase
        .from('profiles')
        .select('id, name, profession, avatar_url')
        .in('id', ownerIds);

      if (ownerProfilesError) throw ownerProfilesError;

      // Create a profile map for easy lookup
      const profileMap = new Map<string, any>();
      memberProfiles?.forEach(p => profileMap.set(p.id, p));
      ownerProfiles?.forEach(p => profileMap.set(p.id, p));

      // Combine members and owners, deduplicate by user_id
      const expertMap = new Map<string, CaseExpert>();

      // Add owners first
      mtbs?.forEach(mtb => {
        const owner = profileMap.get(mtb.owner_id);
        if (owner) {
          expertMap.set(mtb.owner_id, {
            id: owner.id,
            name: owner.name || 'Unknown',
            specialty: owner.profession || 'MTB Owner',
            avatar: owner.avatar_url,
            role: 'owner',
          });
        }
      });

      // Add members
      members?.forEach(member => {
        const profile = profileMap.get(member.user_id);
        if (profile && !expertMap.has(member.user_id)) {
          expertMap.set(member.user_id, {
            id: profile.id,
            name: profile.name || 'Unknown',
            specialty: profile.profession || 'Expert',
            avatar: profile.avatar_url,
            role: member.role,
          });
        }
      });

      // Filter out the current user - you can't message yourself
      const expertsArray = Array.from(expertMap.values()).filter(e => e.id !== user.id);
      setExperts(expertsArray);
    } catch (err) {
      console.error('Error fetching case experts:', err);
    } finally {
      setLoading(false);
    }
  }, [user, caseId]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  return {
    experts,
    mtbId,
    loading,
    refetch: fetchExperts,
  };
}
