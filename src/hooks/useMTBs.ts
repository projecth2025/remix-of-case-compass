import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MTB {
  id: string;
  name: string;
  description: string | null;
  dpImage: string | null;
  ownerId: string;
  ownerName: string;
  isOwner: boolean;
  expertsCount: number;
  casesCount: number;
  createdAt: string;
}

export interface MTBMember {
  id: string;
  mtbId: string;
  userId: string;
  role: 'owner' | 'expert' | 'member';
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  userProfession: string | null;
  joinedAt: string;
}

export interface MTBCase {
  id: string;
  caseId: string;
  caseName: string;
  cancerType: string | null;
  patientName: string;
  addedAt: string;
}

export function useMTBs() {
  const { user } = useAuth();
  const [mtbs, setMtbs] = useState<MTB[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMTBs = useCallback(async () => {
    if (!user) {
      setMtbs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch MTBs where user is owner
      const { data: ownedMtbs, error: ownedError } = await supabase
        .from('mtbs')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch MTBs where user is a member
      const { data: memberMtbs, error: memberError } = await supabase
        .from('mtb_members')
        .select(`
          mtb:mtbs(*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Fetch owner profiles separately
      const ownerIds = [
        ...(ownedMtbs || []).map(m => m.owner_id),
        ...(memberMtbs || []).map(m => m.mtb?.owner_id).filter(Boolean)
      ];

      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ownerIds);

      const ownerMap: Record<string, string> = {};
      (ownerProfiles || []).forEach(p => {
        ownerMap[p.id] = p.name;
      });

      // Get member counts for all MTBs
      const allMtbIds = [
        ...(ownedMtbs || []).map(m => m.id),
        ...(memberMtbs || []).map(m => m.mtb?.id).filter(Boolean)
      ];

      const { data: memberCounts } = await supabase
        .from('mtb_members')
        .select('mtb_id')
        .in('mtb_id', allMtbIds);

      const { data: caseCounts } = await supabase
        .from('mtb_cases')
        .select('mtb_id')
        .in('mtb_id', allMtbIds);

      // Count per MTB
      const memberCountMap: Record<string, number> = {};
      const caseCountMap: Record<string, number> = {};
      
      (memberCounts || []).forEach(m => {
        memberCountMap[m.mtb_id] = (memberCountMap[m.mtb_id] || 0) + 1;
      });
      (caseCounts || []).forEach(c => {
        caseCountMap[c.mtb_id] = (caseCountMap[c.mtb_id] || 0) + 1;
      });

      // Combine and dedupe
      const mtbMap = new Map<string, MTB>();

      (ownedMtbs || []).forEach(m => {
        mtbMap.set(m.id, {
          id: m.id,
          name: m.name,
          description: m.description,
          dpImage: m.dp_image,
          ownerId: m.owner_id,
          ownerName: ownerMap[m.owner_id] || 'Unknown',
          isOwner: true,
          expertsCount: memberCountMap[m.id] || 0,
          casesCount: caseCountMap[m.id] || 0,
          createdAt: m.created_at,
        });
      });

      (memberMtbs || []).forEach(m => {
        if (m.mtb && !mtbMap.has(m.mtb.id)) {
          mtbMap.set(m.mtb.id, {
            id: m.mtb.id,
            name: m.mtb.name,
            description: m.mtb.description,
            dpImage: m.mtb.dp_image,
            ownerId: m.mtb.owner_id,
            ownerName: ownerMap[m.mtb.owner_id] || 'Unknown',
            isOwner: m.mtb.owner_id === user.id,
            expertsCount: memberCountMap[m.mtb.id] || 0,
            casesCount: caseCountMap[m.mtb.id] || 0,
            createdAt: m.mtb.created_at,
          });
        }
      });

      setMtbs(Array.from(mtbMap.values()));
    } catch (err) {
      console.error('Error fetching MTBs:', err);
      toast.error('Failed to load MTBs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createMTB = async (
    name: string,
    description?: string,
    dpImage?: string,
    caseIds?: string[]
  ): Promise<MTB | null> => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      // Create MTB
      const { data: newMtb, error: mtbError } = await supabase
        .from('mtbs')
        .insert({
          name,
          description: description || null,
          dp_image: dpImage || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (mtbError) throw mtbError;

      // Add owner as member
      await supabase
        .from('mtb_members')
        .insert({
          mtb_id: newMtb.id,
          user_id: user.id,
          role: 'owner',
        });

      // Add cases if provided
      if (caseIds && caseIds.length > 0) {
        await supabase
          .from('mtb_cases')
          .insert(
            caseIds.map(caseId => ({
              mtb_id: newMtb.id,
              case_id: caseId,
              added_by: user.id,
            }))
          );
      }

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'mtb',
          entity_id: newMtb.id,
          edited_by: user.id,
          change_summary: `MTB "${name}" created`,
        });

      await fetchMTBs();
      toast.success('MTB created successfully');

      return {
        id: newMtb.id,
        name: newMtb.name,
        description: newMtb.description,
        dpImage: newMtb.dp_image,
        ownerId: newMtb.owner_id,
        ownerName: '', // Will be populated on refetch
        isOwner: true,
        expertsCount: 1,
        casesCount: caseIds?.length || 0,
        createdAt: newMtb.created_at,
      };
    } catch (err) {
      console.error('Error creating MTB:', err);
      toast.error('Failed to create MTB');
      return null;
    }
  };

  const deleteMTB = async (mtbId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mtbs')
        .delete()
        .eq('id', mtbId)
        .eq('owner_id', user.id);

      if (error) throw error;

      setMtbs(prev => prev.filter(m => m.id !== mtbId));
      toast.success('MTB deleted');
      return true;
    } catch (err) {
      console.error('Error deleting MTB:', err);
      toast.error('Failed to delete MTB');
      return false;
    }
  };

  const getMTBMembers = async (mtbId: string): Promise<MTBMember[]> => {
    try {
      const { data, error } = await supabase
        .from('mtb_members')
        .select(`
          *,
          user:profiles!mtb_members_user_id_fkey(name, email, avatar_url, profession)
        `)
        .eq('mtb_id', mtbId);

      if (error) throw error;

      return (data || []).map(m => ({
        id: m.id,
        mtbId: m.mtb_id,
        userId: m.user_id,
        role: m.role as 'owner' | 'expert' | 'member',
        userName: (m.user as any)?.name || 'Unknown',
        userEmail: (m.user as any)?.email || '',
        userAvatar: (m.user as any)?.avatar_url,
        userProfession: (m.user as any)?.profession,
        joinedAt: m.joined_at,
      }));
    } catch (err) {
      console.error('Error fetching MTB members:', err);
      return [];
    }
  };

  const getMTBCases = async (mtbId: string): Promise<MTBCase[]> => {
    try {
      const { data, error } = await supabase
        .from('mtb_cases')
        .select(`
          *,
          case:cases(id, case_name, cancer_type),
          patient:patients!inner(anonymized_name)
        `)
        .eq('mtb_id', mtbId);

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        caseId: (c.case as any)?.id,
        caseName: (c.case as any)?.case_name || '',
        cancerType: (c.case as any)?.cancer_type,
        patientName: (c.patient as any)?.anonymized_name || '',
        addedAt: c.added_at,
      }));
    } catch (err) {
      console.error('Error fetching MTB cases:', err);
      return [];
    }
  };

  const addCasesToMTB = async (mtbId: string, caseIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mtb_cases')
        .insert(
          caseIds.map(caseId => ({
            mtb_id: mtbId,
            case_id: caseId,
            added_by: user.id,
          }))
        );

      if (error) throw error;

      await fetchMTBs();
      toast.success('Cases added to MTB');
      return true;
    } catch (err) {
      console.error('Error adding cases to MTB:', err);
      toast.error('Failed to add cases');
      return false;
    }
  };

  const removeCaseFromMTB = async (mtbId: string, caseId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mtb_cases')
        .delete()
        .eq('mtb_id', mtbId)
        .eq('case_id', caseId);

      if (error) throw error;

      await fetchMTBs();
      toast.success('Case removed from MTB');
      return true;
    } catch (err) {
      console.error('Error removing case from MTB:', err);
      toast.error('Failed to remove case');
      return false;
    }
  };

  const removeMemberFromMTB = async (mtbId: string, userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('mtb_members')
        .delete()
        .eq('mtb_id', mtbId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchMTBs();
      toast.success('Member removed');
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Failed to remove member');
      return false;
    }
  };

  useEffect(() => {
    fetchMTBs();
  }, [fetchMTBs]);

  return {
    mtbs,
    loading,
    fetchMTBs,
    createMTB,
    deleteMTB,
    getMTBMembers,
    getMTBCases,
    addCasesToMTB,
    removeCaseFromMTB,
    removeMemberFromMTB,
  };
}
