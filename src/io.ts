import type {
  ExportThemeCssOptions,
  ExportThemeCssResult,
  LoadTokenSourceOptions,
  TokenTree,
} from './types'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { DEFAULT_OUT_FILE_NAME } from './constants'
import { generateThemeCss } from './generate'

/**
 * 读取单个 token 来源
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
 * 读取 light 和 dark token 后生成 CSS 文件
 */
export async function exportThemeCss(options: ExportThemeCssOptions): Promise<ExportThemeCssResult> {
  const cwd = options.cwd ?? process.cwd()
  const outDir = path.resolve(cwd, options.outDir ?? '.')
  const outFileName = options.outFileName ?? DEFAULT_OUT_FILE_NAME

  const [lightTokens, darkTokens] = await Promise.all([
    loadTokenSource(options.lightFile, options),
    loadTokenSource(options.darkFile, options),
  ])

  const css = generateThemeCss(lightTokens, darkTokens, {
    endOfLine: options.endOfLine,
  })

  await mkdir(outDir, { recursive: true })

  const outFile = path.join(outDir, outFileName)
  await writeFile(outFile, `${css}${options.endOfLine ?? '\n'}`, 'utf8')

  return {
    css,
    outDir,
    outFile,
  }
}

/**
 * 解析 token 来源是本地文件还是远程地址
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
 * 按来源读取原始内容
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
