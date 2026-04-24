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

export interface ResolvePrimaryThemeModeOptions {
  preferredPrimaryModeNames?: string[]
  primaryModeName?: string
}

export interface GenerateThemeModesCssOptions extends GenerateThemeCssOptions, ResolvePrimaryThemeModeOptions {}

export interface LoadTokenSourceOptions {
  cwd?: string
  fetchImpl?: typeof fetch
}

export interface ThemeMode {
  name: string
  tokens: TokenTree
}

export interface ThemeModeSource {
  name: string
  source: string
}

export type ExportThemeCssOptions = GenerateThemeCssOptions & LoadTokenSourceOptions & {
  darkFile: string
  lightFile: string
  outDir?: string
  outFileName?: string
}

export type ExportThemeModesCssOptions = GenerateThemeModesCssOptions & LoadTokenSourceOptions & {
  modes: ThemeModeSource[]
  outDir?: string
  outFileName?: string
}

export interface ExportThemeCssResult {
  css: string
  modeNames: string[]
  outDir: string
  outFile: string
  primaryModeName: string
}
