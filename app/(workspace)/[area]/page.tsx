import { notFound, redirect } from "next/navigation";
import TaskManager from "../../components/task-manager";
import { getPageUser } from "../../lib/auth";
import { destinations, resolveWorkspaceView } from "../../lib/module-navigation";

export default async function AreaPage({ params, searchParams }: PageProps<"/[area]">) {
  const { area } = await params;
  const destination = destinations.find(({ id }) => id === area);
  if (!destination) notFound();
  if (!(await getPageUser())) redirect("/");

  const { vista, asunto } = await searchParams;
  const view = resolveWorkspaceView(destination.views, vista);
  if (view === "finances" || view === "capture" || view === "inbox") notFound();
  const subjectId = view === "subjects" && typeof asunto === "string" ? asunto : null;

  return (
    <TaskManager
      key={subjectId ?? view}
      activeView={view}
      tabs={destination.views}
      initialSubjectId={subjectId}
    />
  );
}
