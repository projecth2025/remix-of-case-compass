import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROFESSIONS = [
  'Medical oncologist',
  'Surgical oncologist',
  'Radiation oncologist',
  'Hematologist-oncologist',
  'Radiologist',
  'Pathologist',
  'Molecular pathologist',
  'Medical physicist',
  'Dosimetrist',
  'Radiation therapist',
  'Oncology nurse / staff nurse',
  'Infusion nurse',
  'Oncology pharmacist',
  'Palliative care specialist',
  'Dietitian / oncology nutritionist',
  'Genetic counselor',
  'Cardio-oncologist',
  'Pulmonologist',
  'Nephrologist',
  'Hepatologist',
  'Endocrinologist',
  'Oral surgeon',
  'Administrative staff',
];

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const ProfessionSelect = ({ value, onChange, className, placeholder = 'Select or type profession' }: ProfessionSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!inputValue.trim() && value) {
          setInputValue(value);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value]);

  const filteredProfessions = PROFESSIONS.filter(profession =>
    profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    onChange(newValue);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (profession: string) => {
    setInputValue(profession);
    setSearchTerm('');
    onChange(profession);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(inputValue);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'vmtb-input pr-10',
            className
          )}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
        >
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredProfessions.length > 0 ? (
            filteredProfessions.map((profession) => (
              <button
                key={profession}
                type="button"
                onClick={() => handleSelect(profession)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between',
                  value === profession && 'bg-primary/10 text-primary'
                )}
              >
                {profession}
                {value === profession && <Check className="w-4 h-4" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching professions. Your custom value will be used.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionSelect;
