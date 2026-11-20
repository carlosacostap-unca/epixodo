"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { compareDateOnly, getSubjectPath, getTaskAvailableDeliverables, getTaskAvailablePhases, isActiveTask, taskPriorities, taskStatuses, type Subject, type SubjectDeliverable, type SubjectPhase, type Task, type TaskDraft, type TaskPriority, type TaskStatus } from "../../lib/tasks";
import { controlClass, FieldLabel, formatDate, getPhaseLabel, getPriorityLabel, getStatusLabel, getSubjectTreeItems, SubjectChips, TaskBadge, TaskEmptyState } from "./task-ui";
import ui from "../../components/workspace-screen.module.css";
import type { TaskPatch } from "./task-operations";

const buttonClass = `${ui.button} h-10 rounded-md border border-[#344562] px-4 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30`;
const primaryButtonClass = `${ui.button} ${ui.primary} h-10 rounded-md border border-[#8ab4f8] bg-[#8ab4f8] px-4 text-sm font-black text-[#07111f] transition hover:bg-[#a6c8ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/40`;
const closeButtonClass = `${ui.button} ${ui.iconButton} flex h-9 w-9 items-center justify-center rounded-md border border-[#344562] text-lg font-black text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30`;
const titleInputClass = `${ui.control} h-12 min-w-0 rounded-lg border border-[#33435f] bg-[#0c1320] px-4 text-base font-semibold text-[#eef4ff] outline-none transition placeholder:text-[#6d7b97] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20`;
const readOnlyFieldClass = `${ui.inset} rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-2`;

export function TaskEditModal({
  task,
  subjects,
  deliverables,
  phases,
  today,
  onPatch,
  onDelete,
  onClose,
  getAvailableParentTasksForTask,
  embedded = false,
  onAssignSubjects,
}: {
  task: Task | null;
  subjects: Subject[];
  deliverables: SubjectDeliverable[];
  phases: SubjectPhase[];
  today: string;
  onPatch: (taskId: string, patch: TaskPatch) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  getAvailableParentTasksForTask: (taskId: string) => Task[];
  embedded?: boolean;
  onAssignSubjects?: (taskId: string, subjectIds: string[]) => string | undefined;
}) {
  const [draft, setDraft] = useState<TaskPatch | null>(null);
  const [error, setError] = useState("");
  const isEditing = draft !== null;
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);
  const titleId = useId();

  if (!task) {
    return null;
  }

  const edited = { ...task, ...draft };
  const patchDraft = (updates: TaskPatch) => {
    setError("");
    setDraft((current) => ({ ...current, ...updates }));
  };

  const isCompleted = task.status === "completed";
  const isDueToday = task.venceEl === today;
  const isOverdue =
    Boolean(task.venceEl) && compareDateOnly(task.venceEl as string, today) < 0 && !isCompleted;
  const isUnplanned = isActiveTask(task) && Boolean(task.venceEl) && !task.hacerEl;
  const parentOptions = getAvailableParentTasksForTask(task.id);
  const parentTask = parentOptions.find((option) => option.id === task.parentTaskId);
  const availablePhases = getTaskAvailablePhases(phases, edited.subjectIds);
  const availableDeliverables = getTaskAvailableDeliverables(
    deliverables,
    edited.subjectIds,
  );
  const selectedPhase = phases.find((phase) => phase.id === task.phaseId) ?? null;
  const selectedDeliverable =
    deliverables.find((deliverable) => deliverable.id === task.deliverableId) ?? null;

  function handleClose() {
    setDraft(null);
    setError("");
    onClose();
  }

  const content = (
    <>
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Detalle de tarea</p>
            <h3 id={titleId} className={embedded ? `${ui.panelTitle} mt-1 break-words` : "mt-1 break-words text-xl font-black text-[#eef4ff]"}>
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className={closeButtonClass}
          >
            ×
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <TaskBadge tone={task.status === "waiting" ? "info" : "neutral"}>
              {getStatusLabel(task.status)}
            </TaskBadge>
            {isOverdue ? <TaskBadge tone="danger">Vencida</TaskBadge> : null}
            {isDueToday ? <TaskBadge tone="warning">Vence hoy</TaskBadge> : null}
            {isUnplanned ? <TaskBadge tone="warning">Sin plan</TaskBadge> : null}
          </div>

          {embedded && !isEditing ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#263852] py-3">
              <SubjectChips subjects={subjects} subjectIds={task.subjectIds} />
              <button type="button" onClick={() => setIsSubjectPickerOpen(true)} className={`${ui.button} ${ui.primary} min-h-11 rounded-md bg-[#b4cdf5] px-3 text-sm font-bold text-[#101922] hover:bg-[#d1e2fc]`}>
                Asignar asuntos
              </button>
            </div>
          ) : null}
          {isEditing ? (
            <>
              <input
                value={edited.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                aria-label="Título de la tarea"
                className={titleInputClass}
              />

              <textarea
                value={edited.notes}
                onChange={(event) => patchDraft({ notes: event.target.value })}
                rows={4}
                aria-label="Notas"
                placeholder="Notas"
                className={`${ui.control} w-full resize-none rounded-md border border-[#2f3e59] bg-[#101827] px-3 py-2 text-sm text-[#cbd7ee] outline-none transition placeholder:text-[#61708d] focus:border-[#8ab4f8] focus:ring-2 focus:ring-[#8ab4f8]/20`}
              />
            </>
          ) : (
            <>
              {!embedded ? (
                <div className={`${ui.inset} rounded-lg border border-[#2f3e59] bg-[#101827] px-4 py-3`}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Título</p>
                  <p className="mt-1 text-base font-semibold text-[#eef4ff]">{task.title}</p>
                </div>
              ) : null}

              <div className={`${ui.inset} min-h-24 rounded-lg border border-[#2f3e59] bg-[#101827] px-4 py-3`}>
                <p className="text-[11px] font-bold uppercase text-[#8090ad]">Notas</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#cbd7ee]">
                  {task.notes || "Sin notas"}
                </p>
              </div>
            </>
          )}

          <div className={embedded ? "grid gap-3 min-[380px]:grid-cols-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
            {isEditing ? (
              <>
                <FieldLabel label="Estado">
                  <select
                    value={edited.status}
                    onChange={(event) => patchDraft({ status: event.target.value as TaskStatus })}
                    className={controlClass}
                  >
                    {taskStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Depende de">
                  <select
                    value={edited.parentTaskId ?? ""}
                    onChange={(event) =>
                      patchDraft({ parentTaskId: event.target.value || null })
                    }
                    className={controlClass}
                  >
                    <option value="">Tarea raiz</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Hacer el">
                  <input
                    type="date"
                    value={edited.hacerEl ?? ""}
                    onChange={(event) =>
                      patchDraft({ hacerEl: event.target.value || null })
                    }
                    className={controlClass}
                  />
                </FieldLabel>

                <FieldLabel label="Vence el">
                  <input
                    type="date"
                    value={edited.venceEl ?? ""}
                    onChange={(event) =>
                      patchDraft({ venceEl: event.target.value || null })
                    }
                    className={controlClass}
                  />
                </FieldLabel>

                <FieldLabel label="Prioridad">
                  <select
                    value={edited.priority}
                    onChange={(event) => patchDraft({ priority: event.target.value as TaskPriority })}
                    className={controlClass}
                  >
                    {taskPriorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Fase">
                  <select
                    value={edited.phaseId ?? ""}
                    onChange={(event) =>
                      patchDraft({ phaseId: event.target.value || null })
                    }
                    className={controlClass}
                  >
                    <option value="">{embedded ? "Sin fase" : "Directamente en el asunto"}</option>
                    {availablePhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {getSubjectPath(subjects, phase.subjectId)} · {phase.name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Entregable">
                  <select
                    value={edited.deliverableId ?? ""}
                    onChange={(event) =>
                      patchDraft({ deliverableId: event.target.value || null })
                    }
                    className={controlClass}
                  >
                    <option value="">Sin entregable</option>
                    {availableDeliverables.map((deliverable) => (
                      <option key={deliverable.id} value={deliverable.id}>
                        {getSubjectPath(subjects, deliverable.subjectId)} · {deliverable.name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel label="Asuntos">
                  <div className={`${ui.inset} grid min-h-24 gap-3 rounded-md border border-[#32415d] bg-[#0f1726] px-3 py-3`}>
                    <SubjectChips subjects={subjects} subjectIds={edited.subjectIds} />
                    <button
                      type="button"
                      onClick={() => setIsSubjectPickerOpen(true)}
                      className={`${ui.button} h-10 w-fit rounded-md border border-[#344562] px-3 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30`}
                    >
                      Añadir asuntos
                    </button>
                  </div>
                </FieldLabel>
              </>
            ) : (
              <>
                {!embedded ? <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Estado</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getStatusLabel(task.status)}
                  </p>
                </div> : null}
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Entregable</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {selectedDeliverable?.name ?? "Sin entregable"}
                  </p>
                  {selectedDeliverable ? (
                    <p className="mt-1 text-xs text-[#91a0bb]">
                      {getSubjectPath(subjects, selectedDeliverable.subjectId)}
                    </p>
                  ) : null}
                </div>
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Depende de</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {parentTask?.title ?? "Tarea raiz"}
                  </p>
                </div>
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Hacer el</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {task.hacerEl ? formatDate(task.hacerEl) : "Sin fecha"}
                  </p>
                </div>
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Vence el</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {task.venceEl ? formatDate(task.venceEl) : "Sin fecha"}
                  </p>
                </div>
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Prioridad</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getPriorityLabel(task.priority)}
                  </p>
                </div>
                <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Fase</p>
                  <p className="mt-1 text-sm font-semibold text-[#dce6f8]">
                    {getPhaseLabel(phases, task.phaseId)}
                  </p>
                  {selectedPhase ? (
                    <p className="mt-1 text-xs text-[#91a0bb]">
                      {getSubjectPath(subjects, selectedPhase.subjectId)}
                    </p>
                  ) : null}
                </div>
                {!embedded ? <div className={readOnlyFieldClass}>
                  <p className="text-[11px] font-bold uppercase text-[#8090ad]">Asuntos</p>
                  <div className="mt-2">
                    <SubjectChips subjects={subjects} subjectIds={task.subjectIds} />
                  </div>
                </div> : null}
              </>
            )}
          </div>

          {error ? <p role="alert" className="text-sm text-[#ff9d88]">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("¿Borrar la tarea «" + task.title + "»?")) return;
                onDelete(task.id);
                handleClose();
              }}
              className={`${ui.button} ${ui.danger} h-10 rounded-md border border-[#55352f] px-4 text-sm font-bold text-[#ff9d88] transition hover:border-[#7a3d32] hover:bg-[#2e1716] focus:outline-none focus:ring-2 focus:ring-[#ff9d88]/30`}
            >
              Borrar
            </button>
            {isEditing ? (
              <>
              <button type="button" onClick={() => { setDraft(null); setError(""); }} className={`${ui.button} min-h-10 px-3 text-sm font-semibold text-[#c9d6e8] hover:bg-[#182238]`}>Cancelar</button>
              <button
                type="button"
                disabled={!edited.title.trim()}
                onClick={() => {
                  if (draft?.subjectIds?.some((id) => !subjects.some((subject) => subject.id === id))) {
                    setError("Uno de los asuntos elegidos ya no está disponible.");
                    return;
                  }
                  if (draft && Object.keys(draft).length) onPatch(task.id, draft);
                  setDraft(null);
                }}
                className={primaryButtonClass}
              >
                Guardar cambios
              </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({});
                  }}
                  className={buttonClass}
                >
                  Editar
                </button>
                {!embedded ? <button
                  type="button"
                  onClick={handleClose}
                  className={primaryButtonClass}
                >
                  Cerrar
                </button> : null}
              </>
            )}
          </div>
        </div>
      <TaskSubjectPickerModal
        key={`${task.id}-${isSubjectPickerOpen ? "open" : "closed"}`}
        isOpen={isSubjectPickerOpen}
        subjects={subjects}
        selectedSubjectIds={edited.subjectIds}
        onApply={(subjectIds) => {
          if (isEditing) {
            patchDraft({
              subjectIds,
              phaseId: phases.some(({ id, subjectId }) => id === edited.phaseId && subjectIds.includes(subjectId)) ? edited.phaseId : null,
              deliverableId: deliverables.some(({ id, subjectId }) => id === edited.deliverableId && subjectIds.includes(subjectId)) ? edited.deliverableId : null,
            });
          } else if (onAssignSubjects) {
            const error = onAssignSubjects(task.id, subjectIds);
            if (error) return error;
          } else {
            onPatch(task.id, { subjectIds });
          }
          setIsSubjectPickerOpen(false);
        }}
        onClose={() => setIsSubjectPickerOpen(false)}
      />
    </>
  );

  if (embedded) return <section aria-labelledby={titleId} className="min-w-0">{content}</section>;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={`${ui.dialog} max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]`}>{content}</div>
    </div>
  );
}

function TaskSubjectPickerModal({
  isOpen,
  subjects,
  selectedSubjectIds,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  subjects: Subject[];
  selectedSubjectIds: string[];
  onApply: (subjectIds: string[]) => string | void;
  onClose: () => void;
}) {
  const [draftSubjectIds, setDraftSubjectIds] = useState<string[]>(selectedSubjectIds);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const selectedIds = new Set(draftSubjectIds);
  const unavailable = draftSubjectIds.filter((id) => !subjects.some((subject) => subject.id === id));
  const expandedSubjectIds = new Set(subjects.map((subject) => subject.id));
  const treeItems = getSubjectTreeItems(subjects, expandedSubjectIds);

  function toggleSubject(subjectId: string) {
    setError("");
    setDraftSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }

  function handleClose() {
    setDraftSubjectIds(selectedSubjectIds);
    dialogRef.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${ui.dialog} m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg border border-[#31415e] bg-[#111a2b] text-[#eef4ff] shadow-2xl backdrop:bg-[#050812]/75`}
      aria-labelledby={titleId}
      onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}
      onCancel={(event) => { event.preventDefault(); handleClose(); }}
    >
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div>
            <h3 id={titleId} className="text-xl font-black text-[#eef4ff]">
              Asignar asuntos
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className={closeButtonClass}
          >
            x
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className={`${ui.inset} rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-3`}>
            {subjects.length === 0 ? (
              <TaskEmptyState label="Sin asuntos todavia." />
            ) : (
              <div className="space-y-1">
                {treeItems.map(({ subject, depth }) => (
                  <label
                    key={subject.id}
                    className="grid min-h-10 cursor-pointer grid-cols-[24px_minmax(0,1fr)] items-center gap-2 rounded-md border border-[#24344f] bg-[#0f1726] px-2 py-2 transition hover:border-[#3f5578] hover:bg-[#182238]"
                    style={{ marginLeft: depth ? `${Math.min(depth, 6) * 18}px` : undefined }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="h-4 w-4 accent-[#8ab4f8]"
                    />
                    <span className="truncate text-sm font-semibold text-[#eef4ff]">
                      {subject.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className={`${ui.inset} rounded-lg border border-[#2f3e59] bg-[#101827] px-3 py-3`}>
            <p className="text-[11px] font-bold uppercase text-[#8090ad]">Seleccionados</p>
            <div className="mt-2">
              <SubjectChips subjects={subjects} subjectIds={draftSubjectIds} />
            </div>
          </div>
          {unavailable.length ? (
            <button type="button" onClick={() => {
              setDraftSubjectIds((current) => current.filter((id) => !unavailable.includes(id)));
              setError("");
            }} className="min-h-11 justify-self-start underline underline-offset-4">
              Quitar asuntos que ya no están disponibles
            </button>
          ) : null}
          {error ? <p role="alert" className="text-sm text-[#ff9d88]">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={buttonClass}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const message = onApply(draftSubjectIds);
                if (message) setError(message);
                else dialogRef.current?.close();
              }}
              className={primaryButtonClass}
            >
              Guardar asuntos
            </button>
          </div>
        </div>
    </dialog>
  );
}

export function TaskCreateModal({
  isOpen,
  subjects,
  deliverables,
  phases,
  tasks,
  onAddTask,
  onClose,
  defaultSubjectIds = [],
  defaultDeliverableId = null,
}: {
  isOpen: boolean;
  subjects: Subject[];
  deliverables: SubjectDeliverable[];
  phases: SubjectPhase[];
  tasks: Task[];
  onAddTask: (draft: TaskDraft) => void;
  onClose: () => void;
  defaultSubjectIds?: string[];
  defaultDeliverableId?: string | null;
}) {
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(defaultSubjectIds);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(
    defaultDeliverableId,
  );
  const [isSubjectPickerOpen, setIsSubjectPickerOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setSelectedSubjectIds(defaultSubjectIds);
    setSelectedPhaseId(null);
    setSelectedDeliverableId(defaultDeliverableId);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "");
    const notes = String(data.get("notes") ?? "");
    const parentTaskId = String(data.get("parentTaskId") ?? "");
    const hacerEl = String(data.get("hacerEl") ?? "");
    const venceEl = String(data.get("venceEl") ?? "");
    const priority = String(data.get("priority") ?? "normal") as TaskPriority;

    if (!title.trim()) {
      return;
    }

    onAddTask({
      title,
      notes,
      subjectIds: selectedSubjectIds,
      phaseId: selectedPhaseId,
      deliverableId: selectedDeliverableId,
      parentTaskId: parentTaskId || null,
      hacerEl: hacerEl || null,
      venceEl: venceEl || null,
      priority,
    });
    form.reset();
    handleClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#050812]/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-title"
    >
      <div className={`${ui.dialog} w-full max-w-3xl rounded-lg border border-[#31415e] bg-[#111a2b] shadow-[0_24px_90px_rgba(0,0,0,0.46)]`}>
        <div className="flex items-center justify-between gap-4 border-b border-[#263852] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-black uppercase text-[#8ab4f8]">Nueva tarea</p>
            <h3 id="new-task-title" className="mt-1 text-xl font-black text-[#eef4ff]">
              Crear tarea
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className={closeButtonClass}
          >
            x
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 p-4 sm:p-5"
        >
          <input
            name="title"
            placeholder="Titulo de la tarea"
            aria-label="Titulo de la nueva tarea"
            autoFocus
            className={titleInputClass}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <FieldLabel label="Notas">
              <input
                name="notes"
                placeholder="Notas"
                aria-label="Notas de la nueva tarea"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Depende de">
              <select name="parentTaskId" aria-label="Tarea superior" className={controlClass}>
                <option value="">Tarea raiz</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Hacer el">
              <input
                type="date"
                name="hacerEl"
                aria-label="Hacer el"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Vence el">
              <input
                type="date"
                name="venceEl"
                aria-label="Vence el"
                className={controlClass}
              />
            </FieldLabel>

            <FieldLabel label="Prioridad">
              <select
                name="priority"
                defaultValue="normal"
                aria-label="Prioridad"
                className={controlClass}
              >
                {taskPriorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Fase">
              <select
                value={selectedPhaseId ?? ""}
                onChange={(event) => setSelectedPhaseId(event.target.value || null)}
                aria-label="Fase de la tarea"
                className={controlClass}
              >
                <option value="">Directamente en el asunto</option>
                {getTaskAvailablePhases(phases, selectedSubjectIds).map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {getSubjectPath(subjects, phase.subjectId)} · {phase.name}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Entregable">
              <select
                value={selectedDeliverableId ?? ""}
                onChange={(event) => setSelectedDeliverableId(event.target.value || null)}
                aria-label="Entregable de la tarea"
                className={controlClass}
              >
                <option value="">Sin entregable</option>
                {getTaskAvailableDeliverables(deliverables, selectedSubjectIds).map(
                  (deliverable) => (
                    <option key={deliverable.id} value={deliverable.id}>
                      {getSubjectPath(subjects, deliverable.subjectId)} · {deliverable.name}
                    </option>
                  ),
                )}
              </select>
            </FieldLabel>

            <FieldLabel label="Asuntos">
              <div className={`${ui.inset} grid min-h-24 gap-3 rounded-md border border-[#32415d] bg-[#0f1726] px-3 py-3`}>
                <SubjectChips subjects={subjects} subjectIds={selectedSubjectIds} />
                <button
                  type="button"
                  onClick={() => setIsSubjectPickerOpen(true)}
                  className={`${ui.button} h-10 w-fit rounded-md border border-[#344562] px-3 text-sm font-bold text-[#b9c5dd] transition hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]/30`}
                >
                  Agregar asuntos
                </button>
              </div>
            </FieldLabel>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#263852] pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={buttonClass}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={primaryButtonClass}
            >
              Crear tarea
            </button>
          </div>
        </form>
      </div>
      <TaskSubjectPickerModal
        key={`new-task-${isSubjectPickerOpen ? selectedSubjectIds.join("|") : "closed"}`}
        isOpen={isSubjectPickerOpen}
        subjects={subjects}
        selectedSubjectIds={selectedSubjectIds}
        onApply={(subjectIds) => {
          setSelectedSubjectIds(subjectIds);
          const selectedPhase = phases.find((phase) => phase.id === selectedPhaseId);
          if (selectedPhase && !subjectIds.includes(selectedPhase.subjectId)) {
            setSelectedPhaseId(null);
          }
          const selectedDeliverable = deliverables.find(
            (deliverable) => deliverable.id === selectedDeliverableId,
          );
          if (selectedDeliverable && !subjectIds.includes(selectedDeliverable.subjectId)) {
            setSelectedDeliverableId(null);
          }
          setIsSubjectPickerOpen(false);
        }}
        onClose={() => setIsSubjectPickerOpen(false)}
      />
    </div>
  );
}
