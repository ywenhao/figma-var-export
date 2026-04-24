#!/usr/bin/env node

import { createRequire } from 'node:module'
import process from 'node:process'
import { cac } from 'cac'
import { DEFAULT_OUT_FILE_NAME, exportThemeCss, exportThemeModesCss } from '.'

interface CliOptions {
  darkFile?: string
  lightFile?: string
  mode?: string | string[]
  outDir?: string
  primaryMode?: string
}

const require = createRequire(import.meta.url)
const packageJson = require('../package.json') as { version: string }

const cli = cac('figma-var-export')

cli
  .option('--light-file <source>', 'Path or URL to the light token file')
  .option('--dark-file <source>', 'Path or URL to the dark token file')
  .option('--mode <name=source>', 'Mode name and token file path or URL. Repeat for multiple modes.')
  .option('--out-dir <dir>', 'Output directory, defaults to the current working directory')
  .option('--primary-mode <name>', 'Primary mode name. Defaults to Light, then Main, then the first mode.')
  .example('figma-var-export --light-file ./Light.tokens.json --dark-file ./Dark.tokens.json')
  .example('figma-var-export --mode Light=./Light.tokens.json --mode Dark=./Dark.tokens.json --mode Compact=./Compact.tokens.json')
  .example('figma-var-export --light-file https://example.com/light.json --dark-file https://example.com/dark.json --out-dir ./generated')
  .help()
  .version(packageJson.version)

void main()

/**
 * Parse command line arguments and run the export.
 */
async function main(): Promise<void> {
  const parsed = cli.parse()
  const options = parsed.options as CliOptions
  const modes = parseModeSources(options.mode)

  if (modes.length === 0 && (!options.lightFile || !options.darkFile)) {
    console.error('Please provide either repeated --mode arguments or both --light-file and --dark-file.')
    cli.outputHelp()
    process.exitCode = 1
    return
  }

  try {
    const result = modes.length > 0
      ? await exportThemeModesCss({
          modes,
          outDir: options.outDir,
          primaryModeName: options.primaryMode,
        })
      : await exportThemeCss({
          darkFile: options.darkFile!,
          lightFile: options.lightFile!,
          outDir: options.outDir,
        })

    console.log(`Generated variable file: ${result.outFile}`)
    console.log(`Default output filename: ${DEFAULT_OUT_FILE_NAME}`)
    console.log(`Primary mode: ${result.primaryModeName}`)
    console.log(`Available modes: ${result.modeNames.join(', ')}`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

/**
 * Parse repeated --mode entries.
 */
function parseModeSources(input: string | string[] | undefined): { name: string, source: string }[] {
  const entries = Array.isArray(input) ? input : input ? [input] : []

  return entries.map((entry) => {
    const separatorIndex = entry.indexOf('=')

    if (separatorIndex <= 0 || separatorIndex >= entry.length - 1) {
      throw new Error(
        'Invalid --mode value. Use the format <name>=<file-or-url>, for example Light=./Light.tokens.json',
      )
    }

    const name = entry.slice(0, separatorIndex).trim()
    const source = entry.slice(separatorIndex + 1).trim()

    if (!name || !source) {
      throw new Error(
        'Invalid --mode value. Use the format <name>=<file-or-url>, for example Light=./Light.tokens.json',
      )
    }

    return { name, source }
  })
}
