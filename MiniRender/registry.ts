// MiniRender — Module Registration
// Phase 1: Explicit, tree-shakeable registration

import type { ModuleDescriptor } from "./interfaces.js";
import type { ModuleKind } from "./types.js";

// ─── Registry ───────────────────────────────────────────────────

const registry = new Map<ModuleKind, ModuleDescriptor>();

export function register(descriptor: ModuleDescriptor): void {
  if (registry.has(descriptor.id)) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(`Module "${descriptor.id}" is already registered.`);
    } else {
      console.warn(`Module "${descriptor.id}" is already registered. Ignoring duplicate.`);
      return;
    }
  }
  registry.set(descriptor.id, descriptor);
}

export function unregister(id: ModuleKind): void {
  registry.delete(id);
}

export function getModule(id: ModuleKind): ModuleDescriptor | undefined {
  return registry.get(id);
}

export function hasModule(id: ModuleKind): boolean {
  return registry.has(id);
}

export function listModules(): ModuleDescriptor[] {
  return Array.from(registry.values());
}

export function resolveBackend(
  requested: string,
  moduleSupported: string[],
  available: string[]
): string {
  // Fallback chain: requested → module-supported → globally-available → html
  if (moduleSupported.includes(requested) && available.includes(requested)) {
    return requested;
  }
  for (const backend of moduleSupported) {
    if (available.includes(backend)) {
      return backend;
    }
  }
  for (const backend of available) {
    if (moduleSupported.includes(backend)) {
      return backend;
    }
  }
  // Universal fallback
  return "html";
}
