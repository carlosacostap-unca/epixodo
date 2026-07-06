import { getPocketBaseWorkspace, savePocketBaseWorkspace } from "../../lib/pocketbase-server";
import { normalizeWorkspaceData } from "../../lib/workspace-codec";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected PocketBase error.";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const workspace = await getPocketBaseWorkspace();
    return Response.json(workspace);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const workspace = normalizeWorkspaceData(await request.json());
    const saved = await savePocketBaseWorkspace(workspace);
    return Response.json(saved);
  } catch (error) {
    return errorResponse(error);
  }
}
