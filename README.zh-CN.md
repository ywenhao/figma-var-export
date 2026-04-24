# figma-var-export

根据 Figma 的一个或多个 mode token JSON 文件生成 CSS 变量。

## 功能

- 生成单个 `vars.css` 文件
- 支持一个主模式和多个其他主题模式
- 默认优先选择 `Light` 作为主模式，没有 `Light` 时选择 `Main`，再没有时使用第一个模式
- 支持本地绝对路径输入
- 支持本地相对路径输入
- 支持 `http` 和 `https` 远程 token JSON
- 支持绝对路径和相对路径输出目录
- 不传 `--out-dir` 时默认输出到当前执行目录

## 安装

```bash
pnpm add figma-var-export
```

## 命令行

```bash
figma-var-export --light-file ./Light.tokens.json --dark-file ./Dark.tokens.json
figma-var-export --mode Light=./Light.tokens.json --mode Dark=./Dark.tokens.json --mode Compact=./Compact.tokens.json
figma-var-export --light-file https://example.com/light.json --dark-file https://example.com/dark.json --out-dir ./generated
```

### 参数

- `--light-file`: light token 文件路径或 URL
- `--dark-file`: dark token 文件路径或 URL
- `--mode`: mode 名称和 token 文件路径或 URL，格式为 `<name>=<file-or-url>`，可重复传入
- `--primary-mode`: 显式指定主模式，默认依次尝试 `Light`、`Main`、第一个模式
- `--out-dir`: 输出目录路径，默认当前执行目录

命令执行后会在输出目录中生成 `vars.css`。旧的 `--light-file` / `--dark-file` 参数仍然可用。

## 输出示例

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

## 库调用

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
