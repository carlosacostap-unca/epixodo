import React, { useState, useRef, useEffect } from "react";
import { RecurrenceRule, RECURRENCE_OPTIONS, RecurrenceFrequency } from "@/lib/recurrence-utils";
import { Repeat, ChevronDown, Check } from "lucide-react";

interface RecurrenceSelectorProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  className?: string;
}

export function RecurrenceSelector({ value, onChange, className = "" }: RecurrenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentFrequency = value?.frequency || 'none';
  const currentInterval = value?.interval || 1;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFrequencySelect = (freq: RecurrenceFrequency) => {
    if (freq === 'none') {
      onChange(null);
    } else {
      onChange({
        frequency: freq,
        interval: currentInterval,
        daysOfWeek: value?.daysOfWeek,
        endDate: value?.endDate
      });
    }
    setIsOpen(false);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value);
    if (interval < 1) return;
    if (value) {
      onChange({
        ...value,
        interval
      });
    }
  };

  const currentLabel = RECURRENCE_OPTIONS.find(o => o.value === currentFrequency)?.label || "Seleccionar";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-gray-500" />
        
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-md border-0 bg-transparent py-1.5 pl-2 pr-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-800"
          >
            <span>{currentLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>

          {isOpen && (
            <div className="absolute left-0 z-50 mt-1 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700">
              <div className="py-1">
                {RECURRENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFrequencySelect(option.value)}
                    className={`flex w-full items-center px-4 py-2 text-sm ${
                      currentFrequency === option.value
                        ? "bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-white"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    <span className="flex-grow text-left">{option.label}</span>
                    {currentFrequency === option.value && (
                      <Check className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {currentFrequency !== 'none' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>cada</span>
                <input 
                    type="number" 
                    min="1" 
                    value={currentInterval} 
                    onChange={handleIntervalChange}
                    className="w-16 rounded-md border-0 bg-transparent py-1.5 text-center text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-blue-600 dark:text-white dark:ring-zinc-700"
                />
                <span>
                    {currentFrequency === 'daily' ? 'días' : 
                     currentFrequency === 'weekly' ? 'semanas' : 
                     currentFrequency === 'monthly' ? 'meses' : 'años'}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}
