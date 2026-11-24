// Mini — Unified Entry Point
// Phase 1: Minimal foundation

import { register } from "./MiniRender/registry.js";
import type { ModuleDescriptor } from "./MiniRender/interfaces.js";

// Module descriptors will be registered here when modules are implemented.
// For Phase 1, this is a placeholder.

export { MiniRender } from "./MiniRender/index.js";

// Placeholder Mini object
export const Mini = {
  render: (kind: string, input: unknown, container: unknown, options?: unknown) => {
    console.log(`[Mini] render("${kind}", ...) — not yet implemented`);
    return null;
  },
  compose: (items: unknown[]) => {
    console.log("[Mini] compose(...) — not yet implemented");
    return null;
  },
};

export default Mini;
