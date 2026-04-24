import type {
  GenerateThemeCssOptions,
  TokenColorValue,
  TokenLeaf,
  TokenPrimitiveValue,
  TokenTree,
} from './types'

type TokenMap = Map<string, TokenPrimitiveValue>

/**
 * Generate CSS variable output for the light and dark themes.
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
 * Flatten the token tree.
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
    if (isTokenMetadataKey(key)) {
      continue
    }

    flattenTokens(value as TokenTree | TokenPrimitiveValue | TokenLeaf, [...pathSegments, key], result)
  }

  return result
}

/**
 * Check whether the current node is a token leaf.
 */
function isTokenLeaf(value: unknown): value is TokenLeaf {
  if (!value || typeof value !== 'object') {
    return false
  }

  return '$type' in value && '$value' in value
}

/**
 * Check whether the current key is token metadata.
 */
function isTokenMetadataKey(key: string): boolean {
  return key.startsWith('$')
}

/**
 * Normalize the token name format.
 */
function normalizeTokenName(name: string): string {
  return name
    .replace(/\s+/g, '-')
    .replace(/\./g, '-')
}

/**
 * Format a token value.
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
 * Format a color value.
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
 * Format an alpha value.
 */
function formatAlpha(alpha: number): string {
  const percentage = Math.round(alpha * 1000) / 10
  const value = Number.isInteger(percentage) ? percentage.toFixed(0) : String(percentage)
  return `${value}%`
}
