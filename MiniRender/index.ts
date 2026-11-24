// MiniRender — default implementations of shared services (Phase 1)

import type {
  Backend, BackendId, Cache, Diagnostics, Diagnostic, ModuleKind, RenderContext,
  RenderHandle, RenderNode, RenderTarget, ResourceManager, Resource, Scheduler, StyleScope,
} from "./core/types";

// ---- Diagnostics ----
export class DefaultDiagnostics implements Diagnostics {
  private items: Diagnostic[] = [];
  emit(d: Diagnostic): void { this.items.push(d); }
  list(): Diagnostic[] { return [...this.items]; }
  clear(): void { this.items = []; }
}

// ---- Scheduler ----
export class DefaultScheduler implements Scheduler {
  private queue: Array<() => void> = [];
  private invalidated = new Set<string>();
  schedule(fn: () => void): void { this.queue.push(fn); }
  invalidate(nodeId: string): void { this.invalidated.add(nodeId); }
  flush(): void {
    const q = this.queue.splice(0);
    for (const fn of q) fn();
  }
  cancelAll(): void { this.queue = []; this.invalidated.clear(); }
  invalidatedNodes(): string[] { return [...this.invalidated]; }
}

// ---- Cache ----
export class DefaultCache implements Cache {
  private store = new Map<string, { value: unknown; expires?: number }>();
  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expires && Date.now() > e.expires) { this.store.delete(key); return undefined; }
    return e.value as T;
  }
  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expires: ttlMs ? Date.now() + ttlMs : undefined });
  }
  has(key: string): boolean { return this.get(key) !== undefined; }
  delete(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

// ---- ResourceManager ----
export class DefaultResourceManager implements ResourceManager {
  private resources = new Map<string, Resource>();
  acquire(id: string, type: Resource["type"], owner: ModuleKind | "render"): Resource {
    const existing = this.resources.get(id);
    if (existing) { existing.refCount++; return existing; }
    const r: Resource = { id, type, owner, refCount: 1 };
    this.resources.set(id, r);
    return r;
  }
  release(id: string): void {
    const r = this.resources.get(id);
    if (!r) return;
    r.refCount--;
    if (r.refCount <= 0) this.resources.delete(id);
  }
  get(id: string): Resource | undefined { return this.resources.get(id); }
  list(): Resource[] { return [...this.resources.values()]; }
}

// ---- Backend resolution ----
export function resolveBackend(
  requested: BackendId | undefined,
  moduleSupported: BackendId[],
  available: BackendId[],
): BackendId | null {
  const chain: BackendId[] = [];
  if (requested) chain.push(requested);
  chain.push(...moduleSupported);
  chain.push(...available);
  chain.push("html"); // universal fallback
  for (const b of chain) {
    if (moduleSupported.includes(b) && available.includes(b)) return b;
  }
  // last resort
  if (available.includes("html")) return "html";
  return null;
}

// ---- StyleScope helper ----
export function createScope(root: HTMLElement, variables: Record<string, string> = {}): StyleScope {
  return { root, variables };
}

export { htmlBackend } from "./backends/html";
export type { Backend, BackendId } from "./core/types";
export * from "./core/types";
export * from "./core/registry";
