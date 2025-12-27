import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Folders,
  Users,
  Calendar,
  Plus,
  Video,
  UserPlus,
  ArrowLeft,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MTBSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOwner: boolean;
  onAddCase: () => void;
  onScheduleMeet: () => void;
  onAddExpert: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sections = [
  { id: 'mycases', label: 'My Cases', icon: FolderOpen },
  { id: 'allcases', label: 'All Cases', icon: Folders },
  { id: 'experts', label: 'Experts', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
];

const MTBSidebar = ({
  activeSection,
  onSectionChange,
  isOwner,
  onAddCase,
  onScheduleMeet,
  onAddExpert,
  onCollapsedChange,
}: MTBSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 z-40',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Fixed Hamburger Toggle Button */}
      <div className="flex items-center justify-start p-3 border-b border-border">
        <button
          onClick={handleToggleCollapse}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-3 flex flex-col">
        <div className="space-y-1 px-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={isCollapsed ? section.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{section.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-border" />

        {/* Actions - Add Case and Schedule Meet visible for all members */}
        <div className="space-y-1 px-2">
          <button
            onClick={onAddCase}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
            title={isCollapsed ? 'Add Case' : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Add Case</span>}
          </button>

          <button
            onClick={onScheduleMeet}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
            title={isCollapsed ? 'Schedule a Meet' : undefined}
          >
            <Video className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Schedule a Meet</span>}
          </button>

          {/* Add Experts - Only visible for owners */}
          {isOwner && (
            <button
              onClick={onAddExpert}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
              title={isCollapsed ? 'Add Experts' : undefined}
            >
              <UserPlus className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Add Experts</span>}
            </button>
          )}
        </div>

        {/* Spacer to push back button to bottom */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-border" />

        {/* Back Button */}
        <div className="px-2">
          <button
            onClick={() => navigate('/mtbs')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={isCollapsed ? 'Back to MTBs' : undefined}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Back</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default MTBSidebar;
