import Browser from './browser'
import type { PrintParams } from './types'

/*
|--------------------------------------------------------------------------
| New tab / new window fallback
|--------------------------------------------------------------------------
|
| Safari, iOS and Android can't print the hidden iframe Print.js builds:
| Safari prints a blank page for pdf documents, mobile browsers have no
| inline pdf viewer, and iOS prints the parent document instead of the
| iframe contents. For those we print from a separate tab instead.
|
| The tab has to be opened while the browser still considers us to be inside
| the user gesture (the click that called printJS), otherwise it is blocked
| as a popup. That is why it is opened up front, and only filled in later,
| once the document is ready.
|
*/

export function isFallbackRequired (params: PrintParams): boolean {
  // Allow the developer to force or disable the fallback
  if (params.fallbackToNewTab === true) return true
  if (params.fallbackToNewTab === false) return false

  return params.type === 'pdf'
    ? !Browser.canPrintPdfFromIframe()
    : !Browser.canPrintHtmlFromIframe()
}

export function openFallbackWindow (url?: string): Window | null {
  try {
    return window.open(url || '', '_blank')
  } catch (error) {
    return null
  }
}

export function isWindowBlocked (newWindow: Window | null): boolean {
  return !newWindow || newWindow.closed || typeof newWindow.closed === 'undefined'
}

export function popupBlockedError (): Error {
  return new Error('Print.js: unable to open a new tab. Please allow popups for this website, so documents can be printed on this browser.')
}
