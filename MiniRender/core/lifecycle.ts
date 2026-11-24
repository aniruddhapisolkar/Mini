// MiniRender — Lifecycle implementations (Phase 1, Cortana)
// Default service implementations: ResourceManager, Cache, Scheduler, Diagnostics, RenderHandle.

import type {
  Resource, ResourceManager, Cache, Scheduler, Diagnostics, Diagnostic, RenderHandle,
} from "./types";

// ─── ResourceManager (ref-counted) ──────────────────────────────

export class DefaultResourceManager implements ResourceManager {
  private resources = new Map<string, Resource>();

  acquire(id: string, type: Resource["type"], owner: import("./types").ModuleKind | "render"): Resource {
    const existing = this.resources.get(id);
    if (existing) {
      existing.refCount++;
      return existing;
    }
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

  get(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  list(): Resource[] {
    return [...this.resources.values()];
  }

  has(id: string): boolean {
    return this.resources.has(id);
  }

  getRefCount(id: string): number {
    return this.resources.get(id)?.refCount ?? 0;
  }
}

export function createResourceManager(): ResourceManager {
  return new DefaultResourceManager();
}

// ─── Cache (with TTL support) ───────────────────────────────────

export class DefaultCache implements Cache {
  private store = new Map<string, { value: unknown; expires?: number }>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expires && Date.now() > e.expires) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (ttlMs) {
      this.store.set(key, { value, expires: Date.now() + ttlMs });
    } else {
      this.store.set(key, { value });
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export function createCache(): Cache {
  return new DefaultCache();
}

// ─── Scheduler ──────────────────────────────────────────────────

export class DefaultScheduler implements Scheduler {
  private queue: Array<() => void> = [];
  private invalidated = new Set<string>();

  schedule(fn: () => void, priority: "high" | "normal" | "low" = "normal"): void {
    this.queue.push(fn);
  }

  invalidate(nodeId: string): void {
    this.invalidated.add(nodeId);
  }

  flush(): void {
    const q = this.queue.splice(0);
    for (const fn of q) {
      try {
        fn();
      } catch (e) {
        console.error("Scheduler error:", e);
      }
    }
  }

  cancelAll(): void {
    this.queue = [];
    this.invalidated.clear();
  }

  invalidatedNodes(): string[] {
    return [...this.invalidated];
  }
}

export function createScheduler(): Scheduler {
  return new DefaultScheduler();
}

// ─── Diagnostics ────────────────────────────────────────────────

export class DefaultDiagnostics implements Diagnostics {
  private items: Diagnostic[] = [];

  emit(d: Diagnostic): void {
    this.items.push(d);
    if (process.env.NODE_ENV === "development") {
      const prefix = d.level === "error" ? "ERROR" : d.level === "warn" ? "WARN" : "INFO";
      console.log(`[Mini ${prefix}] ${d.code}: ${d.message}`);
    }
  }

  list(): Diagnostic[] {
    return [...this.items];
  }

  getErrors(): Diagnostic[] {
    return this.items.filter((d) => d.level === "error");
  }

  getWarnings(): Diagnostic[] {
    return this.items.filter((d) => d.level === "warn");
  }

  clear(): void {
    this.items = [];
  }
}

export function createDiagnostics(): Diagnostics {
  return new DefaultDiagnostics();
}

// ─── Render handle factory ──────────────────────────────────────

let handleCounter = 0;

export function createRenderHandle(
  kind: import("./types").ModuleKind,
  root: import("./types").RenderNode,
  updateFn: (input?: unknown, options?: unknown) => void,
  destroyFn: () => void,
  exportFn?: (format: string) => Promise<Blob | string>
): RenderHandle {
  const id = `mini-${++handleCounter}`;
  let destroyed = false;

  const handle: RenderHandle = {
    id,
    kind,
    root,
    update(input?: unknown, options?: unknown) {
      if (destroyed) return;
      updateFn(input, options);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      destroyFn();
    },
  };

  if (exportFn) {
    handle.export = async (format) => {
      if (destroyed) throw new Error("Cannot export a destroyed handle");
      return exportFn(format);
    };
  }

  return handle;
}
