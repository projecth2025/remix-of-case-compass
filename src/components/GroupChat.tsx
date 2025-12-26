import { useState, useRef, useEffect } from 'react';
import { Send, Users, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface GroupChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isAnonymous?: boolean;
}

interface GroupChatProps {
  caseId: string;
  messages: GroupChatMessage[];
  onSendMessage: (content: string, isAnonymous: boolean) => void;
}

/**
 * GroupChat component displays anonymized group chat messages.
 * Messages can be sent anonymously using the toggle.
 */
const GroupChat = ({ caseId, messages, onSendMessage }: GroupChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), isAnonymous);
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
  const getParticipantLabel = (senderId: string, msgIsAnonymous?: boolean) => {
    // If message is anonymous, show "Anonymous" for everyone except the sender
    if (msgIsAnonymous) {
      if (senderId === user?.id) return 'You (Anonymous)';
      return 'Anonymous';
    }
    
    if (senderId === user?.id) return 'You';
    // Create consistent participant numbering based on sender ID
    const senderIds = [...new Set(messages.filter(m => !m.isAnonymous).map(m => m.senderId).filter(id => id !== user?.id))];
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
          <p className="text-sm text-muted-foreground">Collaborate with experts</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No messages yet. Start the group discussion!
          </div>
        )}
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === user?.id;
          const participantLabel = getParticipantLabel(msg.senderId, msg.isAnonymous);
          
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
            >
              <span className={`text-xs mb-1 flex items-center gap-1 ${msg.isAnonymous ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}>
                {msg.isAnonymous && <EyeOff className="w-3 h-3" />}
                {participantLabel}
              </span>
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
        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            {isAnonymous ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="anonymous-mode" className="text-sm text-muted-foreground cursor-pointer">
              {isAnonymous ? 'Sending anonymously' : 'Visible to others'}
            </Label>
          </div>
          <Switch
            id="anonymous-mode"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            aria-label="Toggle anonymous mode"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAnonymous ? "Type an anonymous message..." : "Type a message to the group..."}
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
