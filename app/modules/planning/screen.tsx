"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ViewIcon from "../../components/view-icon";
import { useWorkspace, WorkspaceLoading } from "../../components/workspace-provider";
import ui from "../../components/workspace-screen.module.css";
import { inboxHref, planningViews, workspaceHref } from "../../lib/module-navigation";
import { getHorizonLabel, getSubjectPath, taskTreeItems, type Subject, type SubjectHorizon } from "../../lib/tasks";
import { PlanningHorizonBoard, SubjectHorizonExplorer } from "./horizon-explorer";
import { planningTaskHref, subjectManagementHref, type PlanningView, type SubjectExplorerMode, type SubjectTaskFilter } from "./navigation";
import { planningHorizons } from "./subject-horizons";
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

function SubjectTree({ subjects, selectedId, subjectHref }: {
  subjects: Subject[]; selectedId?: string; subjectHref: (id: string) => string;
}) {
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
                href={subjectHref(subject.id)}
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

export default function PlanningScreen({ view, explorer, taskFilter = "activas", subjectId, taskId, highlightedId, returnEntryId }: {
  view: PlanningView; explorer: SubjectExplorerMode; subjectId?: string; taskId?: string;
  highlightedId?: string; returnEntryId?: string; taskFilter?: SubjectTaskFilter;
}) {
  const workspace = useWorkspace();
  const { planning, tasks, subjects, phases, deliverables, today } = workspace;
  const router = useRouter();
  const [searchState, setSearchState] = useState<{ href: string; text: string }>();
  const [creating, setCreating] = useState(false);
  const [horizonAnnouncement, setHorizonAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const isSubjects = view === "subjects";
  const isBoard = isSubjects && explorer === "tablero";
  const subject = isSubjects ? subjects.find(({ id }) => id === subjectId) : undefined;
  const subjectPath = subject ? getSubjectPath(subjects, subject.parentSubjectId) : "";
  const listHref = planningTaskHref(view, subject?.id, undefined, { explorer, returnEntryId, taskFilter });
  const searchKey = planningTaskHref(view, subject?.id);
  const search = searchState?.href === searchKey ? searchState.text : "";
  const allTasks = isSubjects ? (subject ? planning.getTasksForSubject(subject.id) : []) : planning.views[view];
  const completedCount = allTasks.filter((task) => task.status === "completed").length;
  const activeCount = allTasks.length - completedCount;
  const visibleTasks = isSubjects && taskFilter !== "todas"
    ? allTasks.filter((task) => taskFilter === "completadas" ? task.status === "completed" : task.status !== "completed")
    : allTasks;
  const selectedTask = allTasks.find(({ id }) => id === taskId);
  const assignedTask = visibleTasks.find(({ id }) => id === highlightedId);
  const filtered = taskTreeItems(visibleTasks.filter((task) => taskMatchesQuery(task, tasks, subjects, phases, search)));
  const heading = subject?.name ?? labels[view];
  const panel = selectedTask ? "detail" : subject || view !== "subjects" ? "tasks" : "subjects";
  const canCreate = !isBoard && (!isSubjects || Boolean(subject));
  const showBack = !isBoard && panel !== "subjects";
  const subjectHref = (id: string) => planningTaskHref("subjects", id, id === subject?.id ? selectedTask?.id : undefined, {
    explorer: isBoard ? "horizonte" : explorer,
    returnEntryId,
    taskFilter: id === subject?.id ? taskFilter : "activas",
  });
  const explorerHref = (mode: SubjectExplorerMode) => planningTaskHref("subjects", subject?.id, subject ? selectedTask?.id : undefined, {
    explorer: mode,
    returnEntryId,
    taskFilter,
  });

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
      if (event.key === "/" && searchRef.current?.getClientRects().length) {
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

  function moveSubject(item: Subject, horizon: SubjectHorizon) {
    if (item.horizon === horizon) return;
    workspace.setSubjectHorizon(item.id, horizon);
    setHorizonAnnouncement(`${item.name} pasó a ${getHorizonLabel(horizon)}.`);
  }

  return (
    <main className={`${ui.screen} ${styles.planning}`}>
      <div className={ui.frame}>
        <p role="status" className="sr-only">{horizonAnnouncement}</p>
        {returnEntryId ? <Link href={inboxHref(returnEntryId)} className={`${ui.backLink} mb-2 inline-flex`}><span aria-hidden="true">←</span> Volver a la entrada</Link> : null}
        {panel === "detail" && !isBoard ? <h1 className="sr-only lg:hidden">Planificación</h1> : null}
        <header className={`${ui.header} ${panel === "detail" && !isBoard ? "hidden lg:block" : ""}`}>
          <div className={ui.heading}>
            <h1 className={`${ui.title} ${styles.title}`}>Planificación</h1>
            <div className={styles.headerActions}>
              <Link href={subjectManagementHref(subject?.id)} className={styles.actionLink}>Gestionar asuntos</Link>
              {canCreate ? (
                <button type="button" onClick={() => setCreating(true)} className={`${ui.button} ${ui.primary}`}>
                  <span aria-hidden="true" className="text-lg leading-none">+</span> Nueva tarea
                </button>
              ) : null}

            </div>
          </div>
          <nav aria-label="Vistas de Planificación" className={`${ui.tabs} ${styles.tabs}`}>
            {planningViews.map((destination) => (
              <Link
                key={destination}
                href={workspaceHref(destination)}
                aria-current={destination === view ? "page" : undefined}
                className={`${ui.tab} ${styles.tab}`}
              >
                <ViewIcon view={destination} />
                {labels[destination]}
                {destination === "unassigned" && planning.views.unassigned.length > 0 ? (
                  <span className={styles.tabCount}>{planning.views.unassigned.length}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </header>

        {showBack ? (
          <Link
            href={panel === "detail" ? listHref : planningTaskHref("subjects", undefined, undefined, { explorer, returnEntryId })}
            className={`${ui.backLink} mb-2 inline-flex lg:hidden`}
          >
            <span aria-hidden="true">←</span>{panel === "detail" ? "Volver a tareas" : "Volver a asuntos"}
          </Link>
        ) : null}
        {panel === "detail" && !isBoard ? <p className="mb-3 break-words text-sm font-medium text-(--workspace-muted) lg:hidden">{subject ? getSubjectPath(subjects, subject.id) : heading}</p> : null}

        {isBoard ? (
          <section aria-labelledby="planning-horizon-board">
            <div className={styles.boardToolbar}>
              <h2 id="planning-horizon-board" className={ui.panelTitle}>Tablero de horizontes</h2>
              <Link href={explorerHref("horizonte")} className={`${ui.backLink} inline-flex`}>
                <span aria-hidden="true">←</span> Volver a Asuntos
              </Link>
            </div>
            <PlanningHorizonBoard subjects={subjects} selected={subject} subjectHref={subjectHref} onMove={moveSubject} />
          </section>
        ) : null}
        <div className={isBoard ? "hidden" : styles.workspace}>
          <aside className={`${ui.panel} ${panel === "subjects" ? "block" : "hidden lg:block"}`}>
            <div className={styles.explorerHeader}>
              <h2 className={ui.panelTitle}>Asuntos</h2>
              <nav aria-label="Explorador de Asuntos" className={styles.explorerModes}>
                <Link href={explorerHref("horizonte")} aria-current={explorer !== "carpetas" ? "page" : undefined}>Horizonte</Link>
                <Link href={explorerHref("carpetas")} aria-current={explorer === "carpetas" ? "page" : undefined}>Carpetas</Link>
              </nav>
              {explorer !== "carpetas" ? (
                <Link href={explorerHref("tablero")} className={styles.actionLink}><BoardIcon /> Ver tablero</Link>
              ) : null}
            </div>
            {explorer === "carpetas" ? (
              <SubjectTree subjects={subjects} selectedId={subject?.id} subjectHref={subjectHref} />
            ) : (
              <>
                {subjects.length === 0 ? (
                  <p className={styles.emptyGroup}>Todavía no hay asuntos.</p>
                ) : null}
                <SubjectHorizonExplorer subjects={subjects} selected={subject} subjectHref={subjectHref} />
              </>
            )}
          </aside>

          <section aria-labelledby="planning-task-list" className={`${ui.panel} ${panel === "tasks" ? "block" : "hidden lg:block"}`}>
            <div className={styles.listHeader}>
              {subject?.parentSubjectId ? (
                <p className={styles.breadcrumb}>{subjectPath} <span aria-hidden="true">/</span> {subject.name}</p>
              ) : null}
              <div className={styles.listHeading}>
                <h2 id="planning-task-list" className={styles.listTitle}>{subject || !isSubjects ? heading : "Tareas"}</h2>
                {subject ? (
                  <select
                    aria-label={`Horizonte de ${subject.name}`}
                    className={`${ui.control} ${styles.horizonSelect}`}
                    value={subject.horizon}
                    onChange={(event) => {
                      const horizon = planningHorizons.find(({ value }) => value === event.target.value);
                      if (horizon) moveSubject(subject, horizon.value);
                    }}
                  >
                    {planningHorizons.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                ) : null}
              </div>
              {canCreate ? (
                <label className={styles.search}>
                  <span className="sr-only">Buscar tareas</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.searchIcon}>
                    <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
                  </svg>
                  <input ref={searchRef} type="search" placeholder="Buscar tareas" value={search} onChange={(event) => setSearchState({ href: searchKey, text: event.target.value })} className={ui.control} />
                  {!search ? <kbd aria-hidden="true" className={styles.searchKey}>/</kbd> : null}
                </label>
              ) : null}
              {subject ? (
                <nav aria-label="Filtrar tareas del asunto" className={styles.taskFilters}>
                  {([
                    { value: "activas", label: "Por realizar", count: activeCount },
                    { value: "completadas", label: "Completadas", count: completedCount },
                    { value: "todas", label: "Todas", count: allTasks.length },
                  ] as const).map(({ value, label, count }) => (
                    <Link
                      key={value}
                      href={planningTaskHref("subjects", subject.id, undefined, { explorer, returnEntryId, taskFilter: value })}
                      aria-current={taskFilter === value ? "page" : undefined}
                      scroll={false}
                    >
                      {label} <span className={styles.tabCount}>{count}</span>
                    </Link>
                  ))}
                </nav>
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
                  <li key={task.id} id={`plan-task-${task.id}`} className={`${styles.taskRow} flex min-w-0 scroll-mt-20 items-center gap-1 ${task.id === assignedTask?.id ? "bg-(--workspace-selection)" : ""}`} style={{ paddingInlineStart: 8 + Math.min(depth, 6) * 12 }}>
                    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                      <input type="checkbox" aria-label={`Completar ${task.title}`} checked={task.status === "completed"} onChange={(event) => planning.setTaskStatus(task.id, event.target.checked ? "completed" : "pending")} className="size-4 accent-(--accent)" />
                    </label>
                    <Link
                      href={planningTaskHref(view, subject?.id, task.id, { explorer, returnEntryId, taskFilter })}
                      aria-current={selectedTask?.id === task.id ? "true" : undefined}
                      className={styles.taskLink}
                    >
                      <strong className={`wrap-anywhere text-sm font-semibold ${task.status === "completed" ? "line-through" : ""}`}>{task.title}</strong>
                      <span className="text-xs text-(--workspace-muted)">
                        {getStatusLabel(task.status)}
                        {task.venceEl ? ` · Vence ${formatDate(task.venceEl)}` : task.hacerEl ? ` · Hacer ${formatDate(task.hacerEl)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-sm text-(--workspace-muted)">
                <p>{search.trim() && canCreate
                  ? "No hay tareas que coincidan con la búsqueda."
                  : subject && taskFilter === "activas"
                    ? "No quedan tareas por realizar en este asunto."
                    : subject && taskFilter === "completadas"
                      ? "Todavía no hay tareas completadas en este asunto."
                      : canCreate ? "No hay tareas en esta lista." : "Elegí un asunto para ver sus tareas."}</p>
                {subject && taskFilter === "activas" && !search.trim() && completedCount > 0 ? (
                  <Link
                    href={planningTaskHref("subjects", subject.id, undefined, { explorer, returnEntryId, taskFilter: "completadas" })}
                    className={styles.actionLink}
                  >
                    Ver completadas ({completedCount})
                  </Link>
                ) : null}
              </div>
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
                      router.push(planningTaskHref("subjects", subjectIds[0], undefined, { returnEntryId }) + "&" + new URLSearchParams({ asignada: id }));
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

function BoardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11m6-11v11" />
    </svg>
  );
}
