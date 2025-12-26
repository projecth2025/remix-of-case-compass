import { Expert } from '@/lib/storage';
import { User } from 'lucide-react';

interface ExpertListProps {
  experts: Expert[];
  selectedExpert: Expert | null;
  onSelectExpert: (expert: Expert) => void;
  hasUnread?: (expertId: string) => boolean;
}

const ExpertList = ({ experts, selectedExpert, onSelectExpert, hasUnread }: ExpertListProps) => {
  return (
    <div className="space-y-2">
      {experts.map(expert => {
        const showUnread = hasUnread?.(expert.id) || false;
        
        return (
          <button
            key={expert.id}
            onClick={() => onSelectExpert(expert)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              selectedExpert?.id === expert.id
                ? 'bg-primary/10'
                : 'hover:bg-muted'
            }`}
          >
            <div className="relative">
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
              {/* Unread indicator */}
              {showUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{expert.name}</p>
              <p className="text-sm text-muted-foreground truncate">{expert.specialty}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ExpertList;
