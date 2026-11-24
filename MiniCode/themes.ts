// MiniCode — Themes

import type { Theme } from "./types.js";

export const themes: Record<string, Theme> = {
  "github-light": {
    id: "github-light",
    name: "GitHub Light",
    type: "light",
    background: "#ffffff",
    foreground: "#24292f",
    colors: {
      comment: "#6e7781",
      string: "#0a3069",
      keyword: "#cf222e",
      number: "#0550ae",
      operator: "#cf222e",
      punctuation: "#24292f",
      function: "#8250df",
      class: "#953800",
      variable: "#24292f",
      property: "#0550ae",
      type: "#953800",
      constant: "#0550ae",
      tag: "#116329",
      attribute: "#0550ae",
      regexp: "#0a3069",
      escape: "#0550ae",
      meta: "#6e7781",
      plain: "#24292f",
    },
  },
  "one-dark": {
    id: "one-dark",
    name: "One Dark",
    type: "dark",
    background: "#282c34",
    foreground: "#abb2bf",
    colors: {
      comment: "#5c6370",
      string: "#98c379",
      keyword: "#c678dd",
      number: "#d19a66",
      operator: "#56b6c2",
      punctuation: "#abb2bf",
      function: "#61afef",
      class: "#e5c07b",
      variable: "#e06c75",
      property: "#e06c75",
      type: "#e5c07b",
      constant: "#d19a66",
      tag: "#e06c75",
      attribute: "#d19a66",
      regexp: "#98c379",
      escape: "#56b6c2",
      meta: "#5c6370",
      plain: "#abb2bf",
    },
  },
  "dracula": {
    id: "dracula",
    name: "Dracula",
    type: "dark",
    background: "#282a36",
    foreground: "#f8f8f2",
    colors: {
      comment: "#6272a4",
      string: "#f1fa8c",
      keyword: "#ff79c6",
      number: "#bd93f9",
      operator: "#ff79c6",
      punctuation: "#f8f8f2",
      function: "#50fa7b",
      class: "#8be9fd",
      variable: "#f8f8f2",
      property: "#66d9ef",
      type: "#8be9fd",
      constant: "#bd93f9",
      tag: "#ff79c6",
      attribute: "#50fa7b",
      regexp: "#f1fa8c",
      escape: "#ff79c6",
      meta: "#6272a4",
      plain: "#f8f8f2",
    },
  },
};

export function getTheme(id: string): Theme {
  return themes[id] ?? themes["github-light"]!;
}

export function themeToCss(theme: Theme, selector = ".mini-code"): string {
  const vars = Object.entries(theme.colors)
    .map(([k, v]) => `  --mini-code-${k}: ${v};`)
    .join("\n");
  return `${selector} {\n  --mini-code-bg: ${theme.background};\n  --mini-code-fg: ${theme.foreground};\n${vars}\n}`;
}
