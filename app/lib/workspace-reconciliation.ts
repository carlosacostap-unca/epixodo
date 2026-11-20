import type { WorkspaceData } from "./tasks";

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function identified(values: unknown[]): values is Array<Record<string, unknown> & { id: string }> {
  return values.every((value) => isRecord(value) && typeof value.id === "string");
}

function reconcile(base: unknown, local: unknown, remote: unknown): unknown {
  if (same(base, local)) return remote;

  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote) &&
      identified(base) && identified(local) && identified(remote)) {
    const baseById = new Map(base.map((item) => [item.id, item]));
    const localById = new Map(local.map((item) => [item.id, item]));
    const remoteById = new Map(remote.map((item) => [item.id, item]));
    const result = remote.flatMap((item) => {
      const next = localById.get(item.id);
      const prior = baseById.get(item.id);
      if (prior && !next) return [];
      return [next ? reconcile(prior, next, item) : item];
    });
    for (const item of local) {
      if (!remoteById.has(item.id) && !same(item, baseById.get(item.id))) result.push(item);
    }
    return result;
  }

  if (isRecord(base) && isRecord(local) && isRecord(remote)) {
    const result = { ...remote };
    for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
      if (same(base[key], local[key])) continue;
      if (!(key in local)) delete result[key];
      else result[key] = reconcile(base[key], local[key], remote[key]);
    }
    return result;
  }

  return local;
}

export function reconcileWorkspace(base: WorkspaceData, local: WorkspaceData, remote: WorkspaceData): WorkspaceData {
  return reconcile(base, local, remote) as WorkspaceData;
}
