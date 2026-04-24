import { describe, expect, it } from 'vitest'
import { generateThemeCss, generateThemeModesCss, resolvePrimaryThemeModeName } from './generate'

const lightTokens = {
  Base: {
    Gray: {
      0: {
        $type: 'color',
        $value: '#f9fafb',
      },
    },
  },
}

const darkTokens = {
  Base: {
    Gray: {
      0: {
        $type: 'color',
        $value: '#101012',
      },
    },
  },
}

describe('generateThemeCss', () => {
  it('keeps Light as the primary mode and Dark as overrides', () => {
    const css = generateThemeCss(lightTokens, darkTokens)

    expect(css).toContain(':root {')
    expect(css).toContain('  --Base-Gray-0: #f9fafb;')
    expect(css).toContain('.dark {')
    expect(css).toContain('  --Base-Gray-0: #101012;')
  })
})

describe('generateThemeModesCss', () => {
  it('uses Light as the primary mode when present and emits multiple mode selectors', () => {
    const css = generateThemeModesCss([
      { name: 'Light', tokens: lightTokens },
      { name: 'Dark', tokens: darkTokens },
      {
        name: 'Compact Mode',
        tokens: {
          Base: {
            Gray: {
              0: {
                $type: 'color',
                $value: '#d4d4d8',
              },
            },
          },
        },
      },
    ])

    expect(css).toContain(':root {')
    expect(css).toContain('  --Base-Gray-0: #f9fafb;')
    expect(css).toContain('.dark {')
    expect(css).toContain('.compact-mode {')
  })

  it('falls back to Main as the primary mode when Light is missing', () => {
    const css = generateThemeModesCss([
      {
        name: 'Main',
        tokens: {
          Base: {
            Gray: {
              0: {
                $type: 'color',
                $value: '#ffffff',
              },
            },
          },
        },
      },
      { name: 'Dark', tokens: darkTokens },
    ])

    expect(css).toContain(':root {')
    expect(css).toContain('  --Base-Gray-0: #ffffff;')
    expect(css).toContain('.dark {')
    expect(css).not.toContain('.main {')
  })
})

describe('resolvePrimaryThemeModeName', () => {
  it('prefers Light, then Main, then the first mode', () => {
    expect(resolvePrimaryThemeModeName(['Dark', 'Light', 'Compact'])).toBe('Light')
    expect(resolvePrimaryThemeModeName(['Dark', 'Main', 'Compact'])).toBe('Main')
    expect(resolvePrimaryThemeModeName(['Dark', 'Compact'])).toBe('Dark')
  })

  it('uses an explicit primary mode when provided', () => {
    expect(
      resolvePrimaryThemeModeName(['Light', 'Dark', 'Compact'], { primaryModeName: 'Compact' }),
    ).toBe('Compact')
  })
})
