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
      console.log('Fetching private messages between', user.id, 'and', recipientId);
      
      // Get messages between the two users
      // We need to fetch messages where:
      // (sender = me AND recipient = them) OR (sender = them AND recipient = me)
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching private messages:', error);
        throw error;
      }

      // Filter by case_id if specified
      let filteredData = data || [];
      if (caseId) {
        filteredData = filteredData.filter(m => m.case_id === caseId);
      }

      console.log('Fetched private messages:', filteredData.length);

      setMessages(
        filteredData.map(m => ({
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
    if (!user || !recipientId || !content.trim()) {
      console.log('sendMessage: missing required fields', { user: !!user, recipientId, content: content.trim() });
      return false;
    }

    try {
      console.log('Sending private message:', { recipientId, caseId, content });

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

      if (error) {
        console.error('Error inserting private message:', error);
        throw error;
      }

      console.log('Private message sent successfully:', data);

      // Add message to state immediately (optimistic update)
      const newMessage: PrivateMessage = {
        id: data.id,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        caseId: data.case_id,
        content: data.content,
        createdAt: data.created_at,
        readAt: data.read_at,
      };

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      return true;
    } catch (err) {
      console.error('Error sending private message:', err);
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !recipientId) return;

    console.log('Setting up private message realtime subscription for conversation:', user.id, '<->', recipientId);

    // Create a unique channel for this conversation
    const channelName = `private-messages-${[user.id, recipientId].sort().join('-')}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          console.log('Realtime: new private message received', payload);
          const newMsg = payload.new as any;

          // Only add if this message is between us
          const isOurConversation =
            (newMsg.sender_id === user.id && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === user.id);

          if (!isOurConversation) {
            console.log('Skipping message - not our conversation');
            return;
          }

          // Check case_id matches if specified
          if (caseId && newMsg.case_id !== caseId) {
            console.log('Skipping message - case_id mismatch');
            return;
          }

          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) {
              console.log('Skipping duplicate message:', newMsg.id);
              return prev;
            }
            console.log('Adding new private message to state:', newMsg.id);
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
      )
      .subscribe((status) => {
        console.log('Private message realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up private message realtime subscription');
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
