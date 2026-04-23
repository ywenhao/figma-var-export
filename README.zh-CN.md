# figma-var-export

根据 Figma 的 light 和 dark token JSON 文件生成 CSS 变量。

## 功能

- 生成单个 `vars.css` 文件
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
figma-var-export --light-file https://example.com/light.json --dark-file https://example.com/dark.json --out-dir ./generated
```

### 参数

- `--light-file`: light token 文件路径或 URL
- `--dark-file`: dark token 文件路径或 URL
- `--out-dir`: 输出目录路径，默认当前执行目录

命令执行后会在输出目录中生成 `vars.css`。

## 输出示例

```css
:root {
  --Base-Gray-0: #f9fafb;
}

.dark {
  --Base-Gray-0: #101012;
}
```

## 库调用

```ts
import { exportThemeCss, generateThemeCss, loadTokenSource } from 'figma-var-export'

const lightTokens = await loadTokenSource('./Light.tokens.json')
const darkTokens = await loadTokenSource('./Dark.tokens.json')
const css = generateThemeCss(lightTokens, darkTokens)

await exportThemeCss({
  lightFile: './Light.tokens.json',
  darkFile: './Dark.tokens.json',
  outDir: './generated',
})
```
