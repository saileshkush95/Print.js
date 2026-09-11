import { describe, it, expect } from 'bun:test'
import Browser from '../../src/browser'

const UA = {
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1',
  iosFirefox: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  ipadOS: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
}

function withUserAgent<T> (ua: string, run: () => T, maxTouchPoints = 0): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: ua, maxTouchPoints },
    configurable: true,
    writable: true
  })

  try {
    return run()
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original)
  }
}

describe('Browser detection', () => {
  it('detects Firefox without InstallTrigger (removed in Firefox 128)', () => {
    expect(withUserAgent(UA.firefox, () => Browser.isFirefox())).toBe(true)
    expect(withUserAgent(UA.chrome, () => Browser.isFirefox())).toBe(false)
  })

  it('reads the Firefox major version from a user agent', () => {
    expect(Browser.getFirefoxMajorVersion(UA.firefox)).toBe(133)
    expect(Browser.getFirefoxMajorVersion(UA.chrome)).toBeUndefined()
  })

  it('does not report Chromium browsers as Safari', () => {
    expect(withUserAgent(UA.safari, () => Browser.isSafari())).toBe(true)
    expect(withUserAgent(UA.chrome, () => Browser.isSafari())).toBe(false)
    expect(withUserAgent(UA.edge, () => Browser.isSafari())).toBe(false)
    expect(withUserAgent(UA.androidChrome, () => Browser.isSafari())).toBe(false)
  })

  it('detects every iOS browser as iOS, including iPadOS with a desktop user agent', () => {
    expect(withUserAgent(UA.iosSafari, () => Browser.isIOS())).toBe(true)
    expect(withUserAgent(UA.iosChrome, () => Browser.isIOS())).toBe(true)
    expect(withUserAgent(UA.iosFirefox, () => Browser.isIOS())).toBe(true)
    expect(withUserAgent(UA.ipadOS, () => Browser.isIOS(), 5)).toBe(true)
    expect(withUserAgent(UA.safari, () => Browser.isIOS())).toBe(false)
  })

  it('detects Android', () => {
    expect(withUserAgent(UA.androidChrome, () => Browser.isAndroid())).toBe(true)
    expect(withUserAgent(UA.androidFirefox, () => Browser.isAndroid())).toBe(true)
    expect(withUserAgent(UA.chrome, () => Browser.isAndroid())).toBe(false)
  })
})

describe('Printing capabilities', () => {
  it('only prints pdf from an iframe where that actually works', () => {
    const fromIframe = (ua: string, touch = 0) => withUserAgent(ua, () => Browser.canPrintPdfFromIframe(), touch)

    expect(fromIframe(UA.chrome)).toBe(true)
    expect(fromIframe(UA.firefox)).toBe(true)
    expect(fromIframe(UA.edge)).toBe(true)

    expect(fromIframe(UA.safari)).toBe(false)
    expect(fromIframe(UA.iosSafari)).toBe(false)
    expect(fromIframe(UA.iosChrome)).toBe(false)
    expect(fromIframe(UA.androidChrome)).toBe(false)
    expect(fromIframe(UA.ipadOS, 5)).toBe(false)
  })

  it('only prints html from an iframe where that actually works', () => {
    const fromIframe = (ua: string, touch = 0) => withUserAgent(ua, () => Browser.canPrintHtmlFromIframe(), touch)

    expect(fromIframe(UA.chrome)).toBe(true)
    expect(fromIframe(UA.firefox)).toBe(true)
    expect(fromIframe(UA.safari)).toBe(true)
    expect(fromIframe(UA.androidChrome)).toBe(true)

    expect(fromIframe(UA.iosSafari)).toBe(false)
    expect(fromIframe(UA.iosChrome)).toBe(false)
  })

  it('knows which browsers need the print frame to be rendered', () => {
    expect(withUserAgent(UA.firefox, () => Browser.requiresRenderedFrame())).toBe(true)
    expect(withUserAgent(UA.safari, () => Browser.requiresRenderedFrame())).toBe(true)
    expect(withUserAgent(UA.chrome, () => Browser.requiresRenderedFrame())).toBe(false)
  })
})
