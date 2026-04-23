import type {
  GenerateThemeCssOptions,
  TokenColorValue,
  TokenLeaf,
  TokenPrimitiveValue,
  TokenTree,
} from './types'

type TokenMap = Map<string, TokenPrimitiveValue>

/**
 * 生成 light 和 dark 对应的 CSS 变量内容
 */
export function generateThemeCss(
  lightTokens: TokenTree,
  darkTokens: TokenTree,
  options: GenerateThemeCssOptions = {},
): string {
  const endOfLine = options.endOfLine ?? '\n'
  const lightFlat = flattenTokens(lightTokens)
  const darkFlat = flattenTokens(darkTokens)
  const lightKeys = Array.from(lightFlat.keys())
  const darkOverrideKeys = Array.from(darkFlat.keys()).filter((key) => {
    const lightValue = lightFlat.get(key)
    const darkValue = darkFlat.get(key)
    return formatTokenValue(lightValue) !== formatTokenValue(darkValue)
  })

  const lines: string[] = []

  lines.push(':root {')
  for (const key of lightKeys) {
    lines.push(`  --${normalizeTokenName(key)}: ${formatTokenValue(lightFlat.get(key))};`)
  }
  lines.push('}')

  if (darkOverrideKeys.length > 0) {
    lines.push('')
    lines.push('.dark {')
    for (const key of darkOverrideKeys) {
      lines.push(`  --${normalizeTokenName(key)}: ${formatTokenValue(darkFlat.get(key))};`)
    }
    lines.push('}')
  }

  return lines.join(endOfLine)
}

/**
 * 平铺 token 树
 */
function flattenTokens(
  node: TokenTree | TokenPrimitiveValue | TokenLeaf | undefined,
  pathSegments: string[] = [],
  result: TokenMap = new Map(),
): TokenMap {
  if (!node || typeof node !== 'object') {
    return result
  }

  if (isTokenLeaf(node)) {
    result.set(pathSegments.join('-'), node.$value)
    return result
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === '$extensions') {
      continue
    }

    flattenTokens(value as TokenTree | TokenPrimitiveValue | TokenLeaf, [...pathSegments, key], result)
  }

  return result
}

/**
 * 判断当前节点是不是 token 叶子
 */
function isTokenLeaf(value: unknown): value is TokenLeaf {
  if (!value || typeof value !== 'object') {
    return false
  }

  return '$type' in value && '$value' in value
}

/**
 * 统一 token 名称格式
 */
function normalizeTokenName(name: string): string {
  return name
    .replace(/\s+/g, '-')
    .replace(/\./g, '-')
}

/**
 * 格式化 token 值
 */
function formatTokenValue(value: TokenPrimitiveValue | undefined): string {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    const referenceMatch = trimmedValue.match(/^\{(.+)\}$/)

    if (referenceMatch) {
      return `var(--${normalizeTokenName(referenceMatch[1])})`
    }

    return trimmedValue
  }

  if (!value) {
    return ''
  }

  return formatColorValue(value)
}

/**
 * 格式化颜色值
 */
function formatColorValue(value: TokenColorValue): string {
  const alpha = value.alpha ?? 1

  if (Math.abs(alpha - 1) < 0.000001) {
    return value.hex.toLowerCase()
  }

  const [red, green, blue] = value.components.map(component => Math.round(component * 255))
  return `rgb(${red} ${green} ${blue} / ${formatAlpha(alpha)})`
}

/**
 * 格式化透明度
 */
function formatAlpha(alpha: number): string {
  const percentage = Math.round(alpha * 1000) / 10
  const value = Number.isInteger(percentage) ? percentage.toFixed(0) : String(percentage)
  return `${value}%`
}
