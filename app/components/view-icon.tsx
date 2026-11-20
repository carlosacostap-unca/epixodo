import type { WorkspaceView } from "../lib/module-navigation";

export default function ViewIcon({ view, className = "size-4" }: { view: WorkspaceView; className?: string }) {
  const paths: Record<WorkspaceView, React.ReactNode> = {
    "ideal-day": <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    capture: <><path d="M12 3v11" /><path d="M8 7a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0V7Z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    companion: <><path d="M5 5.5h14v10H9l-4 3v-13Z" /><path d="M9 9h6M9 12h4" /></>,
    today: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    inbox: <><path d="M4 5.5h16v13H4z" /><path d="M4 14h4l1.5 2h5l1.5-2h4" /></>,
    unassigned: <><path d="M4 6h16M4 12h10M4 18h7" /><circle cx="18" cy="15" r="2" /></>,
    upcoming: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    waiting: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5v7M14.5 8.5v7" /></>,
    completed: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8.5" /></>,
    calendar: <><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M8 2.5v4M16 2.5v4M3.5 9.5h17M8 13h2M14 13h2M8 17h2" /></>,
    subjects: <><path d="M4 6.5h7l2 2H20v10H4z" /><path d="M4 10h16" /></>,
    finances: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M7 9.5h10M7 14.5h4M15.5 13v3M14 14.5h3" /></>,
    nutrition: <><path d="M7 3v8M10 3v8M7 7h3M8.5 11v10M16 3c2 3 2 7 0 10M16 3v18" /></>,
    locations: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    expectations: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2M4 4l2 2M20 4l-2 2" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[view]}
    </svg>
  );
}
