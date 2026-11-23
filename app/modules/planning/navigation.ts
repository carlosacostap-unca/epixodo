import { planningViews, workspaceHref } from "../../lib/module-navigation";

export type PlanningView = Exclude<(typeof planningViews)[number], "calendar">;
export type SubjectExplorerMode = "horizonte" | "carpetas" | "tablero";

export function resolveSubjectExplorer(value: string | string[] | undefined): SubjectExplorerMode {
  return value === "carpetas" || value === "tablero" ? value : "horizonte";
}

export function planningTaskHref(
  view: PlanningView,
  subjectId?: string,
  taskId?: string,
  { explorer = "horizonte", returnEntryId }: { explorer?: SubjectExplorerMode; returnEntryId?: string } = {},
) {
  const href = workspaceHref(view, subjectId);
  const params = new URLSearchParams();
  if (taskId) params.set("tarea", taskId);
  if (view === "subjects" && explorer !== "horizonte") params.set("explorador", explorer);
  if (returnEntryId) params.set("desdeEntrada", returnEntryId);
  return params.size ? href + (href.includes("?") ? "&" : "?") + params : href;
}

export function subjectManagementHref(subjectId?: string) {
  const params = new URLSearchParams({ vista: "gestion" });
  if (subjectId) params.set("asunto", subjectId);
  return "/planificacion?" + params;
}
