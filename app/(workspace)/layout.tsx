import type { ReactNode } from "react";
import WorkspaceProvider from "../components/workspace-provider";
import WorkspaceNavigation from "../components/workspace-navigation";
import { getPageUser } from "../lib/auth";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getPageUser();
  if (!user) return children;

  return (
    <WorkspaceProvider key={user.id}>
      <WorkspaceNavigation />
      {children}
    </WorkspaceProvider>
  );
}
