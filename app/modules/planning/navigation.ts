import { planningViews, workspaceHref } from "../../lib/module-navigation";

export type PlanningView = Exclude<(typeof planningViews)[number], "calendar">;

export function planningTaskHref(view: PlanningView, subjectId?: string, taskId?: string) {
  const href = workspaceHref(view, subjectId);
  if (!taskId) return href;
  return href + (href.includes("?") ? "&" : "?") + new URLSearchParams({ tarea: taskId });
}

export function subjectManagementHref(subjectId?: string) {
  const params = new URLSearchParams({ vista: "gestion" });
  if (subjectId) params.set("asunto", subjectId);
  return "/planificacion?" + params;
}
