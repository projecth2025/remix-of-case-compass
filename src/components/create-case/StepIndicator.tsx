import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateCaseStep } from '@/types/vmtb';

const steps: { key: CreateCaseStep; label: string; shortLabel: string }[] = [
  { key: 'metadata', label: 'Patient & Case Info', shortLabel: 'Info' },
  { key: 'upload', label: 'Upload Documents', shortLabel: 'Upload' },
  { key: 'anonymization', label: 'Anonymization', shortLabel: 'Anonymize' },
  { key: 'digitization', label: 'Digitization', shortLabel: 'Digitize' },
  { key: 'review', label: 'Review & Create', shortLabel: 'Create' },
];

interface StepIndicatorProps {
  currentStep: CreateCaseStep;
  completedSteps: CreateCaseStep[];
  onStepClick?: (step: CreateCaseStep) => void;
}

export function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key);
            const isCurrent = step.key === currentStep;
            const isPast = index < currentIndex;
            const canClick = isPast || isCompleted;

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                {/* Step circle */}
                <button
                  onClick={() => canClick && onStepClick?.(step.key)}
                  disabled={!canClick}
                  className={cn(
                    'step-indicator relative z-10 transition-all duration-300',
                    isCurrent && 'step-indicator-active',
                    isCompleted && !isCurrent && 'step-indicator-complete',
                    !isCurrent && !isCompleted && 'step-indicator-pending',
                    canClick && 'cursor-pointer hover:scale-105',
                    !canClick && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 md:mx-4 relative">
                    <div className="absolute inset-0 bg-muted rounded-full" />
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500',
                        (isPast || isCompleted) ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex items-start justify-between mt-3">
          {steps.map((step, index) => {
            const isCurrent = step.key === currentStep;
            const isCompleted = completedSteps.includes(step.key);

            return (
              <div
                key={step.key}
                className={cn(
                  'flex-1 last:flex-initial text-center',
                  index < steps.length - 1 && 'pr-2 md:pr-4'
                )}
              >
                <p
                  className={cn(
                    'text-xs md:text-sm font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && !isCurrent && 'text-success',
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  <span className="hidden md:inline">{step.label}</span>
                  <span className="md:hidden">{step.shortLabel}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
