import { planningViews, workspaceHref } from "../../lib/module-navigation";

export type PlanningView = Exclude<(typeof planningViews)[number], "calendar">;
export type SubjectExplorerMode = "horizonte" | "carpetas" | "tablero";
export type SubjectTaskFilter = "activas" | "completadas" | "todas";

export function resolveSubjectTaskFilter(value: string | string[] | undefined): SubjectTaskFilter {
  return value === "completadas" || value === "todas" ? value : "activas";
}

export function resolveSubjectExplorer(value: string | string[] | undefined): SubjectExplorerMode {
  return value === "carpetas" || value === "tablero" ? value : "horizonte";
}

export function planningTaskHref(
  view: PlanningView,
  subjectId?: string,
  taskId?: string,
  { explorer = "horizonte", returnEntryId, taskFilter = "activas" }: {
    explorer?: SubjectExplorerMode; returnEntryId?: string; taskFilter?: SubjectTaskFilter;
  } = {},
) {
  const href = workspaceHref(view, subjectId);
  const params = new URLSearchParams();
  if (taskId) params.set("tarea", taskId);
  if (view === "subjects" && explorer !== "horizonte") params.set("explorador", explorer);
  if (view === "subjects" && taskFilter !== "activas") params.set("filtro", taskFilter);
  if (returnEntryId) params.set("desdeEntrada", returnEntryId);
  return params.size ? href + (href.includes("?") ? "&" : "?") + params : href;
}

export function subjectManagementHref(subjectId?: string, {
  explorer = "horizonte", taskFilter = "activas", returnEntryId,
}: { explorer?: SubjectExplorerMode; taskFilter?: SubjectTaskFilter; returnEntryId?: string } = {}) {
  const params = new URLSearchParams({ vista: "gestion" });
  if (subjectId) params.set("asunto", subjectId);
  if (explorer !== "horizonte") params.set("explorador", explorer);
  if (taskFilter !== "activas") params.set("filtro", taskFilter);
  if (returnEntryId) params.set("desdeEntrada", returnEntryId);
  return "/planificacion?" + params;
}
