declare const InstallTrigger: unknown | undefined

const userAgent = (): string => (typeof navigator !== 'undefined' && navigator.userAgent) || ''

const Browser = {
  // Firefox 1.0+
  // Ps.: InstallTrigger was removed in Firefox 128, so we can't rely on it alone anymore.
  isFirefox: (): boolean => {
    return typeof InstallTrigger !== 'undefined' || /firefox|fxios/i.test(userAgent())
  },
  getFirefoxMajorVersion: (ua?: string): number | undefined => {
    const match = (ua || userAgent()).toLowerCase().match(/firefox\/(\S+)/)

    if (match) {
      return match[1].split('.').map(x => parseInt(x))[0]
    }

    return undefined
  },
  // Internet Explorer 6-11
  isIE: (): boolean => {
    return userAgent().indexOf('MSIE') !== -1 ||
      !!(typeof document !== 'undefined' && (document as any).documentMode)
  },
  // Edge 20+ (legacy, EdgeHTML based)
  isEdge: (): boolean => {
    return !Browser.isIE() && !!(window as any).StyleMedia
  },
  // Chrome 1+
  isChrome: (context: any = typeof window !== 'undefined' ? window : {}): boolean => {
    return !!context.chrome
  },
  // Any Chromium based browser (Chrome, Edge, Opera, Brave, Chrome on iOS...)
  isChromium: (): boolean => {
    return /chrome|chromium|crios|edg\//i.test(userAgent())
  },
  // Safari only. Every Chromium user agent also contains "Safari", so those must be excluded.
  isSafari: (): boolean => {
    const ua = userAgent()
    return /safari/i.test(ua) && !/chrome|chromium|crios|fxios|android|edg\//i.test(ua)
  },
  // IOS Chrome
  isIOSChrome: (): boolean => {
    return userAgent().toLowerCase().indexOf('crios') !== -1
  },
  // iPhone / iPad / iPod. iPadOS reports itself as a Mac, hence the touch points check.
  isIOS: (): boolean => {
    if (/iphone|ipad|ipod/i.test(userAgent())) return true

    return typeof navigator !== 'undefined' &&
      /macintosh/i.test(userAgent()) &&
      navigator.maxTouchPoints > 1
  },
  isAndroid: (): boolean => {
    return /android/i.test(userAgent())
  },
  isMobile: (): boolean => {
    return Browser.isIOS() || Browser.isAndroid() || /mobile/i.test(userAgent())
  },

  /*
  |--------------------------------------------------------------------------
  | Printing capabilities
  |--------------------------------------------------------------------------
  |
  | Not every browser can print the hidden iframe we build. When it can't, we
  | fall back to opening the document in a new tab, so the user can print it
  | using the browser's own print button.
  |
  */

  // Safari renders a pdf inside an iframe, but printing it results in a blank
  // page. iOS (every browser there is Safari under the hood) and Android have
  // no inline pdf viewer at all, so the iframe stays empty.
  canPrintPdfFromIframe: (): boolean => {
    return !Browser.isIE() && !Browser.isSafari() && !Browser.isIOS() && !Browser.isAndroid()
  },

  // On iOS, printing from an iframe prints the parent document instead of the
  // iframe contents, so html/image/json jobs need their own window there.
  canPrintHtmlFromIframe: (): boolean => {
    return !Browser.isIOS()
  },

  // Firefox and Safari refuse to print a frame that was never rendered: a
  // hidden, zero sized iframe prints a blank page on both.
  requiresRenderedFrame: (): boolean => {
    return Browser.isFirefox() || Browser.isSafari()
  }
}

export default Browser
