"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Circle, Clock, Ban, CheckCircle2 } from "lucide-react";
import { TASK_STATUSES, getTaskStatusInfo } from "../tasks/task-constants";

interface StatusSelectorProps {
  status: string;
  onChange: (status: string) => void;
  variant?: "badge" | "icon";
  className?: string;
}

export function StatusSelector({ status, onChange, variant = "badge", className = "" }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusInfo = getTaskStatusInfo(status);

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

  const handleSelect = (newStatus: string) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const StatusIcon = {
    pending: Circle,
    waiting_response: Clock,
    blocked: Ban,
    completed: CheckCircle2
  }[statusInfo.id];

  const statusColorClasses = {
    yellow: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
    orange: "text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300",
    red: "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300",
    green: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
  };

  const badgeColorClasses = {
    yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-500 dark:ring-yellow-900/10 dark:hover:bg-yellow-900/30",
    orange: "bg-orange-50 text-orange-800 ring-orange-600/20 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-500 dark:ring-orange-900/10 dark:hover:bg-orange-900/30",
    red: "bg-red-50 text-red-800 ring-red-600/20 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-500 dark:ring-red-900/10 dark:hover:bg-red-900/30",
    green: "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/10 dark:hover:bg-green-900/30"
  }[statusInfo.color];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center rounded-full p-1 transition-colors ${statusColorClasses[statusInfo.color]}`}
          title={statusInfo.label}
        >
          <StatusIcon className={`h-6 w-6 ${status === 'completed' ? "fill-current" : ""}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${badgeColorClasses}`}
        >
          {statusInfo.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700">
          <div className="py-1">
            {TASK_STATUSES.map((s) => {
              const ItemIcon = {
                pending: Circle,
                waiting_response: Clock,
                blocked: Ban,
                completed: CheckCircle2
              }[s.id];
              
              const isSelected = status === s.id;
              
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={`flex w-full items-center px-4 py-2 text-sm ${
                    isSelected 
                      ? "bg-gray-100 text-gray-900 dark:bg-zinc-700 dark:text-white" 
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  <ItemIcon 
                    className={`mr-3 h-4 w-4 flex-shrink-0 ${
                      {
                        gray: "text-gray-400",
                        yellow: "text-yellow-500",
                        orange: "text-orange-500",
                        red: "text-red-500",
                        green: "text-green-500"
                      }[s.color]
                    } ${s.id === 'completed' ? "fill-current" : ""}`} 
                  />
                  <span className="flex-grow text-left">{s.label}</span>
                  {isSelected && (
                    <Check className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
