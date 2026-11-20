import { redirect } from "next/navigation";
import { getPageUser } from "../../lib/auth";
import { resolveWorkspaceView } from "../../lib/module-navigation";
import CaptureScreen from "../../modules/capture/screen";

export const metadata = { title: "Captura | Epixodo" };

export default async function CapturePage({ searchParams }: PageProps<"/captura">) {
  if (!(await getPageUser())) redirect("/");
  const { vista } = await searchParams;
  return <CaptureScreen reviewing={resolveWorkspaceView(["capture", "inbox"], vista) === "inbox"} />;
}
