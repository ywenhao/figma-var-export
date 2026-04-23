#!/usr/bin/env node

import { createRequire } from 'node:module'
import process from 'node:process'
import { cac } from 'cac'
import { DEFAULT_OUT_FILE_NAME, exportThemeCss } from '.'

interface CliOptions {
  darkFile?: string
  lightFile?: string
  outDir?: string
}

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

const cli = cac('figma-var-export')

cli
  .option('--light-file <source>', 'Light token 文件路径或网络地址')
  .option('--dark-file <source>', 'Dark token 文件路径或网络地址')
  .option('--out-dir <dir>', '输出目录，默认当前执行目录')
  .example('figma-var-export --light-file ./Light.tokens.json --dark-file ./Dark.tokens.json')
  .example('figma-var-export --light-file https://example.com/light.json --dark-file https://example.com/dark.json --out-dir ./generated')
  .help()
  .version(packageJson.version)

void main()

/**
 * 解析命令行参数并执行导出
 */
async function main(): Promise<void> {
  const parsed = cli.parse()
  const options = parsed.options as CliOptions

  if (!options.lightFile || !options.darkFile) {
    console.error('请提供 --light-file 和 --dark-file 参数')
    cli.outputHelp()
    process.exitCode = 1
    return
  }

  try {
    const result = await exportThemeCss({
      darkFile: options.darkFile,
      lightFile: options.lightFile,
      outDir: options.outDir,
    })

    console.log(`已生成变量文件: ${result.outFile}`)
    console.log(`默认输出文件名: ${DEFAULT_OUT_FILE_NAME}`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
