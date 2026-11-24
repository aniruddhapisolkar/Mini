# Mini

Minimal Size. Maximum Capability. Extreme Performance.

Unified rendering library: one engine (MiniRender), six modules (MiniDiagram, MiniText, MiniMath, MiniCode, MiniChart, MiniTable).

## Install

```bash
npm install mini
```

## Usage

```ts
import Mini from "mini";

Mini.text.render(markdown, container);
Mini.code.render(source, { language: "typescript" }, container);
Mini.math.render(latex, container);
Mini.diagram.render(source, container);
Mini.chart.render(spec, container);
Mini.table.render(data, container);
```

## Selective imports

```ts
import { text } from "mini/text";
import { code } from "mini/code";
```

## Standalone HTML

All modules are tree-shakeable and can be bundled into a single offline HTML file.

## Development

```bash
npm run typecheck
npm test
npm run bench
```

## License

MIT
```
