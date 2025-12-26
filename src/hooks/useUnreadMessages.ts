import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UnreadStatus {
  recipientId: string;
  hasUnread: boolean;
  unreadCount: number;
}

interface GroupUnreadStatus {
  mtbId: string;
  caseId: string | null;
  hasUnread: boolean;
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [privateUnread, setPrivateUnread] = useState<UnreadStatus[]>([]);
  const [groupUnread, setGroupUnread] = useState<GroupUnreadStatus[]>([]);

  // Fetch unread private messages count per conversation
  const fetchPrivateUnread = useCallback(async () => {
    if (!user) return;

    try {
      // Get all unread private messages where current user is recipient
      const { data, error } = await supabase
        .from('private_messages')
        .select('sender_id, case_id')
        .eq('recipient_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      // Group by sender to get unread count per conversation
      const unreadMap = new Map<string, number>();
      (data || []).forEach(msg => {
        const key = msg.sender_id;
        unreadMap.set(key, (unreadMap.get(key) || 0) + 1);
      });

      setPrivateUnread(
        Array.from(unreadMap.entries()).map(([recipientId, count]) => ({
          recipientId,
          hasUnread: count > 0,
          unreadCount: count,
        }))
      );
    } catch (err) {
      console.error('Error fetching private unread:', err);
    }
  }, [user]);

  // Fetch unread group messages
  const fetchGroupUnread = useCallback(async () => {
    if (!user) return;

    try {
      // Get user's MTB memberships
      const { data: memberships } = await supabase
        .from('mtb_members')
        .select('mtb_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setGroupUnread([]);
        return;
      }

      const mtbIds = memberships.map(m => m.mtb_id);

      // Get last read timestamps for each MTB
      const { data: readStatus } = await supabase
        .from('group_chat_reads')
        .select('*')
        .eq('user_id', user.id)
        .in('mtb_id', mtbIds);

      // Get latest message per MTB/case that wasn't sent by current user
      const { data: latestMessages } = await supabase
        .from('group_messages')
        .select('mtb_id, case_id, created_at')
        .in('mtb_id', mtbIds)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false });

      // Check which chats have unread messages
      const unreadList: GroupUnreadStatus[] = [];
      const readMap = new Map<string, Date>();
      
      (readStatus || []).forEach(r => {
        const key = `${r.mtb_id}-${r.case_id || 'null'}`;
        readMap.set(key, new Date(r.last_read_at));
      });

      // Group latest messages by mtb/case
      const latestByChat = new Map<string, Date>();
      (latestMessages || []).forEach(msg => {
        const key = `${msg.mtb_id}-${msg.case_id || 'null'}`;
        if (!latestByChat.has(key)) {
          latestByChat.set(key, new Date(msg.created_at));
        }
      });

      // Compare to find unread
      latestByChat.forEach((latestMsgTime, key) => {
        const [mtbId, caseIdStr] = key.split('-');
        const caseId = caseIdStr === 'null' ? null : caseIdStr;
        const lastRead = readMap.get(key);
        
        const hasUnread = !lastRead || latestMsgTime > lastRead;
        if (hasUnread) {
          unreadList.push({ mtbId, caseId, hasUnread: true });
        }
      });

      setGroupUnread(unreadList);
    } catch (err) {
      console.error('Error fetching group unread:', err);
    }
  }, [user]);

  // Mark private messages as read
  const markPrivateAsRead = useCallback(async (senderId: string, caseId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('private_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', senderId)
        .is('read_at', null);

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      await query;

      // Update local state
      setPrivateUnread(prev => 
        prev.filter(u => u.recipientId !== senderId)
      );
    } catch (err) {
      console.error('Error marking private as read:', err);
    }
  }, [user]);

  // Mark group chat as read
  const markGroupAsRead = useCallback(async (mtbId: string, caseId?: string | null) => {
    if (!user) return;

    try {
      // Upsert the read status
      const { error } = await supabase
        .from('group_chat_reads')
        .upsert({
          user_id: user.id,
          mtb_id: mtbId,
          case_id: caseId || null,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,mtb_id,case_id',
        });

      if (error) throw error;

      // Update local state
      setGroupUnread(prev => 
        prev.filter(u => !(u.mtbId === mtbId && u.caseId === caseId))
      );
    } catch (err) {
      console.error('Error marking group as read:', err);
    }
  }, [user]);

  // Check if a specific private chat has unread messages
  const hasPrivateUnread = useCallback((recipientId: string): boolean => {
    return privateUnread.some(u => u.recipientId === recipientId && u.hasUnread);
  }, [privateUnread]);

  // Check if a specific group chat has unread messages
  const hasGroupUnread = useCallback((mtbId: string, caseId?: string | null): boolean => {
    return groupUnread.some(u => u.mtbId === mtbId && u.caseId === (caseId || null) && u.hasUnread);
  }, [groupUnread]);

  // Initial fetch
  useEffect(() => {
    fetchPrivateUnread();
    fetchGroupUnread();
  }, [fetchPrivateUnread, fetchGroupUnread]);

  // Subscribe to realtime updates for private messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-private-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          // If we're the recipient, update unread count
          if (newMsg.recipient_id === user.id) {
            fetchPrivateUnread();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPrivateUnread]);

  // Subscribe to realtime updates for group messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-group-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          // If message isn't from us, check for unread
          if (newMsg.sender_id !== user.id) {
            fetchGroupUnread();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchGroupUnread]);

  return {
    privateUnread,
    groupUnread,
    hasPrivateUnread,
    hasGroupUnread,
    markPrivateAsRead,
    markGroupAsRead,
    refetch: () => {
      fetchPrivateUnread();
      fetchGroupUnread();
    },
  };
}
