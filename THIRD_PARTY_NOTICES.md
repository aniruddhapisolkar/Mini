# Third-Party Notices

This file documents third-party libraries, assets, and dependencies used by Mini, their licenses, and redistribution requirements.

## Primary Reference Libraries

All primary reference libraries are MIT licensed. Mini does not bundle them as runtime dependencies (zero external runtime dependencies), but derives algorithms, data structures, and compatibility tests from them.

| Library | Version | License | Usage |
|---------|---------|---------|-------|
| KaTeX | v0.19.1 | MIT | MiniMath typesetting reference (functional parity target) |
| Pele | (obsidianmd/pele) | MIT | MiniDiagram rendering approach reference |
| Mermaid | 12.1.0 | MIT | MiniDiagram syntax reference |
| Chart.js | (latest) | MIT | MiniChart reference |
| Recharts | (latest) | MIT | MiniChart reference |
| TanStack Table | v8 | MIT | MiniTable reference |
| DataTables | 2.x | MIT | MiniTable reference |
| CommonMark | 0.31.2 | CC BY-SA 4.0 (spec) | MiniText syntax specification |
| GitHub Flavored Markdown | 0.29-gfm | CC BY-SA 4.0 (spec) | MiniText syntax specification |
| Shiki | (latest) | MIT | MiniCode syntax highlighting reference |
| Prism | (latest) | MIT | MiniCode syntax highlighting reference |

## Per-Asset Licensing (Pending Verification)

### KaTeX Fonts
- **Status**: Pending verification
- **Source**: KaTeX/KaTeX repository
- **Derived from**: Computer Modern (Donald Knuth, public domain) and AMS fonts
- **Note**: No separate font license file found in KaTeX repo. Treated as MIT-compatible pending confirmation. To be verified before standalone distribution.

### Oniguruma (Shiki regex engine)
- **Status**: Flagged — WASM dependency concern
- **Source**: oniguruma / oniguruma-wasm
- **License**: BSD-2-Clause
- **Concern**: Oniguruma has a WASM dependency that complicates standalone HTML distribution (single-file, offline, no external network).
- **Resolution options**:
  - Option A: Inline WASM as base64 in standalone bundle (increases size)
  - Option B: Use Prism's regex-based highlighting (no WASM) as default; Oniguruma as optional capability
  - Option C: Vendor a pure-JS regex subset for common languages
  - Option D (NEW): Use Shiki's JavaScript RegExp Engine (`createJavaScriptRegexEngine`) — transpiles Oniguruma patterns to native JS regex via Oniguruma-To-ES. No WASM required. All built-in languages supported as of Shiki 3.9.1. Bundle size ~123 kB (vs 263 kB WASM). Slightly lower throughput than WASM but acceptable for browser/offline use.
- **Current decision**: Option D recommended as primary for standalone HTML (no WASM, full TextMate grammar compatibility, smaller bundle). Option B (Prism) as lightweight fallback for minimal builds. Oniguruma WASM retained as optional for maximum compatibility.

### D3 Submodules (used by Recharts)
- **Status**: Pending verification
- **Source**: d3/d3
- **License**: BSD-3-Clause
- **Note**: Individual submodule licenses to be verified before standalone distribution.

### jQuery (used by DataTables)
- **Status**: Pending verification
- **Source**: jquery/jquery
- **License**: MIT
- **Note**: License verification pending. Not a runtime dependency of Mini (zero external runtime deps).

## Reference Implementations (BSD-2-Clause)

| Library | License | Usage |
|---------|---------|-------|
| cmark (CommonMark C impl) | BSD-2-Clause | Parsing strategy reference |
| commonmark.js | BSD-2-Clause | Parsing strategy reference |

## Development Dependencies

| Dependency | License | Usage |
|------------|---------|-------|
| TypeScript | Apache-2.0 | Build tooling |
| Vitest | MIT | Testing |

## Notes

- Mini targets zero external runtime dependencies. Development dependencies are acceptable when justified.
- All derived code must maintain attribution and license notices.
- This file will be updated as per-asset licensing verification is completed.
- Comprehensive license compliance audit will be performed in Phase 6 (Hardening and Release).
