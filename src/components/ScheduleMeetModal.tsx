import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isBefore,
  startOfDay,
  getYear,
  setYear,
} from 'date-fns';

interface ScheduleMeetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mtbId: string;
  mtbName: string;
  onSchedule: (
    scheduledDate: Date,
    scheduledTime: string,
    scheduleType: 'once' | 'custom' | 'instant',
    repeatDays: number[] | null,
    explicitDates?: Date[] // Additional explicit dates
  ) => Promise<void>;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ScheduleMeetModal = ({
  open,
  onOpenChange,
  mtbName,
  onSchedule,
}: ScheduleMeetModalProps) => {
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [minuteInput, setMinuteInput] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Convert 12-hour to 24-hour format for storage
  const get24HourTime = (): string => {
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };

  // Check if the selected time is valid (not in the past for today)
  const isTimeValid = useMemo(() => {
    if (selectedDates.length === 0) return true;
    
    const firstDate = selectedDates[0];
    if (!isToday(firstDate)) return true;
    
    const now = new Date();
    const selectedTime24 = get24HourTime();
    const [hours, minutes] = selectedTime24.split(':').map(Number);
    
    const selectedDateTime = new Date(firstDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return selectedDateTime > now;
  }, [selectedDates, selectedHour, selectedMinute, selectedPeriod]);

  // Handle minute input change
  const handleMinuteInputChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue === '') {
      setMinuteInput('');
      setSelectedMinute(0);
      return;
    }
    
    const numValue = parseInt(numericValue, 10);
    
    // Limit to 2 digits and max 59
    if (numValue > 59) {
      setMinuteInput('59');
      setSelectedMinute(59);
    } else {
      setMinuteInput(numericValue.slice(0, 2));
      setSelectedMinute(numValue);
    }
  };

  // Handle minute input blur - pad single digits
  const handleMinuteBlur = () => {
    const paddedValue = selectedMinute.toString().padStart(2, '0');
    setMinuteInput(paddedValue);
  };

  // Calendar generation - moved before handleWeekdayToggle since it depends on daysInMonth
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const handleWeekdayToggle = (dayIndex: number) => {
    // Toggle weekday selection - this does NOT expand into individual dates
    // The recurring weekday is stored as ONE meeting with repeat_days set
    setSelectedWeekdays(prev => {
      const isCurrentlySelected = prev.includes(dayIndex);
      
      if (isCurrentlySelected) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  const handleDateToggle = (date: Date) => {
    // Don't allow selecting dates in the past
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return;

    setSelectedDates(prev => {
      const exists = prev.some(d => isSameDay(d, date));
      if (exists) {
        return prev.filter(d => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  };

  const isDateSelected = (date: Date) => {
    // Check if date is explicitly selected OR if it matches a selected weekday
    const dayOfWeek = getDay(date);
    const matchesWeekday = selectedWeekdays.includes(dayOfWeek) && !isBefore(startOfDay(date), startOfDay(new Date()));
    return matchesWeekday || selectedDates.some(d => isSameDay(d, date));
  };

  const handleSchedule = async () => {
    if (selectedDates.length === 0 && selectedWeekdays.length === 0) return;
    if (!isTimeValid) return;

    setIsSubmitting(true);
    try {
      const time24 = get24HourTime();
      
      // Determine schedule type
      const hasRecurrence = selectedWeekdays.length > 0;
      
      // Explicit dates are ONLY dates that don't match a recurring weekday
      // Filter out any dates that match a selected weekday to avoid duplicates
      const explicitDates = selectedDates.filter(date => {
        const dayOfWeek = getDay(date);
        return !selectedWeekdays.includes(dayOfWeek);
      }).sort((a, b) => a.getTime() - b.getTime());
      
      const hasExplicitDates = explicitDates.length > 0;
      
      if (hasRecurrence && hasExplicitDates) {
        // Both recurrence and explicit dates - create separate meetings
        const baseDate = new Date();
        const scheduledDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          12, 0, 0, 0
        );
        
        await onSchedule(
          scheduledDate,
          time24,
          'custom',
          selectedWeekdays,
          explicitDates // Pass only truly explicit dates (not matching recurring days)
        );
      } else if (hasRecurrence) {
        // Only recurrence
        const baseDate = new Date();
        const scheduledDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          12, 0, 0, 0
        );
        
        await onSchedule(
          scheduledDate,
          time24,
          'custom',
          selectedWeekdays
        );
      } else if (!hasRecurrence && selectedDates.length > 0) {
        // Only explicit dates (one-time meetings)
        const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        const baseDate = sortedDates[0];
        const scheduledDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          12, 0, 0, 0
        );
        
        await onSchedule(
          scheduledDate,
          time24,
          'once',
          null
        );
      }
      
      onOpenChange(false);
      resetState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantMeeting = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      await onSchedule(
        now,
        time24,
        'instant',
        null
      );
      
      onOpenChange(false);
      resetState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedHour(10);
    setSelectedMinute(0);
    setMinuteInput('00');
    setSelectedPeriod('AM');
    setSelectedWeekdays([]);
    setSelectedDates([]);
    setCurrentMonth(new Date());
  };

  const isValid = (selectedDates.length > 0 || selectedWeekdays.length > 0) && isTimeValid;

  // Create empty cells for days before month starts
  const emptyCells = Array(startDayOfWeek).fill(null);

  // Year options (current year + 10 years)
  const currentYear = getYear(new Date());
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear + i);

  const handleYearChange = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year));
    setShowYearDropdown(false);
  };

  // Hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-2 pb-1.5 border-b border-border flex-shrink-0">
          <DialogTitle className="text-base font-semibold text-foreground">
            Schedule a Meeting
          </DialogTitle>
          <p className="text-xs text-muted-foreground -mt-1">
            {mtbName}
          </p>
        </DialogHeader>

        <div className="px-6 py-1.5 space-y-1.5 overflow-y-auto hide-scrollbar flex-1">
          {/* Instant Meeting Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleInstantMeeting}
            disabled={isSubmitting}
            className="w-full gap-2 border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground text-primary transition-colors"
          >
            <Zap className="w-4 h-4" />
            Start Instant Meeting
          </Button>

          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground">or schedule</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Time Picker - 12-hour format with AM/PM */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Time</label>
            <div className="flex items-center justify-center gap-2">
              {/* Hour */}
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                className="text-sm font-light py-1.5 px-1.5 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer text-center w-12"
              >
                {hourOptions.map(hour => (
                  <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</option>
                ))}
              </select>
              
              <span className="text-sm font-light text-foreground">:</span>
              
              {/* Minute - Combined dropdown + typing input */}
              <div className="relative w-12">
                <select
                  value={selectedMinute}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSelectedMinute(val);
                    setMinuteInput(val.toString().padStart(2, '0'));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(min => (
                    <option key={min} value={min}>{min.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={minuteInput}
                  onChange={(e) => handleMinuteInputChange(e.target.value)}
                  onBlur={handleMinuteBlur}
                  className="text-sm font-light py-1.5 px-1.5 border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center w-12 h-auto min-h-0"
                  maxLength={2}
                />
              </div>

              {/* AM/PM Toggle */}
              <div className="flex border-2 border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={cn(
                    'px-1.5 py-1.5 text-sm font-light transition-all w-12',
                    selectedPeriod === 'AM'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={cn(
                    'px-1.5 py-1.5 text-sm font-light transition-all w-12',
                    selectedPeriod === 'PM'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  PM
                </button>
              </div>
            </div>
            
            {/* Time validation message */}
            {!isTimeValid && (
              <p className="text-xs text-destructive text-center">
                Selected time has already passed. Please choose a future time.
              </p>
            )}
          </div>

          {/* Weekday Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Repeat Weekly</label>
            <div className="flex justify-between gap-2">
              {dayLabels.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleWeekdayToggle(index)}
                  className={cn(
                    'w-9 h-9 rounded-full text-sm font-medium transition-all duration-200',
                    selectedWeekdays.includes(index)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedWeekdays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Repeats every {selectedWeekdays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(', ')}
              </p>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Select Date(s)</label>
              <div className="flex items-center gap-2">
                {/* Month navigation */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className="text-sm font-medium text-foreground min-w-[80px] text-center">
                    {format(currentMonth, 'MMMM')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Year selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowYearDropdown(!showYearDropdown)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {getYear(currentMonth)}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                  
                  {showYearDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {yearOptions.map(year => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleYearChange(year)}
                          className={cn(
                            'w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors',
                            getYear(currentMonth) === year && 'bg-primary/10 text-primary font-medium'
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-muted/30 rounded-xl p-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {dayLabels.map((label, index) => (
                  <div
                    key={index}
                    className="h-7 flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {emptyCells.map((_, index) => (
                  <div key={`empty-${index}`} className="h-8" />
                ))}
                {daysInMonth.map((day) => {
                  const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                  const isSelected = isDateSelected(day);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateToggle(day)}
                      disabled={isPast}
                      className={cn(
                        'h-8 w-full rounded-lg text-sm font-medium transition-all duration-200',
                        isPast && 'text-muted-foreground/40 cursor-not-allowed',
                        !isPast && !isSelected && 'hover:bg-muted text-foreground',
                        isSelected && 'bg-primary text-primary-foreground shadow-md',
                        isTodayDate && !isSelected && 'ring-1 ring-primary/50'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-3 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!isValid || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMeetModal;