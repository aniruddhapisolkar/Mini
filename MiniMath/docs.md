# MiniMath — Documentation

## Typesetting
```ts
import { renderToHTML, renderToMathML, parseLatex } from "./MiniMath";

renderToHTML("\\frac{a}{b} + \\sqrt{x}");
renderToHTML("x^2", { displayMode: true });
```

## Illustration DSL
```ts
import { illustrate } from "./MiniMath";
illustrate("sin", container, { width: 400, height: 300 });
```
Supported functions: sin, cos, tan, x, x^2, x^3, sqrt, exp, log.

## Cross-module
Math can be embedded in MiniDiagram node labels using `$...$`.

## Benchmarks
`npm run bench` (vitest bench config).
