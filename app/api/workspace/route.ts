import { getPocketBaseWorkspace, savePocketBaseWorkspace } from "../../lib/pocketbase-server";
import { normalizeWorkspaceData } from "../../lib/workspace-codec";
import { getAuthenticatedUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected PocketBase error.";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
    }

    const workspace = await getPocketBaseWorkspace(user.id);
    return Response.json(workspace);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
    }

    const workspace = normalizeWorkspaceData(await request.json());
    const saved = await savePocketBaseWorkspace(user.id, workspace);
    return Response.json(saved);
  } catch (error) {
    return errorResponse(error);
  }
}
