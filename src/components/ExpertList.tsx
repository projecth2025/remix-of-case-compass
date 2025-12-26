import { Expert } from '@/lib/storage';

interface ExpertListProps {
  experts: Expert[];
  selectedExpert: Expert | null;
  onSelectExpert: (expert: Expert) => void;
}

const ExpertList = ({ experts, selectedExpert, onSelectExpert }: ExpertListProps) => {
  return (
    <div className="space-y-2">
      {experts.map(expert => (
        <button
          key={expert.id}
          onClick={() => onSelectExpert(expert)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
            selectedExpert?.id === expert.id
              ? 'bg-primary/10'
              : 'hover:bg-muted'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-sky-300 rounded-full opacity-80" />
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground">{expert.name}</p>
            <p className="text-sm text-muted-foreground">{expert.specialty}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ExpertList;
