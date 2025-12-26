import { FileText, Pencil, Check, X, Microscope, Heart, Beaker, Dna } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatFileSize, UploadedFile } from '@/lib/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileCardProps {
  file: UploadedFile;
  onCategoryChange: (category: string) => void;
  onRemove: () => void;
  onNameChange?: (newName: string) => void;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
}

const fileCategories = [
  'Clinical Notes',
  'Pathology',
  'Radiology',
  'Lab Results',
  'Genomic Report',
  'Other',
];

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'Clinical Notes':
      return <FileText className="w-6 h-6 text-muted-foreground" />;
    case 'Pathology':
      return <Microscope className="w-6 h-6 text-muted-foreground" />;
    case 'Radiology':
      return <Heart className="w-6 h-6 text-muted-foreground" />;
    case 'Lab Results':
      return <Beaker className="w-6 h-6 text-muted-foreground" />;
    case 'Genomic Report':
      return <Dna className="w-6 h-6 text-muted-foreground" />;
    default:
      return <FileText className="w-6 h-6 text-muted-foreground" />;
  }
};

const FileCard = ({ file, onCategoryChange, onRemove, onNameChange, isEditing = false, onEditStart, onEditCancel }: FileCardProps) => {
  const [editedName, setEditedName] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onEditCancel?.();
        setEditedName(file.name);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, onEditCancel, file.name]);

  const handleEditClick = () => {
    onEditStart?.();
  };

  const handleSaveClick = () => {
    if (editedName.trim()) {
      onNameChange?.(editedName.trim());
      onEditCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      setEditedName(file.name);
      onEditCancel?.();
    }
  };

  return (
    <div ref={containerRef} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
      <div className="flex items-center gap-3 flex-1">
        {getIconForCategory(file.fileCategory)}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-[60%] font-medium text-foreground bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleSaveClick}
                  className="p-1 hover:bg-primary/10 rounded transition-colors text-primary flex-shrink-0"
                  aria-label="Save filename"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{file.name}</span>
                <button
                  onClick={handleEditClick}
                  className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Edit filename"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={file.fileCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fileCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={onRemove}
          className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FileCard;
