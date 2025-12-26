import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CANCER_TYPES = [
  'Acute Lymphoblastic Leukemia',
  'Acute Myeloid Leukemia',
  'Ampullary Adenocarcinoma',
  'Anal Carcinoma',
  'Appendiceal Neoplasms and Cancers',
  'Basal Cell Skin Cancer',
  'B-Cell Lymphomas',
  'Biliary Tract Cancers',
  'Bladder Cancer',
  'Bone Cancer',
  'Breast Cancer',
  'Castleman Disease',
  'Central Nervous System Cancers',
  'Cervical Cancer',
  'Chronic Lymphocytic Leukemia/Small Lymphocytic Lymphoma',
  'Chronic Myeloid Leukemia',
  'Colon Cancer',
  'Cutaneous Lymphomas',
  'Dermatofibrosarcoma Protuberans',
  'Esophageal and Esophagogastric Junction Cancers',
  'Gastric Cancer',
  'Gastrointestinal Stromal Tumors',
  'Gestational Trophoblastic Neoplasia',
  'Hairy Cell Leukemia',
  'Head and Neck Cancers',
  'Hepatobiliary Cancers',
  'Hepatocellular Carcinoma',
  'Histiocytic Neoplasms',
  'Hodgkin Lymphoma',
  'Kaposi Sarcoma',
  'Kidney Cancer',
  'Melanoma: Cutaneous',
  'Melanoma: Uveal',
  'Merkel Cell Carcinoma',
  'Mesothelioma: Peritoneal',
  'Mesothelioma: Pleural',
  'Multiple Myeloma',
  'Myelodysplastic Syndromes',
  'Myeloid/Lymphoid Neoplasms with Eosinophilia and Tyrosine Kinase Gene Fusions',
  'Myeloproliferative Neoplasms',
  'Neuroblastoma',
  'Neuroendocrine and Adrenal Tumors',
  'Non-Small Cell Lung Cancer',
  'Occult Primary',
  'Ovarian Cancer/Fallopian Tube Cancer/Primary Peritoneal Cancer',
  'Pancreatic Adenocarcinoma',
  'Pediatric Acute Lymphoblastic Leukemia',
  'Pediatric Aggressive Mature B-Cell Lymphomas',
  'Pediatric Central Nervous System Cancers',
  'Pediatric Hodgkin Lymphoma',
  'Penile Cancer',
  'Prostate Cancer',
  'Rectal Cancer',
  'Small Bowel Adenocarcinoma',
  'Small Cell Lung Cancer',
  'Soft Tissue Sarcoma',
  'Squamous Cell Skin Cancer',
  'Systemic Light Chain Amyloidosis',
  'Systemic Mastocytosis',
  'T-Cell Lymphomas',
  'Testicular Cancer',
  'Thymomas and Thymic Carcinomas',
  'Thyroid Carcinoma',
  'Uterine Neoplasms',
  'Vaginal Cancer',
  'Vulvar Cancer',
  "Waldenström Macroglobulinemia/Lymphoplasmacytic Lymphoma",
  'Wilms Tumor (Nephroblastoma)',
];

interface CancerTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CancerTypeSelect = ({
  value,
  onChange,
  placeholder = 'Select cancer type',
  className,
}: CancerTypeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = CANCER_TYPES.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn('vmtb-input h-10 w-full pr-10', className)}
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm hover:bg-primary hover:text-primary-foreground transition-colors',
                  value === option && 'bg-primary/10 text-primary font-medium'
                )}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No cancer types found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CancerTypeSelect;
