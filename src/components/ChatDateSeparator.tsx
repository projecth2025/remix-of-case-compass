import { formatDateSeparator } from '@/lib/chatUtils';

interface ChatDateSeparatorProps {
  timestamp: string;
}

const ChatDateSeparator = ({ timestamp }: ChatDateSeparatorProps) => {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
        {formatDateSeparator(timestamp)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export default ChatDateSeparator;
