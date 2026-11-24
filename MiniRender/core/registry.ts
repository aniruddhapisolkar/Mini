// MiniRender — module registration (Phase 1)
// Explicit, tree-shakeable. No side-effect imports.

import type { ModuleDescriptor, ModuleKind } from "./types";

const registry = new Map<ModuleKind, ModuleDescriptor>();

export function register(descriptor: ModuleDescriptor): void {
  if (registry.has(descriptor.id)) {
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
    if (proc && proc.env?.NODE_ENV !== "production") {
      throw new Error(`Module already registered: ${descriptor.id}`);
    }
    // eslint-disable-next-line no-console
    console.warn(`Module already registered: ${descriptor.id}`);
    return;
  }
  registry.set(descriptor.id, descriptor);
}

export function unregister(id: ModuleKind): boolean {
  return registry.delete(id);
}

export function getModule(id: ModuleKind): ModuleDescriptor | undefined {
  return registry.get(id);
}

export function listModules(): ModuleDescriptor[] {
  return [...registry.values()];
}

export function hasModule(id: ModuleKind): boolean {
  return registry.has(id);
}

export function clearRegistry(): void {
  registry.clear();
}
