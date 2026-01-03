"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Modal } from "@/components/ui/modal";
import { Loader2, CheckCircle2, X, Plus, Link as LinkIcon, Circle, Ban, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { fromInputDateToUTC, formatDate } from "@/lib/date-utils";
import { MatterSelectorModal } from "../matters/matter-selector-modal";
import { ActivitySelectorModal } from "../activities/activity-selector-modal";
import { getTaskStatusInfo } from "./task-constants";
import { StatusSelector } from "@/components/ui/status-selector";
import { RecurrenceSelector } from "@/components/ui/recurrence-selector";
import { RecurrenceRule, formatRecurrenceRule, calculateNextDueDate } from "@/lib/recurrence-utils";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialActivityId?: string;
  initialMatterId?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  initialActivityId,
  initialMatterId,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);

  // Association State
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedMatter, setSelectedMatter] = useState<any>(null);
  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
  const [isMatterSelectorOpen, setIsMatterSelectorOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setPlannedDate("");
      setRecurrence(null);
      setStatus("pending");
      setLoading(false);
      setIsPlanningOpen(false);

      // Load initial associations
      const loadInitialAssociation = async () => {
        if (initialActivityId) {
          try {
            const record = await pb.collection("activities").getOne(initialActivityId);
            setSelectedActivity(record);
            setSelectedMatter(null);
          } catch (e) {
            console.error("Error loading initial activity:", e);
          }
        } else if (initialMatterId) {
          try {
            const record = await pb.collection("matters").getOne(initialMatterId);
            setSelectedMatter(record);
            setSelectedActivity(null);
          } catch (e) {
            console.error("Error loading initial matter:", e);
          }
        } else {
          setSelectedActivity(null);
          setSelectedMatter(null);
        }
      };
      loadInitialAssociation();
    }
  }, [isOpen, initialActivityId, initialMatterId]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const data = {
        title,
        description,
        status,
        completed: status === 'completed',
        due_date: dueDate ? fromInputDateToUTC(dueDate) : null,
        planned_date: plannedDate ? fromInputDateToUTC(plannedDate) : null,
        recurrence: recurrence ? JSON.stringify(recurrence) : null,
        activity: selectedActivity?.id || null,
        matter: selectedMatter?.id || null,
        user: pb.authStore.model?.id,
      };

      await pb.collection("tasks").create(data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssociationSelect = (type: 'activity' | 'matter', item: any) => {
    if (type === 'activity') {
      setSelectedActivity(item);
      setSelectedMatter(null); // Mutual exclusivity
    } else {
      setSelectedMatter(item);
      setSelectedActivity(null); // Mutual exclusivity
    }
  };

  const handleRemoveAssociation = () => {
    setSelectedActivity(null);
    setSelectedMatter(null);
  };

  const getRecurrenceFeedback = () => {
    if (!recurrence || recurrence.frequency === 'none') return null;
    const ruleText = formatRecurrenceRule(recurrence);
    
    let baseDateObj = new Date();
    if (dueDate) {
         const [y, m, d] = dueDate.split('-').map(Number);
         baseDateObj = new Date(y, m - 1, d);
    }
    
    const nextDate = calculateNextDueDate(baseDateObj, recurrence);
    
    // Capitalize first letter
    const formattedRule = ruleText.charAt(0).toUpperCase() + ruleText.slice(1);
    
    if (!nextDate) return formattedRule;
    
    return `${formattedRule} (próxima: ${formatDate(nextDate)})`;
  };

  const recurrenceFeedback = getRecurrenceFeedback();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        {/* Header with Title Input */}
        <div className="flex items-start gap-4">
          <StatusSelector
            status={status}
            onChange={setStatus}
            variant="icon"
            className="mt-1"
          />
          
          <div className="flex-grow">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-transparent text-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white ${status === 'completed' ? 'text-gray-500 line-through' : ''}`}
              placeholder="Título de la tarea"
              autoFocus
            />
          </div>
        </div>

        {/* Priority Fields Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Status - Now secondary since it's also in header, but kept for clarity or removed? 
              User requirement: 2. Estado.
              I have it in the header as icon, maybe I should keep the dropdown here or rely on the header icon?
              The prompt says "Reordenar campos... 2. Estado".
              I'll keep the dropdown here as well for explicit selection.
          */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estado</span>
            <StatusSelector
              status={status}
              onChange={setStatus}
              variant="badge"
            />
          </div>

          {/* Due Date - 3. Fecha de vencimiento */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vencimiento</span>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border-0 bg-gray-50/50 px-2.5 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-800/50 dark:text-white dark:ring-zinc-700 dark:focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Planning - 4. Planificación */}
        <div className="mt-6 border-t border-gray-100 pt-4 dark:border-zinc-800">
           <button 
             onClick={() => setIsPlanningOpen(!isPlanningOpen)}
             className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
           >
             {isPlanningOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
             Planificación y Detalles
           </button>
           
           {isPlanningOpen && (
             <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 animate-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha Planificada</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                      className="w-full rounded-md border-0 bg-blue-50/50 px-2.5 py-1.5 text-sm text-blue-900 ring-1 ring-inset ring-blue-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-blue-900/10 dark:text-blue-100 dark:ring-blue-900/30 dark:focus:ring-blue-500"
                    />
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* Recurrence & Association - 5 & 6 */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
           {/* Recurrence */}
           <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Recurrencia</span>
            <RecurrenceSelector
              value={recurrence}
              onChange={setRecurrence}
            />
            {recurrenceFeedback && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                {recurrenceFeedback}
              </p>
            )}
          </div>

          {/* Association */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Asociación</span>
            
            <div className="flex flex-wrap items-center gap-3">
              {selectedActivity ? (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">{selectedActivity.title}</span>
                  <button 
                    onClick={handleRemoveAssociation}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    title="Quitar asociación"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : selectedMatter ? (
                <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-1.5 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">Asunto: {selectedMatter.title}</span>
                  <button 
                    onClick={handleRemoveAssociation}
                    className="ml-1 rounded-full p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    title="Quitar asociación"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Sin asociación</span>
              )}

              {/* Association Controls */}
              {!selectedActivity && !selectedMatter && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsActivitySelectorOpen(true)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Actividad
                  </button>
                  <button
                    onClick={() => setIsMatterSelectorOpen(true)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Asunto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description - 7 */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
           <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</label>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Escribe una descripción..."
                />
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear Tarea
          </button>
        </div>
      </div>

      <MatterSelectorModal
        isOpen={isMatterSelectorOpen}
        onClose={() => setIsMatterSelectorOpen(false)}
        onSelect={(matter) => handleAssociationSelect('matter', matter)}
      />
      
      <ActivitySelectorModal
        isOpen={isActivitySelectorOpen}
        onClose={() => setIsActivitySelectorOpen(false)}
        onSelect={(activity) => handleAssociationSelect('activity', activity)}
      />
    </Modal>
  );
}
