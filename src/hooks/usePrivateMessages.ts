import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PrivateMessage {
  id: string;
  senderId: string;
  recipientId: string;
  caseId: string | null;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export function usePrivateMessages(recipientId: string, caseId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !recipientId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get messages between the two users for this case
      let query = supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(
        (data || []).map(m => ({
          id: m.id,
          senderId: m.sender_id,
          recipientId: m.recipient_id,
          caseId: m.case_id,
          content: m.content,
          createdAt: m.created_at,
          readAt: m.read_at,
        }))
      );
    } catch (err) {
      console.error('Error fetching private messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, recipientId, caseId]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!user || !recipientId || !content.trim()) return false;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          case_id: caseId || null,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          senderId: data.sender_id,
          recipientId: data.recipient_id,
          caseId: data.case_id,
          content: data.content,
          createdAt: data.created_at,
          readAt: data.read_at,
        },
      ]);

      return true;
    } catch (err) {
      console.error('Error sending private message:', err);
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !recipientId) return;

    const channel = supabase
      .channel(`private-messages:${user.id}:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Only add if this message is between us
          const isOurConversation =
            (newMsg.sender_id === user.id && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === user.id);
          
          // Check case_id matches if specified
          const caseMatches = !caseId || newMsg.case_id === caseId;
          
          if (isOurConversation && caseMatches) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  senderId: newMsg.sender_id,
                  recipientId: newMsg.recipient_id,
                  caseId: newMsg.case_id,
                  content: newMsg.content,
                  createdAt: newMsg.created_at,
                  readAt: newMsg.read_at,
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
  }, [user, recipientId, caseId]);

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
