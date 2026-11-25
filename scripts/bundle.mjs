import { build } from "esbuild";
import { readdirSync, mkdirSync } from "fs";
import { join } from "path";

const modules = ["MiniRender", "MiniChart", "MiniTable", "MiniMath", "MiniDiagram", "MiniText", "MiniCode"];
const outDir = "dist/bundle";

mkdirSync(outDir, { recursive: true });

for (const mod of modules) {
  await build({
    entryPoints: [`${mod}/index.ts`],
    bundle: true,
    minify: true,
    format: "esm",
    outfile: `${outDir}/${mod.toLowerCase()}.mjs`,
    target: "es2022",
    treeShaking: true,
    sourcemap: false,
  });
  console.log(`Bundled ${mod}`);
}

console.log("Bundle complete");