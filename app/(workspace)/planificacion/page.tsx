import { redirect } from "next/navigation";
import TaskManager from "../../components/task-manager";
import { getPageUser } from "../../lib/auth";
import { planningViews, resolveWorkspaceView } from "../../lib/module-navigation";
import { planningTaskHref, resolveSubjectExplorer, resolveSubjectTaskFilter } from "../../modules/planning/navigation";
import PlanningScreen from "../../modules/planning/screen";

export const metadata = { title: "Planificación | Epixodo" };

export default async function PlanningPage({ searchParams }: PageProps<"/planificacion">) {
  if (!(await getPageUser())) redirect("/");
  const { vista, asunto, tarea, asignada, desdeEntrada, explorador, filtro } = await searchParams;
  const view = resolveWorkspaceView(planningViews, vista);
  const subjectId = typeof asunto === "string" ? asunto : undefined;
  const returnEntryId = typeof desdeEntrada === "string" ? desdeEntrada : undefined;
  const subjectOptions = { explorer: resolveSubjectExplorer(explorador), taskFilter: resolveSubjectTaskFilter(filtro), returnEntryId };

  if (view === "calendar" || vista === "gestion") {
    return (
      <TaskManager
        key={view === "calendar" ? "calendar" : subjectId}
        activeView={view === "calendar" ? "calendar" : "subjects"}
        tabs={planningViews}
        initialSubjectId={subjectId ?? null}
        planningReturnHref={vista === "gestion" && (subjectId || returnEntryId || explorador || filtro)
          ? planningTaskHref("subjects", subjectId, undefined, subjectOptions)
          : undefined}
      />
    );
  }

  return (
    <PlanningScreen
      view={view}
      explorer={view === "subjects" ? subjectOptions.explorer : "horizonte"}
      taskFilter={subjectOptions.taskFilter}
      subjectId={subjectId}
      taskId={typeof tarea === "string" ? tarea : undefined}
      highlightedId={typeof asignada === "string" ? asignada : undefined}
      returnEntryId={returnEntryId}
    />
  );
}
