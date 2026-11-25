import * as esbuild from "esbuild";
import { readdirSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const outDir = "dist-bundle";
try { rmSync(outDir, { recursive: true }); } catch {}
mkdirSync(outDir, { recursive: true });

const entries = [
  { name: "render", entry: "MiniRender/index.ts" },
  { name: "math", entry: "MiniMath/index.ts" },
  { name: "diagram", entry: "MiniDiagram/index.ts" },
  { name: "text", entry: "MiniText/index.ts" },
  { name: "code", entry: "MiniCode/index.ts" },
  { name: "chart", entry: "MiniChart/index.ts" },
  { name: "table", entry: "MiniTable/index.ts" },
];

for (const e of entries) {
  await esbuild.build({
    entryPoints: [e.entry],
    bundle: true,
    minify: true,
    format: "esm",
    outfile: join(outDir, `${e.name}.mjs`),
    platform: "browser",
    target: "es2022",
    treeShaking: true,
    sourcemap: false,
    logLevel: "silent",
  });
  const { statSync } = await import("fs");
  const size = statSync(join(outDir, `${e.name}.mjs`)).size;
  console.log(`${e.name}: ${size} bytes`);
}
console.log("Done. Output in", outDir);
