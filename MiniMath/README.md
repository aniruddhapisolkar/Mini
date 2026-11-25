# MiniMath

Alice's module. KaTeX-parity mathematical typesetting plus an original mathematical illustration DSL.

## Status
Phase 5. See `COMPATIBILITY.md` for the KaTeX command matrix.

## Usage
```ts
import { mathModule } from "./MiniMath";
import { renderToHTML } from "./MiniMath";

renderToHTML("\\frac{a}{b} + \\sqrt{x}");
```

## Benchmarks
`npm run bench` (vitest bench config).
