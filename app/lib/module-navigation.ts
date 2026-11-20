export const planningViews = ["subjects", "unassigned", "upcoming", "waiting", "completed", "calendar"] as const;

export const modules = [
  { id: "captura", label: "Captura", description: "Anotá algo por texto o voz y revisalo en Bandeja.", views: ["capture", "inbox"] },
  { id: "planificacion", label: "Planificación", description: "Organizá tus asuntos, tareas y fechas clave.", views: planningViews },
  { id: "agenda", label: "Agenda personal", description: "Definí tus objetivos y seguí tus horarios y lugares.", views: ["ideal-day", "locations"] },
  { id: "esperas", label: "Esperas", description: "Hacé seguimiento de las entregas y respuestas que esperás.", views: ["expectations"] },
  { id: "finanzas", label: "Finanzas", description: "Consultá tus saldos, movimientos y pagos pendientes.", views: ["finances"] },
  { id: "nutricion", label: "Nutrición", description: "Planificá comidas, registrá consumos y prepará compras.", views: ["nutrition"] },
  { id: "compania", label: "Compañía", description: "Conversá con la IA y retomá tus charlas.", views: ["companion"] },
] as const;

export const todayDestination = { id: "hoy", label: "Hoy", views: ["today"] } as const;
export const destinations = [todayDestination, ...modules];
export type WorkspaceView = (typeof destinations)[number]["views"][number];
export type LegacyWorkspaceView = Exclude<WorkspaceView, "finances" | "capture" | "inbox">;

const viewSlugs: Partial<Record<WorkspaceView, string>> = {
  inbox: "bandeja",
  calendar: "calendario",
  upcoming: "proximas",
  unassigned: "sin-asunto",
  waiting: "esperando",
  completed: "completadas",
  locations: "ubicaciones",
};

export function workspaceHref(view: WorkspaceView, subjectId?: string) {
  const destination = destinations.find(({ views }) => views.some((item) => item === view));
  if (!destination) throw new Error(`Unknown workspace view: ${view}`);

  const params = new URLSearchParams();
  const slug = viewSlugs[view];
  if (slug) params.set("vista", slug);
  if (view === "subjects" && subjectId) params.set("asunto", subjectId);
  const query = params.toString();
  return `/${destination.id}${query ? `?${query}` : ""}`;
}

export function resolveWorkspaceView<View extends WorkspaceView>(
  views: readonly [View, ...View[]],
  slug: string | string[] | undefined,
): View {
  return views.find((view) => viewSlugs[view] === slug) ?? views[0];
}
