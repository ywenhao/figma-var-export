export interface TokenColorValue {
  alpha?: number
  colorSpace: string
  components: number[]
  hex: string
}

export type TokenPrimitiveValue = string | TokenColorValue

export interface TokenLeaf {
  $type: string
  $value: TokenPrimitiveValue
}

export interface TokenTree {
  [key: string]: TokenTree | TokenLeaf | unknown
}

export interface GenerateThemeCssOptions {
  endOfLine?: '\n' | '\r\n'
}

export interface LoadTokenSourceOptions {
  cwd?: string
  fetchImpl?: typeof fetch
}

export type ExportThemeCssOptions = GenerateThemeCssOptions & LoadTokenSourceOptions & {
  darkFile: string
  lightFile: string
  outDir?: string
  outFileName?: string
}

export interface ExportThemeCssResult {
  css: string
  outDir: string
  outFile: string
}
