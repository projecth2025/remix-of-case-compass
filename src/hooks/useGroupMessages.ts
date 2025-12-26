import { useState, useEffect, useCallback, useRef } from 'react';
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
  const lastFetchRef = useRef<string>('');

  const fetchMessages = useCallback(async () => {
    if (!user || !mtbId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Create a key to track if params changed
    const fetchKey = `${mtbId}-${caseId || 'none'}`;
    
    // Only show loading on first fetch or when params change
    if (lastFetchRef.current !== fetchKey) {
      setLoading(true);
      lastFetchRef.current = fetchKey;
    }

    try {
      let query = supabase
        .from('group_messages')
        .select('*')
        .eq('mtb_id', mtbId)
        .order('created_at', { ascending: true });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching group messages:', error);
        throw error;
      }

      // Fetch all unique sender profiles
      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const profilesMap = new Map<string, { name: string; avatar_url: string | null }>();

      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', senderIds);

        profiles?.forEach(p => {
          profilesMap.set(p.id, { name: p.name, avatar_url: p.avatar_url });
        });
      }

      console.log('Fetched group messages:', (data || []).length, 'for mtb:', mtbId);

      setMessages(
        (data || []).map(m => {
          const sender = profilesMap.get(m.sender_id);
          return {
            id: m.id,
            mtbId: m.mtb_id,
            caseId: m.case_id,
            senderId: m.sender_id,
            senderName: sender?.name || 'Unknown',
            senderAvatar: sender?.avatar_url || null,
            content: m.content,
            createdAt: m.created_at,
            isAnonymous: m.is_anonymous || false,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, mtbId, caseId]);

  const sendMessage = async (content: string, isAnonymous: boolean = false): Promise<boolean> => {
    if (!user || !mtbId || !content.trim()) {
      console.log('sendMessage: missing required fields', { user: !!user, mtbId, content: content.trim() });
      return false;
    }

    try {
      console.log('Sending group message to mtb:', mtbId);
      
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          mtb_id: mtbId,
          case_id: caseId || null,
          sender_id: user.id,
          content: content.trim(),
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting group message:', error);
        throw error;
      }

      console.log('Group message sent successfully:', data.id);

      // Fetch user profile for the new message
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      // Add message to state immediately (optimistic update)
      const newMessage: GroupMessage = {
        id: data.id,
        mtbId: data.mtb_id,
        caseId: data.case_id,
        senderId: data.sender_id,
        senderName: profile?.name || 'You',
        senderAvatar: profile?.avatar_url || null,
        content: data.content,
        createdAt: data.created_at,
        isAnonymous: data.is_anonymous || false,
      };

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!mtbId || !user) return;

    console.log('Setting up realtime subscription for mtb:', mtbId);

    const channel = supabase
      .channel(`group-messages-${mtbId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `mtb_id=eq.${mtbId}`,
        },
        async (payload) => {
          console.log('Realtime: new group message received', payload.new);
          const newMsg = payload.new as any;

          // Skip if case_id doesn't match (when caseId is specified)
          if (caseId && newMsg.case_id !== caseId) {
            console.log('Skipping message - case_id mismatch');
            return;
          }

          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) {
              console.log('Skipping duplicate message:', newMsg.id);
              return prev;
            }
            console.log('Adding new message to state:', newMsg.id);
            return [
              ...prev,
              {
                id: newMsg.id,
                mtbId: newMsg.mtb_id,
                caseId: newMsg.case_id,
                senderId: newMsg.sender_id,
                senderName: profile?.name || 'Unknown',
                senderAvatar: profile?.avatar_url || null,
                content: newMsg.content,
                createdAt: newMsg.created_at,
                isAnonymous: newMsg.is_anonymous || false,
              },
            ];
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription for mtb:', mtbId);
      supabase.removeChannel(channel);
    };
  }, [mtbId, caseId, user]);

  // Fetch messages on mount and when params change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling fallback - refetch every 5 seconds as backup for realtime
  useEffect(() => {
    if (!user || !mtbId) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, mtbId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
