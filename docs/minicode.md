# MiniCode

Source code rendering module for Mini.

## Features

- Regex-based syntax highlighting (30+ languages)
- 3 built-in themes (GitHub Light, One Dark, Dracula) + CSS variables
- Line numbers, line highlighting, diff markers
- Tree-shakeable language grammars

## API

```ts
import { tokenize, getTheme } from "mini/code";

const tokens = tokenize(source, "typescript");
const theme = getTheme("one-dark");
```
