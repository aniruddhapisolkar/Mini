// MiniRender — default implementations of shared services (Phase 1, aligned with Cortana)

import type {
  BackendId, Diagnostic, ModuleKind, RenderHandle, RenderTarget, StyleScope,
} from "./core/types";
import type {
  Backend, Cache, Diagnostics, RenderContext, RenderNode, ResourceManager, Scheduler,
} from "./core/interfaces";

// ---- Diagnostics ----
export class DefaultDiagnostics implements Diagnostics {
  private errors: Diagnostic[] = [];
  private warnings: Diagnostic[] = [];
  report(d: Diagnostic): void {
    if (d.level === "error") this.errors.push(d);
    else if (d.level === "warning") this.warnings.push(d);
  }
  getErrors(): Diagnostic[] { return [...this.errors]; }
  getWarnings(): Diagnostic[] { return [...this.warnings]; }
  clear(): void { this.errors = []; this.warnings = []; }
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
}

// ---- Cache ----
export class DefaultCache implements Cache {
  private store = new Map<string, unknown>();
  get<T>(key: string): T | undefined { return this.store.get(key) as T | undefined; }
  set<T>(key: string, value: T): void { this.store.set(key, value); }
  has(key: string): boolean { return this.store.has(key); }
  delete(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

// ---- ResourceManager ----
export class DefaultResourceManager implements ResourceManager {
  private store = new Map<string, unknown>();
  acquire(key: string, factory: () => unknown): unknown {
    if (!this.store.has(key)) this.store.set(key, factory());
    return this.store.get(key);
  }
  release(key: string): void { this.store.delete(key); }
  has(key: string): boolean { return this.store.has(key); }
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
  chain.push("html");
  for (const b of chain) {
    if (moduleSupported.includes(b) && available.includes(b)) return b;
  }
  if (available.includes("html")) return "html";
  return null;
}

export function createScope(id: string, variables: Record<string, string> = {}, parent?: StyleScope): StyleScope {
  if (parent) return { id, variables, parent };
  return { id, variables };
}

export { htmlBackend } from "./backends/html";
export { svgBackend } from "./backends/svg";
export { createRenderHandle } from "./core/lifecycle";
export type { BackendId } from "./core/types";
export type { Backend } from "./core/interfaces";
export * from "./core/types";
export * from "./core/interfaces";
export * from "./core/registry";
export { TextProcessor, Typography, sanitizeHtml, CanvasTextMeasurer, createSpan, decodeHtmlEntities } from "./text/index";
