import { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { Expert } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateMessages } from '@/hooks/usePrivateMessages';
import { formatMessageTime, isDifferentDay } from '@/lib/chatUtils';
import ChatDateSeparator from '@/components/ChatDateSeparator';

interface PrivateChatBoxProps {
  expert: Expert;
  caseId: string;
}

const PrivateChatBox = ({ expert, caseId }: PrivateChatBoxProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = usePrivateMessages(expert.id, caseId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (message.trim()) {
      const success = await sendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {expert.avatar ? (
            <img 
              src={expert.avatar} 
              alt={expert.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{expert.name}</p>
          <p className="text-sm text-muted-foreground">{expert.specialty}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === user?.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = !prevMessage || isDifferentDay(prevMessage.createdAt, msg.createdAt);
            
            return (
              <div key={msg.id}>
                {showDateSeparator && <ChatDateSeparator timestamp={msg.createdAt} />}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div className={`text-[10px] mt-1 text-right ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 vmtb-input"
            aria-label="Private message input"
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

export default PrivateChatBox;
