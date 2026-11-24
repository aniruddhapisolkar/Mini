// MiniCode — Tokenizer (regex-based, Prism-style) with multi-language grammars

import type { CodeToken, LanguageGrammar, TokenScope } from "./types.js";

function makeGrammar(id: string, rules: Array<[TokenScope, RegExp]>, aliases?: string[]): LanguageGrammar {
  const g: LanguageGrammar = { id, rules: rules.map(([scope, pattern]) => ({ scope, pattern })) };
  if (aliases) g.aliases = aliases;
  return g;
}

// Common rule sets
const C_STYLE_COMMENTS: [TokenScope, RegExp][] = [
  ["comment", /\/\/[^\n]*/],
  ["comment", /\/\*[\s\S]*?\*\//],
];
const HASH_COMMENTS: [TokenScope, RegExp][] = [
  ["comment", /#[^\n]*/],
];
const STRINGS_DOUBLE: [TokenScope, RegExp][] = [
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ["string", /`(?:\\.|[^`\\])*`/],
];
const NUMBERS: [TokenScope, RegExp][] = [
  ["number", /\b0[xX][0-9a-fA-F]+\b/],
  ["number", /\b0[bB][01]+\b/],
  ["number", /\b0[oO][0-7]+\b/],
  ["number", /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
];

function keywords(kws: string[]): [TokenScope, RegExp][] {
  return [["keyword", new RegExp(`\\b(?:${kws.join("|")})\\b`)]];
}
function builtins(names: string[]): [TokenScope, RegExp][] {
  return [["function", new RegExp(`\\b(?:${names.join("|")})\\b`)]];
}

const JS_KEYWORDS = ["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","class","extends","implements","import","export","from","default","new","this","super","true","false","null","undefined","void","typeof","instanceof","in","of","try","catch","finally","throw","async","await","yield","static","get","set","public","private","protected","readonly","interface","type","enum","namespace","abstract","as","is","keyof","infer","never","unknown","any","number","string","boolean","symbol","bigint","object","declare","module","require","export"];
const JS_OPERATORS = /[+\-*/%=<>!&|^~?:]+/;

const grammars: Record<string, LanguageGrammar> = {};

function reg(g: LanguageGrammar) {
  grammars[g.id] = g;
  for (const a of g.aliases || []) grammars[a] = g;
}

// JavaScript / TypeScript
reg(makeGrammar("javascript", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ["regexp", /\/(?:\\.|[^\/\\\n])+(?:\/[gimsuy]*)/],
  ...NUMBERS,
  ["keyword", /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|true|false|null|undefined|void|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|static|get|set|import|export|from|default|as)\b/],
  ["function", /\b[a-zA-Z_$][\w$]*(?=\s*\()/],
  ["operator", JS_OPERATORS],
  ["punctuation", /[{}()\[\];,.]/],
], ["js", "jsx"]));

reg(makeGrammar("typescript", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ["regexp", /\/(?:\\.|[^\/\\\n])+(?:\/[gimsuy]*)/],
  ...NUMBERS,
  ["keyword", /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|implements|import|export|from|default|new|this|super|true|false|null|undefined|void|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|static|get|set|public|private|protected|readonly|interface|type|enum|namespace|abstract|as|is|keyof|infer|never|unknown|any|number|string|boolean|symbol|bigint|object|declare|module)\b/],
  ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
  ["function", /\b[a-zA-Z_$][\w$]*(?=\s*\()/],
  ["operator", JS_OPERATORS],
  ["punctuation", /[{}()\[\];,.:<>]/],
], ["ts", "tsx"]));

// Python
reg(makeGrammar("python", [
  ...HASH_COMMENTS,
  ["string", /"""[\s\S]*?"""/],
  ["string", /'''[\s\S]*?'''/],
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|yield|lambda|True|False|None|and|or|not|in|is|pass|break|continue|global|nonlocal|assert|del)\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~]+/],
  ["punctuation", /[{}()\[\];,.:]/],
], ["py"]));

// Java
reg(makeGrammar("java", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:public|private|protected|static|final|class|interface|extends|implements|import|package|return|if|else|for|while|do|switch|case|break|continue|new|this|super|true|false|null|void|int|long|double|float|boolean|char|byte|short|try|catch|finally|throw|throws|abstract|synchronized|volatile|transient|native|strictfp|enum|record|sealed|permits|var|instanceof|assert)\b/],
  ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~?:]+/],
  ["punctuation", /[{}()\[\];,.]/],
], []));

// C / C++
reg(makeGrammar("c", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|inline|restrict)\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~?:]+/],
  ["punctuation", /[{}()\[\];,.]/],
], []));
reg(makeGrammar("cpp", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|inline|namespace|class|public|private|protected|template|typename|virtual|override|final|new|delete|this|true|false|nullptr|constexpr|noexcept|using|std|bool|string)\b/],
  ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~?:]+/],
  ["punctuation", /[{}()\[\];,.<>]/],
], ["c++", "cc", "cxx"]));

// Rust
reg(makeGrammar("rust", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:fn|let|mut|const|static|struct|enum|trait|impl|pub|mod|use|crate|super|self|match|if|else|for|while|loop|break|continue|return|true|false|Some|None|Ok|Err|as|in|ref|move|async|await|unsafe|extern|trait|where|dyn|type|trait)\b/],
  ["macro", /\b[a-zA-Z_][\w]*!/],
  ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~?:]+/],
  ["punctuation", /[{}()\[\];,.]/],
], ["rs"]));

// Go
reg(makeGrammar("go", [
  ...C_STYLE_COMMENTS,
  ...STRINGS_DOUBLE,
  ["string", /`[^`]*`/],
  ...NUMBERS,
  ["keyword", /\b(?:func|package|import|var|const|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|default|break|continue|fallthrough|select|true|false|nil|iota)\b/],
  ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /:=|[+\-*/%=<>!&|^~]+/],
  ["punctuation", /[{}()\[\];,.]/],
], ["golang"]));

// Ruby
reg(makeGrammar("ruby", [
  ...HASH_COMMENTS,
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ...NUMBERS,
  ["keyword", /\b(?:def|class|module|end|if|elsif|else|unless|case|when|while|until|for|do|begin|rescue|ensure|raise|return|yield|break|next|redo|retry|in|then|and|or|not|true|false|nil|self|super|require|include|attr_accessor|attr_reader|attr_writer|private|protected|public)\b/],
  ["symbol", /:[a-zA-Z_][\w]*/],
  ["function", /\b[a-zA-Z_][\w]*(?=[?!]?\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~]+/],
  ["punctuation", /[{}()\[\];,.]/],
], ["rb"]));

// PHP
reg(makeGrammar("php", [
  ...HASH_COMMENTS,
  ["comment", /\/\/[^\n]*/],
  ["comment", /\/\*[\s\S]*?\*\//],
  ...STRINGS_DOUBLE,
  ...NUMBERS,
  ["keyword", /\b(?:function|class|interface|trait|extends|implements|public|private|protected|static|final|abstract|return|if|elseif|else|for|foreach|while|do|switch|case|break|continue|new|this|self|parent|true|false|null|echo|print|require|include|use|namespace|try|catch|finally|throw|const|var|global|isset|unset|empty|array|list)\b/],
  ["variable", /\$[a-zA-Z_][\w]*/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!&|^~?:.]+/],
  ["punctuation", /[{}()\[\];,.]/],
], []));

// SQL
reg(makeGrammar("sql", [
  ["comment", /--[^\n]*/],
  ["comment", /\/\*[\s\S]*?\*\//],
  ...STRINGS_SINGLE_QUOTE(),
  ...NUMBERS,
  ["keyword", /\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|COLUMN|INDEX|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|AS|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|CHECK|UNIQUE|AUTO_INCREMENT|CASCADE|WITH|RECURSIVE|OVER|PARTITION|WINDOW|ROW_NUMBER|RANK|DENSE_RANK|COUNT|SUM|AVG|MIN|MAX)\b/i],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[+\-*/%=<>!]+/],
  ["punctuation", /[{}()\[\];,.]/],
], []));

function STRINGS_SINGLE_QUOTE(): [TokenScope, RegExp][] {
  return [["string", /'(?:\\.|[^'\\])*'/]];
}

// JSON
reg(makeGrammar("json", [
  ["string", /"(?:\\.|[^"\\])*"/],
  ...NUMBERS,
  ["keyword", /\b(?:true|false|null)\b/],
  ["punctuation", /[{}()\[\]:,]/],
], []));

// YAML
reg(makeGrammar("yaml", [
  ...HASH_COMMENTS,
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ...NUMBERS,
  ["keyword", /\b(?:true|false|null|yes|no|on|off)\b/i],
  ["key", /^[ \t]*[a-zA-Z_][\w-]*(?=\s*:)/m],
  ["punctuation", /[:\-]/],
], ["yml"]));

// TOML
reg(makeGrammar("toml", [
  ...HASH_COMMENTS,
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ...NUMBERS,
  ["keyword", /\b(?:true|false)\b/],
  ["section", /^\[[^\]]*\]/m],
  ["key", /^[a-zA-Z_][\w-]*(?=\s*=)/m],
  ["punctuation", /[=]/],
], []));

// XML / HTML
reg(makeGrammar("xml", [
  ["comment", /<!--[\s\S]*?-->/],
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ["tag", /<\/?[a-zA-Z][a-zA-Z0-9\-]*/],
  ["attribute", /\b[a-zA-Z_:][\w:.-]*(?=\s*=)/],
  ["punctuation", /[<>/=]/],
], ["html"]));

// CSS
reg(makeGrammar("css", [
  ["comment", /\/\*[\s\S]*?\*\//],
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ...NUMBERS,
  ["function", /\b[a-zA-Z-]+(?=\()/],
  ["property", /\b[a-zA-Z-]+(?=\s*:)/],
  ["selector", /[.#][a-zA-Z_][\w-]*/],
  ["keyword", /@(?:media|import|keyframes|font-face|supports|charset|namespace|page|viewport)\b/],
  ["punctuation", /[{}():;,]/],
], []));

// Shell
reg(makeGrammar("shell", [
  ...HASH_COMMENTS,
  ["string", /"(?:\\.|[^"\\])*"/],
  ["string", /'(?:\\.|[^'\\])*'/],
  ...NUMBERS,
  ["keyword", /\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|export|local|readonly|declare|unset|shift|source|alias|unalias|trap|exit|break|continue|select|until)\b/],
  ["variable", /\$[a-zA-Z_][\w]*|\$\{[^}]*\}/],
  ["function", /\b[a-zA-Z_][\w]*(?=\s*\()/],
  ["operator", /[|&;<>]+/],
  ["punctuation", /[{}()\[\];]/],
], ["bash", "sh", "zsh"]));

// Markdown (delegates-ish)
reg(makeGrammar("markdown", [
  ["comment", /^#{1,6}\s.*$/m],
  ["string", /`[^`]*`/],
  ["keyword", /\*\*[^*]+\*\*/],
  ["punctuation", /[*_~`#]/],
], ["md"]));

// Dockerfile
reg(makeGrammar("dockerfile", [
  ...HASH_COMMENTS,
  ["keyword", /^(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/m],
  ["string", /"(?:\\.|[^"\\])*"/],
  ["variable", /\$\{?[a-zA-Z_][\w]*\}?/],
], ["docker"]));

// Default fallback
reg(makeGrammar("text", [], ["plain", "txt"]));

export function getGrammar(language: string): LanguageGrammar {
  const key = language.toLowerCase();
  return grammars[key] ?? grammars["text"]!;
}

export function listLanguages(): string[] {
  return Object.keys(grammars);
}

export function tokenize(source: string, language: string): CodeToken[] {
  const grammar = getGrammar(language);
  const tokens: CodeToken[] = [];
  const lines = source.split("\n");
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx] ?? "";
    let col = 0;
    // scan the line
    let i = 0;
    const n = line.length;
    // build combined regex
    const parts = grammar.rules.map((r, idx) => `(?<g${idx}>${r.pattern.source})`);
    // handle flags: use 'g' + (pattern has m? include m). We'll apply per-line; patterns with ^ need m but we handle line start manually. Simpler: prepend handling.
    const combined = parts.length ? new RegExp(parts.join("|"), "g") : null;
    if (!combined) {
      if (line.length > 0) tokens.push({ text: line, scope: "plain", line: lineIdx, column: 0 });
      // newline
      if (lineIdx < lines.length - 1) tokens.push({ text: "\n", scope: "plain", line: lineIdx, column: line.length });
      continue;
    }
    // Reset lastIndex
    combined.lastIndex = 0;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = combined.exec(line)) !== null) {
      if (m.index > last) {
        tokens.push({ text: line.slice(last, m.index), scope: "plain", line: lineIdx, column: last });
      }
      // determine which group matched
      let scope: TokenScope = "plain";
      for (let idx = 0; idx < grammar.rules.length; idx++) {
        const rule = grammar.rules[idx];
        if (rule && m.groups && m.groups[`g${idx}`] !== undefined) {
          scope = rule.scope;
          break;
        }
      }
      const matched = m[0];
      tokens.push({ text: matched, scope, line: lineIdx, column: m.index });
      last = m.index + matched.length;
      if (matched.length === 0) { combined.lastIndex++; last = combined.lastIndex; }
    }
    if (last < n) {
      tokens.push({ text: line.slice(last), scope: "plain", line: lineIdx, column: last });
    }
    if (lineIdx < lines.length - 1) {
      tokens.push({ text: "\n", scope: "plain", line: lineIdx, column: n });
    }
  }
  return tokens;
}
