// Example: cross-module composition (Phase 1 reference)
// Demonstrates embedding a math expression inside a diagram node.

import { register, resolveBackend } from "../MiniRender/index";
import mathModule from "../MiniMath/index";
import diagramModule from "../MiniDiagram/index";
import { DefaultDiagnostics, DefaultScheduler, DefaultCache, DefaultResourceManager } from "../MiniRender/index";

// Explicit registration (no side effects)
register(mathModule);
register(diagramModule);

const container = document.getElementById("app") as HTMLElement;
const ctx = {
  backend: { id: "html", supports: [], createTarget: (c: HTMLElement) => ({ element: c, backend: "html" as const }), render: () => {}, clear: () => {}, measureText: () => ({ width: 0, height: 0, ascent: 0, descent: 0 }), dispose: () => {} },
  container: { element: container, backend: "html" as const },
  scope: { root: container, variables: {} },
  resources: new DefaultResourceManager(),
  scheduler: new DefaultScheduler(),
  cache: new DefaultCache(),
  diagnostics: new DefaultDiagnostics(),
  mode: "sync" as const,
};

const diagramModel = diagramModule.parse("A: Circle area [math: \\pi r^2]\nB: Volume [math: \\frac{4}{3}\\pi r^3]");
const result = diagramModule.render(diagramModel, ctx as any);
console.log("rendered", result.handle.id);
