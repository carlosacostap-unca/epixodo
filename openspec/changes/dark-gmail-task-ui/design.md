## Context

Epixodo is currently a compact Next.js 16 App Router application with one interactive task-manager component. The existing model, selectors, localStorage persistence, and project workflow are already in place. The requested change is a UX/UI reshape toward a dark Gmail-like productivity workspace.

The design audience is one person using Epixodo as a daily personal command center. The page's single job is to help that user capture, scan, triage, and continue tasks quickly.

## Goals / Non-Goals

**Goals:**

- Make dark mode the default visual experience.
- Recompose the screen into a Gmail-like shell: left navigation, top search/action strip, central inbox, and right context rail.
- Increase scannability through dense task rows, metadata chips, compact controls, and stronger hover/focus states.
- Add a client-side search filter that narrows the current task view without changing stored task data.
- Preserve current task/project behavior and local-only persistence.

**Non-Goals:**

- Add authentication, server persistence, sync, notifications, or routing changes.
- Replace the task model or view selector rules.
- Add new runtime dependencies.
- Implement a light/dark theme toggle in this pass.
- Copy Gmail branding, icons, or proprietary interface assets.

## Decisions

### Keep the App Router structure unchanged

The root `layout.tsx` remains a server component that imports global CSS and applies optimized fonts, while the interactive workspace remains inside the existing client component. This follows the installed Next.js 16 guidance for App Router layouts, global CSS, fonts, and client components.

Alternative considered: move the shell into `layout.tsx`. That would make sense for multiple routes, but this app currently has one route and the shell needs task state for counts, search, and view selection.

### Use dark tokens in global CSS and Tailwind utilities in the component

Global CSS will define the baseline dark background, foreground, color scheme, form defaults, focus styling, selection color, and scrollbar treatment. Component-level layout and states will stay in Tailwind utility classes so the current styling approach remains consistent.

Alternative considered: introduce CSS modules for the redesign. That would scope styles neatly, but the existing app already uses Tailwind utilities and the surface is small.

### Treat Gmail as an ergonomics reference, not a clone

The layout will borrow Gmail's familiar productivity pattern: persistent left rail, search bar, dense list, item hover affordance, and context side panel. Epixodo keeps its own dark palette, task vocabulary, and project-specific controls.

Design tokens:

- `mail night` #0b1018 for the page background.
- `rail ink` #111827 for navigation surfaces.
- `message pane` #172033 for task rows and panels.
- `thread hover` #22304a for active and hover surfaces.
- `action blue` #8ab4f8 for primary focus and selected states.
- `deadline amber` #f6c177 for due/unplanned emphasis.

Typography remains Geist Sans for product UI and Geist Mono for date/count fragments. The signature element is a narrow colored "message rail" on selected navigation and task rows, giving the list a mailbox rhythm without decorative clutter.

### Search is derived client state

The search input will live in `TaskManager` as local state. It filters the already-derived `visibleTasks` by title, notes, project name, priority label, and status label. Counts in the sidebar remain true view counts, while the heading shows the filtered count when searching.

Alternative considered: store search query in URL parameters. That is useful for shareable views, but this is a local personal workspace and the current app has no routing-level view state.

### Preserve inline editing

Task rows keep inline title, notes, status, project, date, priority, completion, and delete controls. The redesign changes density, contrast, grouping, and affordances, not the editing contract.

Alternative considered: split editing into a drawer. That would reduce row complexity, but it would slow down a personal task list where fast inline changes are the current value.

## Risks / Trade-offs

- Dense dark UI can reduce legibility -> use high-contrast text tiers, visible borders, and generous row spacing on mobile.
- Search can make an empty view ambiguous -> empty state must distinguish no tasks from no matches.
- Inline controls in dense rows can feel crowded -> use responsive grids and preserve stable control heights.
- Gmail-like expectation may imply keyboard shortcuts or email actions -> keep this pass focused on visual ergonomics and current task behavior.

## Migration Plan

- No data migration is needed.
- Existing localStorage task and project records remain compatible.
- Rollback is a code revert of the visual component and CSS changes.

## Open Questions

- A later pass can decide whether Epixodo needs a persistent theme toggle or should remain dark-only.
- A later pass can decide whether search and active view should be stored in URL state.
