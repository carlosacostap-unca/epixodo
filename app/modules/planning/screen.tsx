"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ViewIcon from "../../components/view-icon";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import ui from "../../components/workspace-screen.module.css";
import { inboxHref, planningViews, workspaceHref } from "../../lib/module-navigation";
import { getSubjectPath, taskTreeItems, type Subject } from "../../lib/tasks";
import { planningTaskHref, subjectManagementHref, type PlanningView } from "./navigation";
import { TaskCreateModal, TaskEditModal } from "./task-forms";
import { formatDate, getStatusLabel, getSubjectTreeItems, taskMatchesQuery } from "./task-ui";
import styles from "./planning.module.css";

const labels = {
  subjects: "Asuntos",
  unassigned: "Sin asunto",
  upcoming: "Próximas",
  waiting: "Esperando",
  completed: "Completadas",
  calendar: "Calendario",
};

function SubjectTree({ subjects, selectedId }: { subjects: Subject[]; selectedId?: string }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const expandedIds = new Set(subjects.map(({ id }) => id).filter((id) => !collapsed.has(id)));
  const tree = getSubjectTreeItems(subjects, expandedIds);

  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav aria-label="Árbol de asuntos">
      {tree.length ? (
        <ul className="space-y-1 p-2">
          {tree.map(({ subject, depth, hasChildren }) => (
            <li key={subject.id} className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center" style={{ paddingInlineStart: Math.min(depth, 7) * 12 }}>
              {hasChildren ? (
                <button
                  type="button"
                  aria-expanded={expandedIds.has(subject.id)}
                  aria-label={`${expandedIds.has(subject.id) ? "Plegar" : "Expandir"} ${subject.name}`}
                  onClick={() => toggle(subject.id)}
                  className="grid min-h-11 place-items-center text-(--workspace-muted) hover:bg-(--workspace-hover)"
                >
                  <span aria-hidden="true">{expandedIds.has(subject.id) ? "▾" : "▸"}</span>
                </button>
              ) : <span aria-hidden="true" />}
              <Link
                href={planningTaskHref("subjects", subject.id)}
                aria-current={selectedId === subject.id ? "true" : undefined}
                className={`${ui.selection} flex min-h-11 min-w-0 items-center gap-2 rounded-sm px-2 text-sm font-semibold`}
              >
                <ViewIcon view="subjects" className="size-4 shrink-0 text-(--accent)" />
                <span className="wrap-anywhere">{subject.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-(--workspace-muted)">Todavía no hay asuntos. <Link href={subjectManagementHref()} className="text-(--accent) underline underline-offset-4">Gestionar asuntos</Link></p>
      )}
    </nav>
  );
}

export default function PlanningScreen({ view, subjectId, taskId, highlightedId, returnEntryId }: {
  view: PlanningView; subjectId?: string; taskId?: string; highlightedId?: string; returnEntryId?: string;
}) {
  const workspace = useWorkspace();
  const { planning, tasks, subjects, phases, deliverables, today } = workspace;
  const router = useRouter();
  const [searchState, setSearchState] = useState<{ href: string; text: string }>();
  const [creating, setCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const subject = view === "subjects" ? subjects.find(({ id }) => id === subjectId) : undefined;
  const listHref = planningTaskHref(view, subject?.id);
  const search = searchState?.href === listHref ? searchState.text : "";
  const visibleTasks = view === "subjects" ? (subject ? planning.getTasksForSubject(subject.id) : []) : planning.views[view];
  const selectedTask = visibleTasks.find(({ id }) => id === taskId);
  const assignedTask = visibleTasks.find(({ id }) => id === highlightedId);
  const filtered = taskTreeItems(visibleTasks.filter((task) => taskMatchesQuery(task, tasks, subjects, phases, search)));
  const heading = subject ? getSubjectPath(subjects, subject.id) : labels[view];
  const panel = selectedTask ? "detail" : subject || view !== "subjects" ? "tasks" : "subjects";
  const canCreate = view !== "subjects" || Boolean(subject);

  useEffect(() => {
    if (assignedTask?.id) document.getElementById(`plan-task-${assignedTask.id}`)?.scrollIntoView({ block: "nearest" });
  }, [assignedTask?.id]);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (document.querySelector("dialog[open]")) return;
      const target = event.target;
      if (event.key === "Escape") {
        setCreating(false);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || !(target instanceof HTMLElement) ||
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "/" && panel !== "subjects") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n" && canCreate && panel !== "detail") {
        event.preventDefault();
        setCreating(true);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [canCreate, panel]);

  if (!workspace.isLoaded) return <WorkspaceLoading />;

  function closeTask() {
    router.push(listHref);
  }

  return (
    <main className={`${ui.screen} ${styles.planning}`}>
      <div className={ui.frame}>
        {returnEntryId ? <Link href={inboxHref(returnEntryId)} className={`${ui.backLink} mb-2 inline-flex`}><span aria-hidden="true">←</span> Volver a la entrada</Link> : null}
        {panel === "detail" ? <h1 className="sr-only lg:hidden">Planificación</h1> : null}
        <header className={`${ui.header} ${panel === "detail" ? "hidden lg:block" : ""}`}>
          <div className={ui.heading}>
            <h1 className={ui.title}>Planificación</h1>
            <Link href={subjectManagementHref(subject?.id)} className={ui.button}>Gestionar asuntos <span aria-hidden="true">↗</span></Link>
          </div>
          <nav aria-label="Vistas de Planificación" className={ui.tabs}>
            {planningViews.map((destination) => (
              <Link
                key={destination}
                href={workspaceHref(destination)}
                aria-current={destination === view ? "page" : undefined}
                className={ui.tab}
              >
                <ViewIcon view={destination} />
                {labels[destination]}
                {destination === "unassigned" && planning.views.unassigned.length > 0 ? (
                  <span className="font-mono text-xs tabular-nums">{planning.views.unassigned.length}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </header>

        {panel !== "subjects" ? (
          <Link
            href={panel === "detail" ? listHref : planningTaskHref("subjects")}
            className={`${ui.backLink} mb-2 inline-flex lg:hidden`}
          >
            <span aria-hidden="true">←</span>{panel === "detail" ? "Volver a tareas" : "Volver a asuntos"}
          </Link>
        ) : null}
        {panel === "detail" ? <p className="mb-3 break-words text-sm font-medium text-(--workspace-muted) lg:hidden">{heading}</p> : null}

        <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(12rem,0.76fr)_minmax(0,1.35fr)_minmax(17rem,1.24fr)] 2xl:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.4fr)_minmax(20rem,1.25fr)]">
          <aside className={`${ui.panel} ${panel === "subjects" ? "block" : "hidden lg:block"}`}>
            <h2 className={`${ui.panelTitle} border-b border-(--workspace-border) p-4`}>Asuntos</h2>
            <SubjectTree subjects={subjects} selectedId={subject?.id} />
          </aside>

          <section aria-labelledby="planning-task-list" className={`${ui.panel} ${panel === "tasks" ? "block" : "hidden lg:block"}`}>
            <div className="grid gap-3 border-b border-(--workspace-border) p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 id="planning-task-list" className={`${ui.panelTitle} wrap-anywhere`}>{subject || view !== "subjects" ? heading : "Tareas"}</h2>
                {canCreate ? <button type="button" onClick={() => setCreating(true)} className={ui.button}>+ Nueva tarea</button> : null}
              </div>
              {canCreate ? (
                <label className={`${ui.label} min-w-0`}>
                  Buscar tareas
                  <input ref={searchRef} type="search" value={search} onChange={(event) => setSearchState({ href: listHref, text: event.target.value })} className={`${ui.control} px-3`} />
                </label>
              ) : null}
            </div>
            {assignedTask ? (
              <p role="status" className="border-b border-(--workspace-border) bg-(--workspace-selection) px-4 py-3 text-sm">
                <strong>{assignedTask.title}</strong> · Asignada a {assignedTask.subjectIds.map((id) => getSubjectPath(subjects, id)).join(", ")}.
              </p>
            ) : null}
            {filtered.length ? (
              <ul className="divide-y divide-(--workspace-border)">
                {filtered.map(({ task, depth }) => (
                  <li key={task.id} id={`plan-task-${task.id}`} className={`relative flex min-w-0 scroll-mt-20 items-center gap-1 px-2 ${task.id === assignedTask?.id ? "bg-(--workspace-selection)" : ""}`} style={{ paddingInlineStart: 8 + Math.min(depth, 6) * 12 }}>
                    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                      <input type="checkbox" aria-label={`Completar ${task.title}`} checked={task.status === "completed"} onChange={(event) => planning.setTaskStatus(task.id, event.target.checked ? "completed" : "pending")} className="size-4 accent-(--accent)" />
                    </label>
                    <Link
                      href={planningTaskHref(view, subject?.id, task.id)}
                      aria-current={selectedTask?.id === task.id ? "true" : undefined}
                      className={`${ui.selection} flex min-h-15 min-w-0 flex-1 flex-col justify-center gap-1 rounded-sm px-3 py-2.5`}
                    >
                      <span className={`wrap-anywhere text-sm font-bold ${task.status === "completed" ? "line-through" : ""}`}>{task.title}</span>
                      <span className="text-xs text-(--workspace-muted)">
                        {getStatusLabel(task.status)}
                        {task.venceEl ? ` · Vence ${formatDate(task.venceEl)}` : task.hacerEl ? ` · Hacer ${formatDate(task.hacerEl)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-(--workspace-muted)">{search.trim() && canCreate ? "No hay tareas que coincidan con la búsqueda." : canCreate ? "No hay tareas en esta lista." : "Elegí un asunto para ver sus tareas."}</p>
            )}
          </section>

          <aside aria-label="Detalle de tarea" className={`${ui.panel} ${panel === "detail" ? "block" : "hidden lg:block"}`}>
            {selectedTask ? (
              <>
                {selectedTask.aiSuggestion ? <Link href={workspaceHref("inbox")} className={`${ui.backLink} mx-4 mt-3 inline-flex`}>Revisar en Bandeja</Link> : null}
                <TaskEditModal
                  key={selectedTask.id}
                  embedded
                  task={selectedTask}
                  subjects={subjects}
                  deliverables={deliverables}
                  phases={phases}
                  today={today}
                  onPatch={planning.patchTask}
                  onDelete={planning.deleteTask}
                  onClose={closeTask}
                  getAvailableParentTasksForTask={planning.getAvailableParentTasksForTask}
                  onAssignSubjects={(id, subjectIds) => {
                    const error = planning.assignTaskSubjects(id, subjectIds);
                    if (!error && view === "unassigned" && subjectIds[0]) {
                      router.push(planningTaskHref("subjects", subjectIds[0]) + "&" + new URLSearchParams({ asignada: id }));
                    }
                    return error;
                  }}
                />
              </>
            ) : (
              <>
                <h2 className={`${ui.panelTitle} border-b border-(--workspace-border) p-4`}>Detalle de tarea</h2>
                <p className="px-4 py-6 text-sm text-(--workspace-muted)">Seleccioná una tarea para ver su detalle.</p>
              </>
            )}
          </aside>
        </div>
        <TaskCreateModal
          key={subject?.id ?? view}
          isOpen={creating && canCreate}
          subjects={subjects}
          deliverables={deliverables}
          phases={phases}
          tasks={tasks}
          onAddTask={planning.addReviewedTask}
          onClose={() => setCreating(false)}
          defaultSubjectIds={subject ? [subject.id] : []}
        />
      </div>
    </main>
  );
}
