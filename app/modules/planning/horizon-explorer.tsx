import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ViewIcon from "../../components/view-icon";
import ui from "../../components/workspace-screen.module.css";
import { getSubjectPath, type Subject, type SubjectHorizon } from "../../lib/tasks";
import { groupSubjectsByHorizon } from "./subject-horizons";
import styles from "./planning.module.css";

type HorizonExplorerProps = {
  subjects: Subject[];
  selected?: Subject;
  subjectHref: (subjectId: string) => string;
};

export function SubjectHorizonExplorer({ subjects, selected, subjectHref }: HorizonExplorerProps) {
  const groups = groupSubjectsByHorizon(subjects);
  const firstPopulatedGroup = groups.find((group) => group.subjects.length)?.value;
  const activeGroup = selected?.horizon ?? firstPopulatedGroup;
  const selectedId = selected?.id;
  const explorer = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activeGroup) return;
    const group = explorer.current?.querySelector<HTMLDetailsElement>(`[data-horizon="${activeGroup}"]`);
    if (group && (selectedId || !explorer.current?.querySelector("details[open]"))) group.open = true;
  }, [activeGroup, selectedId]);

  return (
    <nav ref={explorer} aria-label="Asuntos por horizonte" className={styles.horizonGroups}>
      {groups.map(({ value, label, subjects: items }) => (
        <details key={value} data-horizon={value} className={styles.horizonGroup}>
          <summary className={styles.horizonGroupHeading}>
            <span aria-hidden="true" className={styles.chevron} />
            <span>{label}</span>
            <span className={styles.groupCount} aria-label={`${items.length} asuntos`}>{items.length}</span>
          </summary>
          {items.length ? (
            <ul className={styles.horizonSubjects}>
              {items.map((subject) => (
                <li key={subject.id}>
                  <Link
                    href={subjectHref(subject.id)}
                    aria-current={selected?.id === subject.id ? "true" : undefined}
                    className={`${ui.selection} ${styles.horizonSubject}`}
                  >
                    <ViewIcon view="subjects" className="size-4 shrink-0" />
                    <SubjectName subject={subject} subjects={subjects} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className={styles.emptyGroup}>Sin asuntos</p>}
        </details>
      ))}
    </nav>
  );
}

function SubjectName({ subject, subjects }: { subject: Subject; subjects: Subject[] }) {
  return (
    <span className="min-w-0 wrap-anywhere">
      <span className="block font-semibold">{subject.name}</span>
      {subject.parentSubjectId ? (
        <span className={styles.subjectPath}>{getSubjectPath(subjects, subject.parentSubjectId)}</span>
      ) : null}
    </span>
  );
}

export function PlanningHorizonBoard({
  subjects, selected, subjectHref, onMove,
}: HorizonExplorerProps & { onMove: (subject: Subject, horizon: SubjectHorizon) => void }) {
  const [dragging, setDragging] = useState<Subject>();
  const [destination, setDestination] = useState<SubjectHorizon>();

  function endDrag() {
    setDragging(undefined);
    setDestination(undefined);
  }

  return (
    <div className={styles.board}>
      {groupSubjectsByHorizon(subjects).map(({ value, label, subjects: items }) => (
        <section
          key={value}
          aria-labelledby={`board-${value}`}
          className={`${ui.panel} ${styles.boardGroup}`}
          data-drop-target={destination === value || undefined}
          onDragOver={(event) => {
            if (!dragging || dragging.horizon === value) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDestination(value);
          }}
          onDragLeave={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
              setDestination((current) => current === value ? undefined : current);
            }
          }}
          onDrop={(event) => {
            if (!dragging || dragging.horizon === value) return;
            event.preventDefault();
            onMove(dragging, value);
            endDrag();
          }}
        >
          <h3 id={`board-${value}`} className={styles.boardGroupHeading}>
            <span>{label}</span>
            <span className={styles.groupCount} aria-label={`${items.length} asuntos`}>{items.length}</span>
          </h3>
          {items.length ? (
            <ul className={styles.boardSubjects}>
              {items.map((subject) => (
                <li key={subject.id}>
                  <Link
                    href={subjectHref(subject.id)}
                    aria-current={selected?.id === subject.id ? "true" : undefined}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", subject.name);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(subject);
                    }}
                    onDragEnd={endDrag}
                    className={`${ui.selection} ${styles.boardSubject}`}
                  >
                    <SubjectName subject={subject} subjects={subjects} />
                    <span aria-hidden="true" className={styles.dragHandle}>⠿</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className={styles.emptyGroup}>Sin asuntos</p>}
        </section>
      ))}
    </div>
  );
}
