import Link from "next/link";
import ui from "../../components/workspace-screen.module.css";
import ViewIcon from "../../components/view-icon";
import { planningViews, workspaceHref } from "../../lib/module-navigation";
import styles from "./planning.module.css";

const labels = {
  subjects: "Asuntos",
  unassigned: "Sin asunto",
  upcoming: "Próximas",
  waiting: "Esperando",
  completed: "Completadas",
  calendar: "Calendario",
};

export default function PlanningTabs({ view, unassigned }: {
  view?: (typeof planningViews)[number];
  unassigned: number;
}) {
  return (
    <nav aria-label="Vistas de Planificación" className={`${ui.tabs} ${styles.tabs}`}>
      {planningViews.map((destination) => (
        <Link
          key={destination}
          href={workspaceHref(destination)}
          aria-current={destination === view ? "page" : undefined}
          className={`${ui.tab} ${styles.tab}`}
        >
          <ViewIcon view={destination} />
          {labels[destination]}
          {destination === "unassigned" && unassigned > 0 ? <span className={styles.tabCount}>{unassigned}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
