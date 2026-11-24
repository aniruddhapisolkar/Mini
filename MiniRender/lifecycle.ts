// MiniRender — Lifecycle Management and Resource Manager
// Phase 1: Shared lifecycle and resource ownership

import type { ResourceManager } from "./interfaces.js";
import type { RenderHandle, Diagnostic } from "./types.js";

// ─── Resource manager (ref-counted) ─────────────────────────────

class ResourceManagerImpl implements ResourceManager {
  private resources = new Map<string, { value: unknown; refCount: number }>();

  acquire(key: string, factory: () => unknown): unknown {
    const existing = this.resources.get(key);
    if (existing) {
      existing.refCount++;
      return existing.value;
    }
    const value = factory();
    this.resources.set(key, { value, refCount: 1 });
    return value;
  }

  release(key: string): void {
    const existing = this.resources.get(key);
    if (!existing) return;
    existing.refCount--;
    if (existing.refCount <= 0) {
      this.resources.delete(key);
    }
  }

  has(key: string): boolean {
    return this.resources.has(key);
  }

  getRefCount(key: string): number {
    return this.resources.get(key)?.refCount ?? 0;
  }
}

export function createResourceManager(): ResourceManager {
  return new ResourceManagerImpl();
}

// ─── Render handle factory ──────────────────────────────────────

let handleCounter = 0;

export function createRenderHandle(
  updateFn: (options?: unknown) => void,
  destroyFn: () => void,
  exportFn?: (format: string) => Promise<Blob | string>
): RenderHandle {
  const id = `mini-${++handleCounter}`;
  let destroyed = false;

  const handle: RenderHandle = {
    id,
    update(options?: unknown) {
      if (destroyed) return;
      updateFn(options);
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

// ─── Diagnostics implementation ─────────────────────────────────

import type { Diagnostics } from "./interfaces.js";

export function createDiagnostics(): Diagnostics {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  return {
    report(diagnostic: Diagnostic) {
      if (diagnostic.level === "error") {
        errors.push(diagnostic);
      } else if (diagnostic.level === "warning") {
        warnings.push(diagnostic);
      }
      if (process.env.NODE_ENV === "development") {
        const prefix = diagnostic.level === "error" ? "ERROR" : diagnostic.level === "warning" ? "WARN" : "INFO";
        console.log(`[Mini ${prefix}] ${diagnostic.code}: ${diagnostic.message}`);
      }
    },
    getErrors() {
      return [...errors];
    },
    getWarnings() {
      return [...warnings];
    },
    clear() {
      errors.length = 0;
      warnings.length = 0;
    },
  };
}

// ─── Cache implementation ───────────────────────────────────────

import type { Cache } from "./interfaces.js";

export function createCache(): Cache {
  const store = new Map<string, unknown>();

  return {
    get<T>(key: string): T | undefined {
      return store.get(key) as T | undefined;
    },
    set<T>(key: string, value: T): void {
      store.set(key, value);
    },
    has(key: string): boolean {
      return store.has(key);
    },
    delete(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
  };
}

// ─── Scheduler implementation ────────────────────────────────────

import type { Scheduler } from "./interfaces.js";

export function createScheduler(): Scheduler {
  const pending = new Set<string>();
  const callbacks: Array<() => void> = [];
  let scheduled = false;

  function flushPending() {
    scheduled = false;
    const fns = [...callbacks];
    callbacks.length = 0;
    for (const fn of fns) {
      try {
        fn();
      } catch (e) {
        console.error("Scheduler error:", e);
      }
    }
    pending.clear();
  }

  return {
    schedule(fn: () => void) {
      callbacks.push(fn);
      if (!scheduled) {
        scheduled = true;
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(flushPending);
        } else {
          setTimeout(flushPending, 0);
        }
      }
    },
    invalidate(nodeId: string) {
      pending.add(nodeId);
      if (!scheduled) {
        scheduled = true;
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(flushPending);
        } else {
          setTimeout(flushPending, 0);
        }
      }
    },
    flush() {
      flushPending();
    },
  };
}
