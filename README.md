# figma-var-export

[简体中文](./README.zh-CN.md)

Generate CSS variables from Figma token JSON files across one or more modes.

## Features

- Generate a single `vars.css` file
- Support one primary mode plus any number of additional theme modes
- Pick `Light` as the primary mode when present, otherwise `Main`, otherwise the first mode
- Support local files with absolute paths
- Support local files with relative paths
- Support remote token JSON files over `http` and `https`
- Write output to an absolute or relative directory
- Use the current working directory when `--out-dir` is not provided

## Install

```bash
pnpm add figma-var-export
```

## CLI

```bash
figma-var-export --light-file ./Light.tokens.json --dark-file ./Dark.tokens.json
figma-var-export --mode Light=./Light.tokens.json --mode Dark=./Dark.tokens.json --mode Compact=./Compact.tokens.json
figma-var-export --light-file https://example.com/light.json --dark-file https://example.com/dark.json --out-dir ./generated
```

### Options

- `--light-file`: Light token file path or URL
- `--dark-file`: Dark token file path or URL
- `--mode`: Theme mode name and token file path or URL in the format `<name>=<file-or-url>`. Repeat this option for multiple modes.
- `--primary-mode`: Explicit primary mode name. Defaults to `Light`, then `Main`, then the first mode.
- `--out-dir`: Output directory path, defaults to the current working directory

The CLI writes `vars.css` to the output directory. The legacy `--light-file` and `--dark-file` options are still supported.

## Output Example

```css
:root {
  --Base-Gray-0: #f9fafb;
}

.dark {
  --Base-Gray-0: #101012;
}

.compact {
  --Base-Gray-0: #d4d4d8;
}
```

## Library Usage

```ts
import {
  exportThemeCss,
  exportThemeModesCss,
  generateThemeCss,
  generateThemeModesCss,
  loadTokenSource,
} from 'figma-var-export'

const lightTokens = await loadTokenSource('./Light.tokens.json')
const darkTokens = await loadTokenSource('./Dark.tokens.json')
const css = generateThemeCss(lightTokens, darkTokens)

await exportThemeCss({
  lightFile: './Light.tokens.json',
  darkFile: './Dark.tokens.json',
  outDir: './generated',
})

const compactTokens = await loadTokenSource('./Compact.tokens.json')
const multiModeCss = generateThemeModesCss([
  { name: 'Light', tokens: lightTokens },
  { name: 'Dark', tokens: darkTokens },
  { name: 'Compact', tokens: compactTokens },
])

await exportThemeModesCss({
  modes: [
    { name: 'Light', source: './Light.tokens.json' },
    { name: 'Dark', source: './Dark.tokens.json' },
    { name: 'Compact', source: './Compact.tokens.json' },
  ],
  outDir: './generated',
})
```
