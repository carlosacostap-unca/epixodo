import { redirect } from "next/navigation";
import TaskManager from "../../components/task-manager";
import { getPageUser } from "../../lib/auth";
import { planningViews, resolveWorkspaceView } from "../../lib/module-navigation";
import { resolveSubjectExplorer } from "../../modules/planning/navigation";
import PlanningScreen from "../../modules/planning/screen";

export const metadata = { title: "Planificación | Epixodo" };

export default async function PlanningPage({ searchParams }: PageProps<"/planificacion">) {
  if (!(await getPageUser())) redirect("/");
  const { vista, asunto, tarea, asignada, desdeEntrada, explorador } = await searchParams;
  const view = resolveWorkspaceView(planningViews, vista);
  const subjectId = typeof asunto === "string" ? asunto : undefined;

  if (view === "calendar" || vista === "gestion") {
    return (
      <TaskManager
        key={view === "calendar" ? "calendar" : subjectId}
        activeView={view === "calendar" ? "calendar" : "subjects"}
        tabs={planningViews}
        initialSubjectId={subjectId ?? null}
      />
    );
  }

  return (
    <PlanningScreen
      view={view}
      explorer={view === "subjects" ? resolveSubjectExplorer(explorador) : "horizonte"}
      subjectId={subjectId}
      taskId={typeof tarea === "string" ? tarea : undefined}
      highlightedId={typeof asignada === "string" ? asignada : undefined}
      returnEntryId={typeof desdeEntrada === "string" ? desdeEntrada : undefined}
    />
  );
}
