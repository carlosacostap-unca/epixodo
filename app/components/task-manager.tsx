"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTaskWorkspace } from "../hooks/use-task-workspace";
import {
  compareDateOnly,
  isActiveTask,
  taskPriorities,
  taskStatuses,
  type Project,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from "../lib/tasks";

type ViewKey = "today" | "inbox" | "upcoming" | "waiting" | "completed" | "projects";
type EditableTaskPatch = Partial<
  Pick<Task, "title" | "notes" | "projectId" | "hacerEl" | "venceEl" | "priority" | "status">
>;

const viewLabels: Record<ViewKey, string> = {
  today: "Hoy",
  inbox: "Bandeja",
  upcoming: "Proximas",
  waiting: "Esperando",
  completed: "Completadas",
  projects: "Proyectos",
};

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function projectName(projects: Project[], projectId: string | null) {
  if (!projectId) {
    return "Sin proyecto";
  }

  return projects.find((project) => project.id === projectId)?.name ?? "Proyecto";
}

function TaskEmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center border border-dashed border-[#c8d7c0] bg-[#f8faf4] px-6 py-10 text-center text-sm text-[#68715f]">
      {label}
    </div>
  );
}

function TaskRow({
  task,
  projects,
  today,
  onPatch,
  onStatus,
  onPriority,
  onDelete,
}: {
  task: Task;
  projects: Project[];
  today: string;
  onPatch: (taskId: string, patch: EditableTaskPatch) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onPriority: (taskId: string, priority: TaskPriority) => void;
  onDelete: (taskId: string) => void;
}) {
  const isCompleted = task.status === "completed";
  const isDueToday = task.venceEl === today;
  const isOverdue =
    Boolean(task.venceEl) && compareDateOnly(task.venceEl as string, today) < 0 && !isCompleted;
  const isUnplanned = isActiveTask(task) && Boolean(task.venceEl) && !task.hacerEl;

  return (
    <article className="grid gap-3 border border-[#dde6d7] bg-white p-4 shadow-[0_1px_0_rgba(35,43,29,0.04)] sm:grid-cols-[auto_minmax(0,1fr)]">
      <label className="mt-1 flex h-6 w-6 items-center justify-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(event) =>
            onStatus(task.id, event.target.checked ? "completed" : "pending")
          }
          aria-label={`Completar ${task.title}`}
          className="h-5 w-5 accent-[#2f6f46]"
        />
      </label>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={task.title}
            onChange={(event) => onPatch(task.id, { title: event.target.value })}
            aria-label="Titulo de la tarea"
            className={`min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold text-[#263121] outline-none focus:ring-0 ${
              isCompleted ? "line-through opacity-60" : ""
            }`}
          />
          {isOverdue ? (
            <span className="border border-[#d57a53] bg-[#fff0e8] px-2 py-1 text-xs font-semibold text-[#9a3d18]">
              Vencida
            </span>
          ) : null}
          {isDueToday ? (
            <span className="border border-[#ddb84a] bg-[#fff8db] px-2 py-1 text-xs font-semibold text-[#795b08]">
              Vence hoy
            </span>
          ) : null}
          {isUnplanned ? (
            <span className="border border-[#aebd8a] bg-[#f3f7de] px-2 py-1 text-xs font-semibold text-[#58652d]">
              Sin plan
            </span>
          ) : null}
        </div>

        <textarea
          value={task.notes}
          onChange={(event) => onPatch(task.id, { notes: event.target.value })}
          rows={2}
          aria-label="Notas"
          placeholder="Notas"
          className="w-full resize-none border border-[#dce4d6] bg-[#fbfcf8] px-3 py-2 text-sm text-[#4e5b46] outline-none transition focus:border-[#6a8f5d]"
        />

        <div className="grid gap-2 md:grid-cols-5">
          <label className="grid gap-1 text-xs font-semibold uppercase text-[#6a745f]">
            Estado
            <select
              value={task.status}
              onChange={(event) => onStatus(task.id, event.target.value as TaskStatus)}
              className="h-10 border border-[#dce4d6] bg-white px-2 text-sm font-normal normal-case text-[#263121]"
            >
              {taskStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase text-[#6a745f]">
            Proyecto
            <select
              value={task.projectId ?? ""}
              onChange={(event) =>
                onPatch(task.id, { projectId: event.target.value || null })
              }
              className="h-10 border border-[#dce4d6] bg-white px-2 text-sm font-normal normal-case text-[#263121]"
            >
              <option value="">Sin proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase text-[#6a745f]">
            Hacer el
            <input
              type="date"
              value={task.hacerEl ?? ""}
              onChange={(event) =>
                onPatch(task.id, { hacerEl: event.target.value || null })
              }
              className="h-10 border border-[#dce4d6] bg-white px-2 text-sm font-normal normal-case text-[#263121]"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase text-[#6a745f]">
            Vence el
            <input
              type="date"
              value={task.venceEl ?? ""}
              onChange={(event) =>
                onPatch(task.id, { venceEl: event.target.value || null })
              }
              className="h-10 border border-[#dce4d6] bg-white px-2 text-sm font-normal normal-case text-[#263121]"
            />
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase text-[#6a745f]">
            Prioridad
            <select
              value={task.priority}
              onChange={(event) => onPriority(task.id, event.target.value as TaskPriority)}
              className="h-10 border border-[#dce4d6] bg-white px-2 text-sm font-normal normal-case text-[#263121]"
            >
              {taskPriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#68715f]">
          <span>
            {projectName(projects, task.projectId)}
            {task.hacerEl ? ` | hacer ${formatDate(task.hacerEl)}` : ""}
            {task.venceEl ? ` | vence ${formatDate(task.venceEl)}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="border border-[#ecd0c3] px-3 py-1 font-semibold text-[#9a3d18] transition hover:bg-[#fff0e8] focus:outline-none focus:ring-2 focus:ring-[#d57a53]"
          >
            Borrar
          </button>
        </div>
      </div>
    </article>
  );
}

function QuickTaskForm({
  projects,
  onAddTask,
}: {
  projects: Project[];
  onAddTask: (draft: TaskDraft) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "");
    const notes = String(data.get("notes") ?? "");
    const projectId = String(data.get("projectId") ?? "");
    const hacerEl = String(data.get("hacerEl") ?? "");
    const venceEl = String(data.get("venceEl") ?? "");
    const priority = String(data.get("priority") ?? "normal") as TaskPriority;

    onAddTask({
      title,
      notes,
      projectId: projectId || null,
      hacerEl: hacerEl || null,
      venceEl: venceEl || null,
      priority,
    });
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#d9e4d0] bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <input
          name="title"
          placeholder="Nueva tarea"
          aria-label="Nueva tarea"
          className="h-12 min-w-0 border border-[#dce4d6] bg-[#fbfcf8] px-4 text-base font-semibold text-[#263121] outline-none transition placeholder:text-[#9aa690] focus:border-[#6a8f5d]"
        />
        <button
          type="submit"
          className="h-12 border border-[#2f6f46] bg-[#2f6f46] px-5 text-sm font-bold text-white transition hover:bg-[#245738] focus:outline-none focus:ring-2 focus:ring-[#97b889]"
        >
          + Agregar
        </button>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-5">
        <input
          name="notes"
          placeholder="Notas"
          aria-label="Notas de la nueva tarea"
          className="h-10 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121] md:col-span-1"
        />
        <select
          name="projectId"
          aria-label="Proyecto de la nueva tarea"
          className="h-10 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121]"
        >
          <option value="">Sin proyecto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="hacerEl"
          aria-label="Hacer el"
          className="h-10 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121]"
        />
        <input
          type="date"
          name="venceEl"
          aria-label="Vence el"
          className="h-10 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121]"
        />
        <select
          name="priority"
          defaultValue="normal"
          aria-label="Prioridad"
          className="h-10 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121]"
        >
          {taskPriorities.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

function ProjectPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onRenameProject,
  getTasksForProject,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onAddProject: (name: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  getTasksForProject: (projectId: string) => Task[];
}) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddProject(name);
    setName("");
  }

  return (
    <aside className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nuevo proyecto"
          aria-label="Nuevo proyecto"
          className="h-10 min-w-0 flex-1 border border-[#dce4d6] bg-white px-3 text-sm text-[#263121]"
        />
        <button
          type="submit"
          className="h-10 border border-[#2f6f46] px-3 text-sm font-bold text-[#2f6f46] transition hover:bg-[#edf4e9] focus:outline-none focus:ring-2 focus:ring-[#97b889]"
        >
          +
        </button>
      </form>
      <div className="space-y-2">
        {projects.length === 0 ? (
          <TaskEmptyState label="Sin proyectos todavia." />
        ) : (
          projects.map((project) => {
            const count = getTasksForProject(project.id).length;
            const isSelected = selectedProjectId === project.id;

            return (
              <div
                key={project.id}
                className={`border p-3 ${
                  isSelected
                    ? "border-[#2f6f46] bg-[#edf4e9]"
                    : "border-[#dce4d6] bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className="flex w-full items-center justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#97b889]"
                >
                  <span className="font-semibold text-[#263121]">{project.name}</span>
                  <span className="text-xs font-semibold text-[#68715f]">{count}</span>
                </button>
                {isSelected ? (
                  <input
                    value={project.name}
                    onChange={(event) => onRenameProject(project.id, event.target.value)}
                    aria-label="Renombrar proyecto"
                    className="mt-3 h-9 w-full border border-[#c9d8c0] bg-white px-2 text-sm text-[#263121]"
                  />
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default function TaskManager() {
  const workspace = useTaskWorkspace();
  const [activeView, setActiveView] = useState<ViewKey>("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeTasks = workspace.tasks.filter(isActiveTask);
  const selectedProject = selectedProjectId
    ? workspace.projects.find((project) => project.id === selectedProjectId)
    : null;

  const visibleTasks = useMemo(() => {
    if (activeView === "today") {
      return workspace.views.today;
    }

    if (activeView === "inbox") {
      return workspace.views.inbox;
    }

    if (activeView === "upcoming") {
      return workspace.views.upcoming;
    }

    if (activeView === "waiting") {
      return workspace.views.waiting;
    }

    if (activeView === "completed") {
      return workspace.views.completed;
    }

    if (selectedProjectId) {
      return workspace.getTasksForProject(selectedProjectId);
    }

    return [];
  }, [activeView, selectedProjectId, workspace]);

  const navItems = [
    { key: "today" as const, count: workspace.views.today.length },
    { key: "inbox" as const, count: workspace.views.inbox.length },
    { key: "upcoming" as const, count: workspace.views.upcoming.length },
    { key: "waiting" as const, count: workspace.views.waiting.length },
    { key: "completed" as const, count: workspace.views.completed.length },
    { key: "projects" as const, count: workspace.projects.length },
  ];

  const heading =
    activeView === "projects" && selectedProject
      ? selectedProject.name
      : viewLabels[activeView];

  return (
    <main className="min-h-screen bg-[#f2f4ec] text-[#263121]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="border-b border-[#d4deca] bg-[#e8eee0] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-8 border border-[#c7d7bd] bg-[#f8faf4] p-4">
            <p className="text-xs font-bold uppercase text-[#6a745f]">Epixodo</p>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-[#263121]">
              Tareas personales
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#5d6855]">
              {activeTasks.length} activas | {workspace.views.completed.length} completadas
            </p>
          </div>

          <div className="grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={`flex h-11 items-center justify-between border px-3 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#97b889] ${
                  activeView === item.key
                    ? "border-[#2f6f46] bg-[#2f6f46] text-white"
                    : "border-[#d4deca] bg-white text-[#415039] hover:bg-[#f8faf4]"
                }`}
              >
                <span>{viewLabels[item.key]}</span>
                <span>{item.count}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 space-y-5">
            <header className="border-b border-[#d4deca] pb-5">
              <p className="text-sm font-semibold text-[#68715f]">{workspace.today}</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-4xl font-black tracking-normal text-[#263121]">
                  {heading}
                </h2>
                <div className="border border-[#d9c57a] bg-[#fff8db] px-3 py-2 text-sm font-semibold text-[#795b08]">
                  {workspace.views.unplanned.length} sin planificar
                </div>
              </div>
            </header>

            <QuickTaskForm projects={workspace.projects} onAddTask={workspace.addTask} />

            <div className="space-y-3">
              {visibleTasks.length === 0 ? (
                <TaskEmptyState
                  label={
                    activeView === "projects" && !selectedProject
                      ? "Elegí o creá un proyecto."
                      : "No hay tareas en esta vista."
                  }
                />
              ) : (
                visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projects={workspace.projects}
                    today={workspace.today}
                    onPatch={workspace.patchTask}
                    onStatus={workspace.setTaskStatus}
                    onPriority={workspace.setTaskPriority}
                    onDelete={workspace.deleteTask}
                  />
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="border border-[#d4deca] bg-[#f8faf4] p-4">
              <h3 className="text-sm font-black uppercase text-[#415039]">Proyectos</h3>
              <div className="mt-4">
                <ProjectPanel
                  projects={workspace.projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={(projectId) => {
                    setSelectedProjectId(projectId);
                    setActiveView("projects");
                  }}
                  onAddProject={workspace.addProject}
                  onRenameProject={workspace.renameProject}
                  getTasksForProject={workspace.getTasksForProject}
                />
              </div>
            </div>

            <div className="border border-[#d4deca] bg-white p-4">
              <h3 className="text-sm font-black uppercase text-[#415039]">
                Sin planificar
              </h3>
              <div className="mt-3 space-y-2">
                {workspace.views.unplanned.length === 0 ? (
                  <p className="text-sm text-[#68715f]">Todo vencimiento tiene plan.</p>
                ) : (
                  workspace.views.unplanned.slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveView("upcoming")}
                      className="block w-full border border-[#e7d9a2] bg-[#fffdf0] p-3 text-left text-sm transition hover:bg-[#fff8db] focus:outline-none focus:ring-2 focus:ring-[#d9c57a]"
                    >
                      <span className="font-semibold text-[#263121]">{task.title}</span>
                      <span className="mt-1 block text-xs text-[#795b08]">
                        Vence {formatDate(task.venceEl)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
