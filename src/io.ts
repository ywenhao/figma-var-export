import type {
  ExportThemeCssOptions,
  ExportThemeCssResult,
  ExportThemeModesCssOptions,
  LoadTokenSourceOptions,
  ThemeMode,
  ThemeModeSource,
  TokenTree,
} from './types'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { DEFAULT_OUT_FILE_NAME } from './constants'
import { generateThemeModesCss, resolvePrimaryThemeModeName } from './generate'

/**
 * Load a single token source.
 */
export async function loadTokenSource(
  source: string,
  options: LoadTokenSourceOptions = {},
): Promise<TokenTree> {
  const resolvedSource = resolveTokenSource(source, options.cwd)
  const rawContent = await readSourceContent(resolvedSource, options.fetchImpl)

  try {
    return JSON.parse(rawContent) as TokenTree
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse token file ${source}: ${message}`)
  }
}

/**
 * Load multiple named token sources.
 */
export async function loadThemeModeSources(
  modes: ThemeModeSource[],
  options: LoadTokenSourceOptions = {},
): Promise<ThemeMode[]> {
  if (modes.length === 0) {
    throw new Error('At least one theme mode source is required.')
  }

  return Promise.all(modes.map(async mode => ({
    name: mode.name,
    tokens: await loadTokenSource(mode.source, options),
  })))
}

/**
 * Generate a CSS file from multiple theme mode token sources.
 */
export async function exportThemeModesCss(
  options: ExportThemeModesCssOptions,
): Promise<ExportThemeCssResult> {
  const cwd = options.cwd ?? process.cwd()
  const outDir = path.resolve(cwd, options.outDir ?? '.')
  const outFileName = options.outFileName ?? DEFAULT_OUT_FILE_NAME
  const modes = await loadThemeModeSources(options.modes, options)
  const modeNames = modes.map(mode => mode.name)
  const primaryModeName = resolvePrimaryThemeModeName(modeNames, {
    preferredPrimaryModeNames: options.preferredPrimaryModeNames,
    primaryModeName: options.primaryModeName,
  })
  const css = generateThemeModesCss(modes, {
    endOfLine: options.endOfLine,
    preferredPrimaryModeNames: options.preferredPrimaryModeNames,
    primaryModeName,
  })

  await mkdir(outDir, { recursive: true })

  const outFile = path.join(outDir, outFileName)
  await writeFile(outFile, `${css}${options.endOfLine ?? '\n'}`, 'utf8')

  return {
    css,
    modeNames,
    outDir,
    outFile,
    primaryModeName,
  }
}

/**
 * Generate a CSS file from the light and dark token sources.
 */
export async function exportThemeCss(options: ExportThemeCssOptions): Promise<ExportThemeCssResult> {
  return exportThemeModesCss({
    cwd: options.cwd,
    endOfLine: options.endOfLine,
    fetchImpl: options.fetchImpl,
    modes: [
      { name: 'Light', source: options.lightFile },
      { name: 'Dark', source: options.darkFile },
    ],
    outDir: options.outDir,
    outFileName: options.outFileName,
    primaryModeName: 'Light',
  })
}

/**
 * Resolve whether a token source is a local file or a remote URL.
 */
function resolveTokenSource(
  source: string,
  cwd: string = process.cwd(),
): { type: 'file', value: string } | { type: 'url', value: string } {
  if (path.isAbsolute(source)) {
    return {
      type: 'file' as const,
      value: source,
    }
  }

  try {
    const parsedUrl = new URL(source)

    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return {
        type: 'url' as const,
        value: parsedUrl.toString(),
      }
    }

    if (parsedUrl.protocol === 'file:') {
      return {
        type: 'file' as const,
        value: fileURLToPath(parsedUrl),
      }
    }
  }
  catch {
    return {
      type: 'file' as const,
      value: path.resolve(cwd, source),
    }
  }

  return {
    type: 'file' as const,
    value: path.resolve(cwd, source),
  }
}

/**
 * Read the raw content based on the source type.
 */
async function readSourceContent(
  source: { type: 'file', value: string } | { type: 'url', value: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (source.type === 'file') {
    return readFile(source.value, 'utf8')
  }

  const response = await fetchImpl(source.value)

  if (!response.ok) {
    throw new Error(`Request to ${source.value} failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}
