import { getHorizonLabel, getSubjectPath, taskPriorities, taskStatuses, type Subject, type SubjectPhase, type Task, type TaskPriority, type TaskStatus } from "../../lib/tasks";

type SubjectTreeItem = {
  subject: Subject;
  depth: number;
  hasChildren: boolean;
};

export function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function getStatusLabel(status: TaskStatus) {
  return taskStatuses.find((item) => item.value === status)?.label ?? status;
}

export function getPriorityLabel(priority: TaskPriority) {
  return taskPriorities.find((item) => item.value === priority)?.label ?? priority;
}

function subjectLabels(subjects: Subject[], subjectIds: string[]) {
  if (subjectIds.length === 0) {
    return ["Sin asunto"];
  }

  return subjectIds.map((id) => getSubjectPath(subjects, id));
}

function taskParentLabel(tasks: Task[], parentTaskId: string | null) {
  if (!parentTaskId) {
    return "Tarea raiz";
  }

  return tasks.find((task) => task.id === parentTaskId)?.title ?? "Tarea superior";
}

export function taskMatchesQuery(
  task: Task,
  tasks: Task[],
  subjects: Subject[],
  phases: SubjectPhase[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const labels = subjectLabels(subjects, task.subjectIds);
  const horizons = task.subjectIds.map((id) => {
    const subject = subjects.find((item) => item.id === id);
    return subject ? getHorizonLabel(subject.horizon) : "";
  });
  const searchable = [
    task.title,
    task.notes,
    taskParentLabel(tasks, task.parentTaskId),
    ...labels,
    ...horizons,
    getStatusLabel(task.status),
    getPriorityLabel(task.priority),
    getPhaseLabel(phases, task.phaseId),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}

export function getPhaseLabel(phases: SubjectPhase[], phaseId: string | null) {
  if (!phaseId) {
    return "Directamente en el asunto";
  }

  return phases.find((phase) => phase.id === phaseId)?.name ?? "Fase no disponible";
}

export function getSubjectTreeItems(subjects: Subject[], expandedSubjectIds: Set<string>): SubjectTreeItem[] {
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const childrenByParent = new Map<string | null, Subject[]>();

  for (const subject of subjects) {
    const parentId =
      subject.parentSubjectId && subjectIds.has(subject.parentSubjectId)
        ? subject.parentSubjectId
        : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(subject);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const items: SubjectTreeItem[] = [];

  function walk(subject: Subject, depth: number, visited: Set<string>) {
    if (visited.has(subject.id)) {
      return;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(subject.id);
    const children = childrenByParent.get(subject.id) ?? [];

    items.push({
      subject,
      depth,
      hasChildren: children.length > 0,
    });

    if (!expandedSubjectIds.has(subject.id)) {
      return;
    }

    for (const child of children) {
      walk(child, depth + 1, nextVisited);
    }
  }

  for (const root of childrenByParent.get(null) ?? []) {
    walk(root, 0, new Set());
  }

  return items;
}

export function sortedSubjects(subjects: Subject[]) {
  return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
}

export function TaskEmptyState({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#344562] bg-[#0d1725]/75 px-6 py-10 text-center">
      <div className="max-w-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#365079] bg-[#132642] text-lg text-[#82afff]">→</span>
        <p className="mt-4 text-sm font-bold text-[#c9d6eb]">{label}</p>
        {hint ? <p className="mt-1.5 text-xs leading-5 text-[#7f91ad]">{hint}</p> : null}
      </div>
    </div>
  );
}

export function TaskBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral: "border-[#3b506e] bg-[#18283e] text-[#c1cee1]",
    warning: "border-[#745a28] bg-[#2b2415] text-[#f2be67]",
    danger: "border-[#7a3d32] bg-[#2e1716] text-[#ff9d88]",
    info: "border-[#38659a] bg-[#132844] text-[#82afff]",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-black ${styles[tone]}`}>
      {children}
    </span>
  );
}

export function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8090ad]">
      {label}
      {children}
    </label>
  );
}

export const controlClass =
  "h-11 w-full rounded-xl border border-[#324968] bg-[#0b1726] px-3 text-sm font-normal normal-case tracking-normal text-[#dce6f8] outline-none transition placeholder:text-[#61708d] focus:border-[#82afff] focus:ring-2 focus:ring-[#82afff]/15";

export function SubjectChips({ subjects, subjectIds }: { subjects: Subject[]; subjectIds: string[] }) {
  const labels = subjectLabels(subjects, subjectIds);

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-[#35557e] bg-[#132642] px-2.5 py-1 text-[10px] font-bold text-[#a9cbff]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
