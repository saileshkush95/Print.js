import Print from './print'
import { cleanUp } from './functions'
import { isWindowBlocked, popupBlockedError } from './fallback'
import type { PrintParams } from './types'

export default {
  print: (params: PrintParams, printFrame: HTMLIFrameElement): void => {
    // Check if we have base64 data
    if (params.base64) {
      const bytesArray = Uint8Array.from(atob(cleanBase64(params.printable)), c => c.charCodeAt(0))
      createBlobAndPrint(params, printFrame, bytesArray)
      return
    }

    // Format pdf url
    params.printable = formatPdfUrl(params.printable)

    // Get the file through a http request (Preload)
    const req = new window.XMLHttpRequest()
    req.responseType = 'arraybuffer'

    req.addEventListener('error', () => {
      cleanUp(params)
      params.onError(req.statusText, req)

      // Since we don't have a pdf document available, we will stop the print job
    })

    req.addEventListener('load', () => {
      // Check for errors
      if ([200, 201].indexOf(req.status) === -1) {
        cleanUp(params)
        params.onError(req.statusText, req)

        // Since we don't have a pdf document available, we will stop the print job
        return
      }

      // Print requested document
      createBlobAndPrint(params, printFrame, req.response)
    })

    req.open('GET', params.printable, true)
    req.send()
  },

  // Used by browsers that can't print a pdf from an iframe (Safari, iOS, Android, IE).
  // The document is opened in a tab that was created by the caller, while still
  // inside the user gesture, and printed from there.
  printInNewTab: (params: PrintParams, newWindow: Window | null): void => {
    if (isWindowBlocked(newWindow)) {
      cleanUp(params)
      params.onError(popupBlockedError())
      return
    }

    const tab = newWindow as Window
    let url: string

    if (params.base64) {
      const bytesArray = Uint8Array.from(atob(cleanBase64(params.printable)), c => c.charCodeAt(0))
      url = window.URL.createObjectURL(new window.Blob([bytesArray], { type: 'application/pdf' }))
    } else {
      url = formatPdfUrl(params.fallbackPrintable || params.printable)
    }

    try {
      tab.location.href = url
      tab.focus()

      // Ask the new tab to open the print dialog on its own, so the user doesn't
      // have to reach for the browser's print button. Safari and iOS may ignore
      // it (we are no longer inside the click that started the job), and that is
      // fine: the document is already there for the user to print manually.
      if (params.printFromNewTab) requestPrint(tab, params)
    } catch (error) {
      cleanUp(params)
      params.onError(error)
      return
    }

    cleanUp(params)

    // Documented callback for "pdf opened in a new tab"
    if (params.onPdfOpen) params.onPdfOpen()

    // Let the developer know the document was opened in a tab instead of printed directly
    params.onIncompatibleBrowser()
  }
}

function requestPrint (newWindow: Window, params: PrintParams): void {
  let requested = false

  const print = () => {
    // Only ever open one print dialog, no matter which of the triggers below fires first
    if (requested) return
    requested = true

    try {
      newWindow.focus()
      newWindow.print()
    } catch (error) {
      // The document is open in the tab, the user can still print it manually
    }
  }

  // The pdf needs to be rendered before the print dialog is opened, otherwise
  // some browsers print a blank page
  try {
    newWindow.addEventListener('load', () => setTimeout(print, params.newTabPrintDelay))
  } catch (error) {
    // Cross origin document, we can only rely on the timeout below
  }

  // Not every browser fires load for a pdf document
  setTimeout(print, params.newTabPrintDelay + 1000)
}

function cleanBase64 (base64: string): string {
  // If the base64 string starts with `data:application/pdf;base64,`, atob would
  // throw an error, so we only keep the content after the comma
  return base64.indexOf(',') !== -1 ? base64.split(',')[1] : base64
}

function formatPdfUrl (url: string): string {
  return /^(blob|http|\/\/|data:)/i.test(url)
    ? url
    : window.location.origin + (url.charAt(0) !== '/' ? '/' + url : url)
}

function createBlobAndPrint (params: PrintParams, printFrame: HTMLIFrameElement, data: BlobPart): void {
  // Pass response or base64 data to a blob and create a local object url
  const localPdf = window.URL.createObjectURL(new window.Blob([data], { type: 'application/pdf' }))

  // Set iframe src with pdf document url
  printFrame.setAttribute('src', localPdf)

  Print.send(params, printFrame)
}
