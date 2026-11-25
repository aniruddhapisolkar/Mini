# MiniDiagram

Alice's module. Mermaid-compatible diagrams with multiple layout algorithms.

## Supported diagram types
- Flowchart (Mermaid-compatible)
- Sequence diagrams
- Mindmaps (indentation-based)
- Pie charts
- Gantt charts
- State diagrams
- ER diagrams
- Class diagrams

## Layouts
- layered (default, Sugiyama-ish)
- force (Fruchterman-Reingold)
- tree (Reingold-Tilford)

Use `layout force` or `layout tree` directive in source.

## Usage
```ts
import { parseDiagram, renderSVG } from "./MiniDiagram";

const m = parseDiagram("graph TD\\nA --> B");
const svg = renderSVG(m);
```

## Cross-module
Node labels containing `$...$` render math via MiniMath.

## Benchmarks
`npm run bench`.
