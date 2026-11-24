successfully downloaded text file (SHA: c538559c716e385fe311ee5355691ebf4af32db3)
// Example: cross-module composition — code inside a table cell (Phase 1 reference, Jimbo)
// Demonstrates MiniCode rendering inside MiniTable via shared composition contract.

import { register, resolveBackend, DefaultDiagnostics, DefaultScheduler, DefaultCache, DefaultResourceManager } from "../MiniRender/index";
import codeModule from "../MiniCode/index";
import { textModule } from "../MiniText/index";
import type { RenderContext, RenderHandle } from "../MiniRender/core/types";

// Explicit registration (no side effects)
register(codeModule);
register(textModule);

const container = document.getElementById("app") as HTMLElement;

const ctx: RenderContext = {
  backend: { id: "html", supports: [], createTarget: (c: HTMLElement) => ({ element: c, backend: "html" as const }), render: () => {}, clear: () => {}, measureText: () => ({ width: 0, height: 0, ascent: 0, descent: 0 }), dispose: () => {} },
  container: { element: container, backend: "html" as const },
  scope: { root: container, variables: {} },
  resources: new DefaultResourceManager(),
  scheduler: new DefaultScheduler(),
  cache: new DefaultCache(),
  diagnostics: new DefaultDiagnostics(),
  mode: "sync" as const,
};

// Render a code block
const codeModel = codeModule.parse("const x = 42;\nconsole.log(x);", { language: "typescript" });
const codeResult = codeModule.render(codeModel, ctx);
console.log("code rendered:", codeResult.handle.id);

// Render a text block with embedded code
const textModel = textModule.parse("# Hello\n\nSome text with a code block:\n\n```typescript\nconst y = 10;\n```");
const textResult = textModule.render(textModel, ctx);
console.log("text rendered:", textResult.handle.id);
