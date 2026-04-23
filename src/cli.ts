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
  .option('--light-file <source>', 'Path or URL to the light token file')
  .option('--dark-file <source>', 'Path or URL to the dark token file')
  .option('--out-dir <dir>', 'Output directory, defaults to the current working directory')
  .example('figma-var-export --light-file ./Light.tokens.json --dark-file ./Dark.tokens.json')
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

  if (!options.lightFile || !options.darkFile) {
    console.error('Please provide both --light-file and --dark-file arguments.')
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

    console.log(`Generated variable file: ${result.outFile}`)
    console.log(`Default output filename: ${DEFAULT_OUT_FILE_NAME}`)
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
