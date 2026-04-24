import type {
  GenerateThemeCssOptions,
  GenerateThemeModesCssOptions,
  ResolvePrimaryThemeModeOptions,
  ThemeMode,
  TokenColorValue,
  TokenLeaf,
  TokenPrimitiveValue,
  TokenTree,
} from './types'

type TokenMap = Map<string, TokenPrimitiveValue>
const DEFAULT_PRIMARY_MODE_NAMES = ['Light', 'Main']

/**
 * Generate CSS variable output for the light and dark themes.
 */
export function generateThemeCss(
  lightTokens: TokenTree,
  darkTokens: TokenTree,
  options: GenerateThemeCssOptions = {},
): string {
  return generateThemeModesCss(
    [
      { name: 'Light', tokens: lightTokens },
      { name: 'Dark', tokens: darkTokens },
    ],
    {
      endOfLine: options.endOfLine,
      primaryModeName: 'Light',
    },
  )
}

/**
 * Generate CSS variable output for multiple theme modes.
 */
export function generateThemeModesCss(
  modes: ThemeMode[],
  options: GenerateThemeModesCssOptions = {},
): string {
  const endOfLine = options.endOfLine ?? '\n'
  const primaryModeName = resolvePrimaryThemeModeName(
    modes.map(mode => mode.name),
    options,
  )
  const primaryMode = findModeByName(modes, primaryModeName)
  const primaryFlat = flattenTokens(primaryMode.tokens)
  const primaryKeys = Array.from(primaryFlat.keys())
  const lines: string[] = []

  lines.push(':root {')
  for (const key of primaryKeys) {
    lines.push(`  --${normalizeTokenName(key)}: ${formatTokenValue(primaryFlat.get(key))};`)
  }
  lines.push('}')

  for (const mode of modes) {
    if (isSameModeName(mode.name, primaryModeName)) {
      continue
    }

    const modeFlat = flattenTokens(mode.tokens)
    const overrideKeys = Array.from(modeFlat.keys()).filter((key) => {
      const primaryValue = primaryFlat.get(key)
      const modeValue = modeFlat.get(key)
      return formatTokenValue(primaryValue) !== formatTokenValue(modeValue)
    })

    if (overrideKeys.length === 0) {
      continue
    }

    lines.push('')
    lines.push(`${toModeSelector(mode.name)} {`)
    for (const key of overrideKeys) {
      lines.push(`  --${normalizeTokenName(key)}: ${formatTokenValue(modeFlat.get(key))};`)
    }
    lines.push('}')
  }

  return lines.join(endOfLine)
}

/**
 * Resolve which mode should be used as the primary theme.
 */
export function resolvePrimaryThemeModeName(
  modeNames: string[],
  options: ResolvePrimaryThemeModeOptions = {},
): string {
  if (modeNames.length === 0) {
    throw new Error('At least one theme mode is required.')
  }

  if (options.primaryModeName) {
    const explicitMode = modeNames.find(modeName => isSameModeName(modeName, options.primaryModeName!))

    if (!explicitMode) {
      throw new Error(
        `Primary mode "${options.primaryModeName}" was not found. Available modes: ${modeNames.join(', ')}`,
      )
    }

    return explicitMode
  }

  const preferredNames = options.preferredPrimaryModeNames ?? DEFAULT_PRIMARY_MODE_NAMES

  for (const preferredName of preferredNames) {
    const preferredMode = modeNames.find(modeName => isSameModeName(modeName, preferredName))

    if (preferredMode) {
      return preferredMode
    }
  }

  return modeNames[0]
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
 * Find a mode by name.
 */
function findModeByName(modes: ThemeMode[], modeName: string): ThemeMode {
  const mode = modes.find(item => isSameModeName(item.name, modeName))

  if (!mode) {
    throw new Error(`Theme mode "${modeName}" was not found.`)
  }

  return mode
}

/**
 * Check whether two mode names are equal.
 */
function isSameModeName(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: 'accent' }) === 0
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
 * Convert a mode name to a CSS selector.
 */
function toModeSelector(modeName: string): string {
  const normalizedModeName = modeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const className = normalizedModeName.length === 0
    ? 'theme-mode'
    : /^\d/.test(normalizedModeName)
      ? `theme-${normalizedModeName}`
      : normalizedModeName

  return `.${className}`
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
