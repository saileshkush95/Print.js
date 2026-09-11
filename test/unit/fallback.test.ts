import { describe, it, expect } from 'bun:test'
import { isFallbackRequired, isWindowBlocked } from '../../src/fallback'
import type { PrintParams } from '../../src/types'

const params = (overrides: Partial<PrintParams>): PrintParams => ({ type: 'pdf', fallbackToNewTab: 'auto', ...overrides } as PrintParams)

describe('isFallbackRequired()', () => {
  it('is forced on and off by fallbackToNewTab', () => {
    expect(isFallbackRequired(params({ fallbackToNewTab: true }))).toBe(true)
    expect(isFallbackRequired(params({ fallbackToNewTab: false }))).toBe(false)
  })

  it('decides per browser when set to auto', () => {
    // happy-dom reports a Chrome-like user agent, which can print from an iframe
    expect(isFallbackRequired(params({ type: 'pdf' }))).toBe(false)
    expect(isFallbackRequired(params({ type: 'html' }))).toBe(false)
  })
})

describe('isWindowBlocked()', () => {
  it('treats null and closed windows as blocked', () => {
    expect(isWindowBlocked(null)).toBe(true)
    expect(isWindowBlocked({ closed: true } as Window)).toBe(true)
    expect(isWindowBlocked({ closed: false } as Window)).toBe(false)
  })
})
