# MiniDiagram — Feature Inventory

Owner: Alice
References: Pele (obsidianmd/pele, Mermaid 12.1.0 syntax target), Mermaid (https://mermaid.js.org), plus established diagramming libraries
Status: Phase 0 research

## 1. Reference libraries pinned

- Pele: https://github.com/obsidianmd/pele — MIT, TypeScript, zero runtime deps, synchronous SVG renderer targeting Mermaid 12.1.0 syntax. 100-500x faster than Mermaid.js. Source of layout (layered/compound/lanes), SVG builder, theming via CSS variables.
- Mermaid: https://mermaid.js.org — MIT, canonical syntax reference (Mermaid 12.1.0). Parser specs + differential fuzzing tests (under tests/compat, MIT).
- Additional: ELK (layered layout), Dagre (graph layout), D3 (sankey/treemap), Cytoscape (graph theory), GoJS (interactive), mxGraph/draw.io (shapes/connectors).

License note: Pele and Mermaid are MIT; specs/grammars under tests/compat are MIT. Verify before vendoring. No external runtime deps targeted (zero deps).

## 2. Diagram types (MiniDiagram must support)

From Pele/Mermaid 12.1.0 union, plus AGENTS.md expansion:

### Flow & graph
- Flowchart (TD/LR/BT/RL, subgraphs, nodes, edges, shapes)
- Directed graph / undirected graph
- Dependency graph
- Architecture diagram
- Block diagram
- C4 (context/container/component/code)
- Class diagram
- State diagram (incl. nested/composite)
- Entity-relationship diagram (ER)
- Sequence diagram
- Use case diagram
- Activity / swimlane diagram
- Requirement diagram
- Mind map
- Tree / hierarchy / treeview
- Network visualization
- Sankey / flow (data-driven)
- Treemap
- Timeline
- Gantt
- Kanban
- Journey (user journey)
- Pie chart (diagram-level)
- Radar / quadrant chart (diagram-level)
- Git graph
- Info diagram
- Packet diagram
- Ishikawa (fishbone)
- Venn
- Wardley map
- Cynefin
- Event modeling
- Railroad (syntax diagrams)
- Agentflow
- XY chart
- Custom diagram types (extension point)

### Layouts
- Automatic layout (layered/Sugiyama, force-directed, tree, radial, grid)
- Manual layout (absolute positioning, pin nodes)
- Nested structures / subgraphs / clusters
- Swimlanes
- Composite layout

### Elements
- Nodes with custom shapes (rect, round, diamond, hexagon, cylinder, stadium, circle, etc.)
- Edges/connectors: straight, orthogonal, curved, bezier, spline
- Edge routing (avoid overlaps, obstacle avoidance)
- Labels on nodes and edges
- Annotations, tooltips, icons, images
- Multi-edge, self-loops, hyperedges

### Interaction & animation
- Interactive diagrams (click, hover, drag, select)
- Animations (entrance, path animation, transitions)
- Zoom/pan
- Responsive to container

### Cross-module embedding
- Math equations in labels/nodes
- Code blocks in nodes
- Charts in nodes
- Text/rich content in annotations
- Diagrams inside tables/text

## 3. Syntax
- Primary: Mermaid-compatible declarative DSL (max compatibility with existing diagrams).
- Extensions for Mini-specific features (custom shapes, interaction, animation) via Mermaid-compatible directive/config syntax where possible; otherwise documented extensions.
- Simple diagrams must be expressible in a few lines; complex remain possible.

## 4. Rendering
- Backend: SVG primary (Pele approach). Canvas/WebGL for very large graphs. HTML for accessibility/interactivity overlays.
- Zero runtime deps; tree-shakeable diagram types (register individually or lazy load).
- CSS variables theming (--pele-* style), colors adapt without re-render.
- Security: escape text, filter links/styles, limit source and output size.

## 5. Layout engine (reusable)
- Layered (Sugiyama) for DAGs/flowcharts
- Compound layout for nested subgraphs
- Lanes for swimlanes
- Force-directed for networks
- Tree/radial for hierarchies
- Manual override layer

## 6. Performance
- Synchronous render (no DOM measurement where avoidable)
- Reuse layout results; incremental update on small changes
- Lazy diagram type registration
- Virtualization for very large graphs (render visible subgraph)
- Benchmarks vs Mermaid.js (bundle size + render time)

## 7. Accessibility
- Semantic SVG (title/desc, role="img")
- ARIA labels, keyboard navigation for interactive diagrams
- Reduced motion
- Accessible color palettes

## 8. Export & serialization
- SVG export, PNG via shared export infra
- JSON model (DiagramModel) serialization
- Import from Mermaid source

## 9. Public API (draft)
```ts
Mini.diagram.render(source, container, options?);
Mini.diagram.renderAsync(source); // lazy types
Mini.diagram.register(type);
const model = Mini.diagram.parse(source);
instance.update(source);
instance.destroy();
```

## 10. Build / distribution
- Zero runtime deps
- ESM + CJS + UMD, tree-shakeable
- Standalone bundle embeddable in single HTML
- TypeScript declarations
- Selective diagram-type bundles
