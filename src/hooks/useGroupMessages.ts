import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupMessage {
  id: string;
  mtbId: string;
  caseId: string | null;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
}

export function useGroupMessages(mtbId: string, caseId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !mtbId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('group_messages')
        .select(`
          *,
          sender:profiles!group_messages_sender_id_fkey(name, avatar_url)
        `)
        .eq('mtb_id', mtbId)
        .order('created_at', { ascending: true });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(
        (data || []).map(m => ({
          id: m.id,
          mtbId: m.mtb_id,
          caseId: m.case_id,
          senderId: m.sender_id,
          senderName: (m.sender as any)?.name || 'Unknown',
          senderAvatar: (m.sender as any)?.avatar_url,
          content: m.content,
          createdAt: m.created_at,
          isAnonymous: (m as any).is_anonymous || false,
        }))
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, mtbId, caseId]);

  const sendMessage = async (content: string, isAnonymous: boolean = false): Promise<boolean> => {
    if (!user || !mtbId || !content.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          mtb_id: mtbId,
          case_id: caseId || null,
          sender_id: user.id,
          content: content.trim(),
          is_anonymous: isAnonymous,
        })
        .select(`
          *,
          sender:profiles!group_messages_sender_id_fkey(name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          mtbId: data.mtb_id,
          caseId: data.case_id,
          senderId: data.sender_id,
          senderName: (data.sender as any)?.name || 'Unknown',
          senderAvatar: (data.sender as any)?.avatar_url,
          content: data.content,
          createdAt: data.created_at,
          isAnonymous: (data as any).is_anonymous || false,
        },
      ]);

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!mtbId) return;

    const channel = supabase
      .channel(`messages:${mtbId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `mtb_id=eq.${mtbId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('group_messages')
            .select(`
              *,
              sender:profiles!group_messages_sender_id_fkey(name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === data.id)) return prev;
              return [
                ...prev,
                {
                  id: data.id,
                  mtbId: data.mtb_id,
                  caseId: data.case_id,
                  senderId: data.sender_id,
                  senderName: (data.sender as any)?.name || 'Unknown',
                  senderAvatar: (data.sender as any)?.avatar_url,
                  content: data.content,
                  createdAt: data.created_at,
                  isAnonymous: (data as any).is_anonymous || false,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mtbId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
