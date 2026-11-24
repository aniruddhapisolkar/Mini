// Example: MiniText + MiniCode cross-module composition

import MiniText from "../MiniText/index.js";
import MiniCode from "../MiniCode/index.js";

const markdown = `# Hello Mini

This is a **Markdown** document with embedded code:

\`\`\`typescript
function greet(name: string): string {
  return "Hello, " + name;
}
\`\`\`

- Item one
- Item two

> A blockquote with *emphasis*.
`;

// Render to a container (browser environment)
declare const container: HTMLElement;
const model = MiniText.parse(markdown);
const ctx = {
  backend: null,
  container: { type: "html", element: container },
  scope: { id: "root", variables: {} },
  resources: { acquire: () => null, release: () => {}, has: () => false },
  scheduler: { schedule: (fn: () => void) => fn(), invalidate: () => {}, flush: () => {} },
  cache: { get: () => undefined, set: () => {}, has: () => false, delete: () => {}, clear: () => {} },
  diagnostics: { report: () => {}, getErrors: () => [], getWarnings: () => [], clear: () => {} },
  mode: "sync" as const,
};
const result = MiniText.render(model, ctx as any);
console.log("Rendered handle:", result.handle.id);
`;
