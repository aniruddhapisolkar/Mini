import { bench, describe } from "vitest";
import { tokenize } from "../MiniCode/tokenizer";

const js = `function fib(n) {\n  if (n < 2) return n;\n  return fib(n-1) + fib(n-2);\n}\n`.repeat(50);

describe("MiniCode tokenize", () => {
  bench("JS (50x)", () => { tokenize(js, "javascript"); });
  bench("Python", () => { tokenize("def f(x):\n    return x*x\n" .repeat(50), "python"); });
  bench("Rust", () => { tokenize("fn main() { println!(\"hi\"); }\n".repeat(50), "rust"); });
});
