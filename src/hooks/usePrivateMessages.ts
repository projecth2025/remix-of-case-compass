import { useState, useEffect, useCallback, useRef } from 'react';
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
  const lastFetchRef = useRef<string>('');

  const fetchMessages = useCallback(async () => {
    if (!user || !recipientId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Create a key to track if params changed
    const fetchKey = `${user.id}-${recipientId}-${caseId || 'none'}`;
    
    // Only show loading on first fetch or when params change
    if (lastFetchRef.current !== fetchKey) {
      setLoading(true);
      lastFetchRef.current = fetchKey;
    }

    try {
      // Build the query manually to avoid issues with complex OR filters
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching private messages:', error);
        throw error;
      }

      // Filter in JS to get only messages between these two users
      let filteredData = (data || []).filter(m => 
        (m.sender_id === user.id && m.recipient_id === recipientId) ||
        (m.sender_id === recipientId && m.recipient_id === user.id)
      );

      // Filter by case_id if specified
      if (caseId) {
        filteredData = filteredData.filter(m => m.case_id === caseId);
      }

      console.log('Fetched private messages:', filteredData.length, 'for conversation:', user.id, '<->', recipientId);

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
      console.log('Sending private message to:', recipientId);

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

      console.log('Private message sent successfully:', data.id);

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

  // Subscribe to realtime updates for ALL private messages involving this user
  useEffect(() => {
    if (!user) return;

    console.log('Setting up private message realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`private-messages-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          console.log('Realtime: new private message received', newMsg.id);

          // Only add if this message is between the current user and the selected recipient
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

  // Fetch messages on mount and when params change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling fallback - refetch every 5 seconds as backup
  useEffect(() => {
    if (!user || !recipientId) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, recipientId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
