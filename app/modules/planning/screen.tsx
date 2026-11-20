"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ViewIcon from "../../components/view-icon";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import { planningViews, workspaceHref } from "../../lib/module-navigation";
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
                  className="grid min-h-11 place-items-center text-[#afc5e1] hover:bg-[#213650]"
                >
                  <span aria-hidden="true">{expandedIds.has(subject.id) ? "▾" : "▸"}</span>
                </button>
              ) : <span aria-hidden="true" />}
              <Link
                href={planningTaskHref("subjects", subject.id)}
                aria-current={selectedId === subject.id ? "true" : undefined}
                className={`${styles.selection} flex min-h-11 min-w-0 items-center gap-2 rounded-sm px-2 text-sm font-semibold`}
              >
                <ViewIcon view="subjects" className="size-4 shrink-0 text-[#a5bee2]" />
                <span className="wrap-anywhere">{subject.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-[#a9bad0]">Todavía no hay asuntos. <Link href={subjectManagementHref()} className="text-[#b4cdf5] underline underline-offset-4">Gestionar asuntos</Link></p>
      )}
    </nav>
  );
}

export default function PlanningScreen({ view, subjectId, taskId }: { view: PlanningView; subjectId?: string; taskId?: string }) {
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
  const filtered = taskTreeItems(visibleTasks.filter((task) => taskMatchesQuery(task, tasks, subjects, phases, search)));
  const heading = subject ? getSubjectPath(subjects, subject.id) : labels[view];
  const panel = selectedTask ? "detail" : subject || view !== "subjects" ? "tasks" : "subjects";
  const canCreate = view !== "subjects" || Boolean(subject);

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
    <main className={`${styles.screen} flex-1 px-3 pb-12 pt-6 sm:px-6 lg:pt-8`}>
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#34485e] pb-4">
          <h1 className="text-3xl font-bold leading-tight tracking-[-0.055em] sm:text-5xl">Planificación</h1>
          <Link href={subjectManagementHref(subject?.id)} className="flex min-h-11 items-center rounded-md border border-[#455b76] px-3 text-sm font-semibold text-[#c6d7ec] hover:bg-[#213650]">Gestionar asuntos <span aria-hidden="true" className="ml-2">↗</span></Link>
        </header>
        <nav aria-label="Vistas de Planificación" className="flex flex-wrap gap-1 py-3">
          {planningViews.map((destination) => (
            <Link
              key={destination}
              href={workspaceHref(destination)}
              aria-current={destination === view ? "page" : undefined}
              className="flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-[#afc5e1] hover:bg-[#213650] aria-[current=page]:bg-[#b4cdf5] aria-[current=page]:text-[#101922] sm:px-3"
            >
              <ViewIcon view={destination} />
              {labels[destination]}
              {destination === "unassigned" && planning.views.unassigned.length > 0 ? (
                <span className="font-mono text-xs tabular-nums">{planning.views.unassigned.length}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        {panel !== "subjects" ? (
          <Link
            href={panel === "detail" ? listHref : planningTaskHref("subjects")}
            className="mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#b4cdf5] lg:hidden"
          >
            <span aria-hidden="true" className="mr-2">←</span>{panel === "detail" ? "Volver a tareas" : "Volver a asuntos"}
          </Link>
        ) : null}

        <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(12rem,0.76fr)_minmax(0,1.35fr)_minmax(17rem,1.24fr)] 2xl:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.4fr)_minmax(20rem,1.25fr)]">
          <aside className={`${styles.pane} ${panel === "subjects" ? "block" : "hidden lg:block"}`}>
            <h2 className={styles.paneHeading}>Asuntos</h2>
            <SubjectTree subjects={subjects} selectedId={subject?.id} />
          </aside>

          <section aria-labelledby="planning-task-list" className={`${styles.pane} ${panel === "tasks" ? "block" : "hidden lg:block"}`}>
            <div className="grid gap-3 border-b border-[#34485e] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 id="planning-task-list" className="wrap-anywhere text-lg font-bold tracking-tight">{subject || view !== "subjects" ? heading : "Tareas"}</h2>
                {canCreate ? <button type="button" onClick={() => setCreating(true)} className="min-h-11 rounded-md border border-[#50698b] px-3 text-sm font-semibold text-[#d7e6fa] hover:bg-[#213650]">+ Nueva tarea</button> : null}
              </div>
              {canCreate ? (
                <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[#afc5e1]">
                  Buscar tareas
                  <input ref={searchRef} type="search" value={search} onChange={(event) => setSearchState({ href: listHref, text: event.target.value })} className="min-h-11 min-w-0 border border-[#455b76] bg-[#101923] px-3 text-base font-normal text-[#eaf2fd]" />
                </label>
              ) : null}
            </div>
            {filtered.length ? (
              <ul className="divide-y divide-[#34485e]">
                {filtered.map(({ task, depth }) => (
                  <li key={task.id} className="relative flex min-w-0 items-center gap-1 px-2" style={{ paddingInlineStart: 8 + Math.min(depth, 6) * 12 }}>
                    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                      <input type="checkbox" aria-label={`Completar ${task.title}`} checked={task.status === "completed"} onChange={(event) => planning.setTaskStatus(task.id, event.target.checked ? "completed" : "pending")} className="size-4 accent-[#b4cdf5]" />
                    </label>
                    <Link
                      href={planningTaskHref(view, subject?.id, task.id)}
                      aria-current={selectedTask?.id === task.id ? "true" : undefined}
                      className={`${styles.selection} flex min-h-15 min-w-0 flex-1 flex-col justify-center gap-1 rounded-sm px-3 py-2.5`}
                    >
                      <span className={`wrap-anywhere text-sm font-bold ${task.status === "completed" ? "line-through" : ""}`}>{task.title}</span>
                      <span className="text-xs text-[#afc5e1]">
                        {getStatusLabel(task.status)}
                        {task.venceEl ? ` · Vence ${formatDate(task.venceEl)}` : task.hacerEl ? ` · Hacer ${formatDate(task.hacerEl)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-[#a9bad0]">{search.trim() && canCreate ? "No hay tareas que coincidan con la búsqueda." : canCreate ? "No hay tareas en esta lista." : "Elegí un asunto para ver sus tareas."}</p>
            )}
          </section>

          <aside aria-label="Detalle de tarea" className={`${styles.pane} ${panel === "detail" ? "block" : "hidden lg:block"}`}>
            {selectedTask ? (
              <>
                {selectedTask.aiSuggestion ? <Link href={workspaceHref("inbox")} className="mx-4 mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#b4cdf5] underline">Revisar en Bandeja</Link> : null}
                <TaskEditModal
                  key={selectedTask.id}
                  embedded
                  task={selectedTask}
                  subjects={subjects}
                  deliverables={deliverables}
                  phases={phases}
                  today={today}
                  onPatch={planning.patchTask}
                  onStatus={planning.setTaskStatus}
                  onPriority={planning.setTaskPriority}
                  onDelete={planning.deleteTask}
                  onClose={closeTask}
                  getAvailableParentTasksForTask={planning.getAvailableParentTasksForTask}
                  onAssignSubjects={(id, subjectIds) => {
                    const error = planning.assignTaskSubjects(id, subjectIds);
                    if (!error && view === "unassigned" && subjectIds[0]) {
                      router.push(planningTaskHref("subjects", subjectIds[0]));
                    }
                    return error;
                  }}
                />
              </>
            ) : (
              <>
                <h2 className={styles.paneHeading}>Detalle de tarea</h2>
                <p className="px-4 py-6 text-sm text-[#a9bad0]">Seleccioná una tarea para ver su detalle.</p>
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
