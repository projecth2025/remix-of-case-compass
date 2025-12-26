import { useState, useRef, useEffect } from 'react';
import { Send, Users } from 'lucide-react';
import { ChatMessage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface GroupChatProps {
  caseId: string;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

/**
 * GroupChat component displays anonymized group chat messages.
 * Messages are labeled with generic participant names for privacy.
 */
const GroupChat = ({ caseId, messages, onSendMessage }: GroupChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Generate anonymous participant labels based on sender ID
  const getParticipantLabel = (senderId: string, index: number) => {
    if (senderId === user?.id) return 'You';
    // Create consistent participant numbering based on sender ID
    const senderIds = [...new Set(messages.map(m => m.senderId).filter(id => id !== user?.id))];
    const participantIndex = senderIds.indexOf(senderId) + 1;
    return `Participant ${participantIndex}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Group Discussion</p>
          <p className="text-sm text-muted-foreground">Messages are anonymized</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No messages yet. Start the group discussion!
          </div>
        )}
        {messages.map((msg, index) => {
          const isOwnMessage = msg.senderId === user?.id;
          const participantLabel = getParticipantLabel(msg.senderId, index);
          
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
            >
              <span className="text-xs text-muted-foreground mb-1">{participantLabel}</span>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isOwnMessage
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message to the group..."
            className="flex-1 vmtb-input"
            aria-label="Group message input"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
