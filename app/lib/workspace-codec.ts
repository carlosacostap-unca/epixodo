import {
  emptyWorkspace,
  isSubjectEventKind,
  isValidDateOnly,
  type Subject,
  type SubjectEvent,
  type SubjectPhase,
  type SubjectHorizon,
  type Task,
  type WorkspaceData,
} from "./tasks";
import { normalizePhaseOrder } from "./tasks";

type LegacyProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type LegacyTask = Omit<Task, "subjectIds" | "parentTaskId" | "phaseId"> & {
  projectId?: string | null;
  subjectIds?: string[];
  parentTaskId?: string | null;
  phaseId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSubjectHorizon(value: unknown): value is SubjectHorizon {
  return value === "short" || value === "medium" || value === "long" || value === "none";
}

export function repairMojibake(value: string): string {
  return value.replace(/[ÃÂ][\u0080-\u00bf]/g, (sequence) => {
    const bytes = Uint8Array.from(Array.from(sequence, (character) => character.charCodeAt(0)));

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return sequence;
    }
  });
}

function uniqueStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === "string")));
}

function toTask(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.notes !== "string" ||
    typeof value.status !== "string" ||
    typeof value.priority !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  const legacy = value as LegacyTask;
  const subjectIds = uniqueStringIds(legacy.subjectIds);
  const legacyProjectId = typeof legacy.projectId === "string" ? legacy.projectId : null;

  return {
    id: legacy.id,
    title: repairMojibake(legacy.title),
    notes: repairMojibake(legacy.notes),
    status: legacy.status as Task["status"],
    subjectIds: subjectIds.length > 0 ? subjectIds : legacyProjectId ? [legacyProjectId] : [],
    phaseId: typeof legacy.phaseId === "string" ? legacy.phaseId : null,
    parentTaskId: typeof legacy.parentTaskId === "string" ? legacy.parentTaskId : null,
    hacerEl:
      "hacerEl" in legacy
        ? typeof legacy.hacerEl === "string" || legacy.hacerEl === null
          ? legacy.hacerEl
          : null
        : null,
    venceEl:
      "venceEl" in legacy
        ? typeof legacy.venceEl === "string" || legacy.venceEl === null
          ? legacy.venceEl
          : null
        : null,
    priority: legacy.priority as Task["priority"],
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
    completedAt:
      "completedAt" in legacy
        ? typeof legacy.completedAt === "string" || legacy.completedAt === null
          ? legacy.completedAt
          : null
        : null,
  };
}

function toDateOnly(value: unknown): string | null {
  return isValidDateOnly(value) ? value : null;
}

function toSubjectEvent(value: unknown): SubjectEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.subjectId !== "string" ||
    !isSubjectEventKind(value.kind) ||
    typeof value.description !== "string" ||
    !value.description.trim() ||
    !isValidDateOnly(value.date) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    phaseId: typeof value.phaseId === "string" ? value.phaseId : null,
    kind: value.kind,
    description: repairMojibake(value.description.trim()),
    date: value.date,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toSubjectPhase(value: unknown): SubjectPhase | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.subjectId !== "string" ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    subjectId: value.subjectId,
    name: repairMojibake(value.name.trim()),
    plannedStart: toDateOnly(value.plannedStart),
    executedStart: toDateOnly(value.executedStart),
    plannedEnd: toDateOnly(value.plannedEnd),
    executedEnd: toDateOnly(value.executedEnd),
    order: typeof value.order === "number" && Number.isFinite(value.order) ? value.order : 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function toSubject(value: unknown): Subject | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: repairMojibake(value.name),
    parentSubjectId: typeof value.parentSubjectId === "string" ? value.parentSubjectId : null,
    horizon: isSubjectHorizon(value.horizon) ? value.horizon : "none",
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function legacyProjectToSubject(value: unknown): Subject | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  const project = value as LegacyProject;

  return {
    id: project.id,
    name: repairMojibake(project.name),
    parentSubjectId: null,
    horizon: "none",
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function normalizeWorkspaceData(value: unknown): WorkspaceData {
  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    return emptyWorkspace();
  }

  const subjects = Array.isArray(value.subjects)
    ? value.subjects.map(toSubject).filter((subject): subject is Subject => Boolean(subject))
    : Array.isArray(value.projects)
      ? value.projects
          .map(legacyProjectToSubject)
          .filter((subject): subject is Subject => Boolean(subject))
      : [];
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const phases = normalizePhaseOrder(
    (Array.isArray(value.phases) ? value.phases : [])
      .map(toSubjectPhase)
      .filter((phase): phase is SubjectPhase => Boolean(phase))
      .filter((phase) => subjectIds.has(phase.subjectId)),
  );
  const phasesById = new Map(phases.map((phase) => [phase.id, phase]));
  const subjectEvents = (Array.isArray(value.subjectEvents) ? value.subjectEvents : [])
    .map(toSubjectEvent)
    .filter((event): event is SubjectEvent => Boolean(event))
    .filter((event) => subjectIds.has(event.subjectId))
    .map((event) => {
      const phase = event.phaseId ? phasesById.get(event.phaseId) : null;

      return {
        ...event,
        phaseId: phase?.subjectId === event.subjectId ? phase.id : null,
      };
    });
  const taskIds = new Set<string>();
  const tasks = value.tasks
    .map(toTask)
    .filter((task): task is Task => Boolean(task))
    .map((task) => {
      taskIds.add(task.id);
      return {
        ...task,
        subjectIds: task.subjectIds.filter((id) => subjectIds.has(id)),
      };
    })
    .map((task) => ({
      ...task,
      parentTaskId: task.parentTaskId && taskIds.has(task.parentTaskId) ? task.parentTaskId : null,
    }))
    .map((task) => {
      const phase = task.phaseId ? phasesById.get(task.phaseId) : null;

      return {
        ...task,
        phaseId: phase && task.subjectIds.includes(phase.subjectId) ? phase.id : null,
      };
    });

  return { tasks, subjects, phases, subjectEvents };
}

export function parseWorkspaceJson(raw: string | null): WorkspaceData {
  if (!raw) {
    return emptyWorkspace();
  }

  try {
    return normalizeWorkspaceData(JSON.parse(raw));
  } catch {
    return emptyWorkspace();
  }
}

export function hasWorkspaceContent(workspace: WorkspaceData): boolean {
  return (
    workspace.tasks.length > 0 ||
    workspace.subjects.length > 0 ||
    workspace.phases.length > 0 ||
    workspace.subjectEvents.length > 0
  );
}
