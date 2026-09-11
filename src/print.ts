import Browser from './browser'
import { cleanUp } from './functions'
import { isWindowBlocked, popupBlockedError } from './fallback'
import type { PrintParams } from './types'

const Print = {
  send: (params: PrintParams, printFrame: HTMLIFrameElement): void => {
    // Browsers that can't print from an iframe (iOS) print from a separate
    // window, opened by init while the user gesture was still active
    if (params.printableWindow) {
      sendToWindow(params)
      return
    }

    if (params.type === 'pdf') {
      sendPdfToFrame(params, printFrame)
      return
    }

    sendDocumentToFrame(params, printFrame)
  }
}

function sendPdfToFrame (params: PrintParams, printFrame: HTMLIFrameElement): void {
  let handled = false

  const handleLoad = () => {
    // Some browsers fire load more than once for the same document
    if (handled) return
    handled = true

    // Add a delay for Firefox. In my tests, 1000ms was sufficient but 100ms was not
    const firefoxVersion = Browser.getFirefoxMajorVersion()

    if (Browser.isFirefox() && firefoxVersion !== undefined && firefoxVersion < 110) {
      setTimeout(() => performPrint(printFrame, params), 1000)
    } else {
      performPrint(printFrame, params)
    }
  }

  // The handler has to be attached before the frame is added to the page:
  // Safari starts loading the document right away and would fire load before
  // we had a chance to listen for it
  printFrame.onload = handleLoad

  // The pdf url is set before the frame enters the page, so the first load
  // event is the document we want
  document.getElementsByTagName('body')[0].appendChild(printFrame)
}

// html / image / json / raw-html documents are written into the frame instead of
// being passed through srcdoc: a srcdoc document replaces the frame's initial
// about:blank document asynchronously, and printing whichever of the two won the
// race is how content ended up missing in Safari.
function sendDocumentToFrame (params: PrintParams, printFrame: HTMLIFrameElement): void {
  document.getElementsByTagName('body')[0].appendChild(printFrame)

  const printDocument = (printFrame.contentWindow && printFrame.contentWindow.document) ||
    printFrame.contentDocument

  if (!printDocument) {
    params.onError(new Error('Print.js: unable to access the print frame document.'))
    cleanUp(params)
    return
  }

  try {
    printDocument.open()
    printDocument.write('<html><head>' + documentHead(params) + '</head><body></body></html>')
    printDocument.close()
  } catch (error) {
    params.onError(error)
    cleanUp(params)
    return
  }

  // Append printable element to the iframe body
  appendPrintable(printDocument, params)

  // Add custom style
  if (params.style) {
    const style = printDocument.createElement('style')
    style.innerHTML = params.style
    printDocument.head.appendChild(style)
  }

  // Wait for the css files and images the document needs, then print
  waitForStyles(printDocument)
    .then(() => loadImages(Array.from(printDocument.getElementsByTagName('img'))))
    .then(() => performPrint(printFrame, params))
}

function documentHead (params: PrintParams): string {
  let head = '<title>' + params.documentTitle + '</title>'

  if (params.css) {
    const files = Array.isArray(params.css) ? params.css : [params.css]
    files.forEach(file => {
      head += '<link rel="stylesheet" href="' + file + '">'
    })
  }

  return head
}

// Print html / image / json documents from a separate window, for browsers
// where printing an iframe prints the parent document instead (iOS)
function sendToWindow (params: PrintParams): void {
  const printWindow = params.printableWindow as Window

  if (isWindowBlocked(printWindow)) {
    cleanUp(params)
    params.onError(popupBlockedError())
    return
  }

  try {
    const printDocument = printWindow.document

    printDocument.open()
    printDocument.write('<html><head>' + documentHead(params) + '</head><body></body></html>')
    printDocument.close()

    // The printable element belongs to our document, so it has to be adopted
    // by the new window before it can be attached to it
    appendPrintable(printDocument, params)

    // Add custom style
    if (params.style) {
      const style = printDocument.createElement('style')
      style.innerHTML = params.style
      printDocument.head.appendChild(style)
    }

    // Close the tab once the print dialog is dismissed, when the browser tells us about it
    printWindow.onafterprint = () => {
      printWindow.onafterprint = null
      printWindow.close()
    }

    waitForStyles(printDocument)
      .then(() => loadImages(Array.from(printDocument.getElementsByTagName('img'))))
      .then(() => performWindowPrint(printWindow, params))
  } catch (error) {
    cleanUp(params)
    params.onError(error)
  }
}

function performWindowPrint (printWindow: Window, params: PrintParams): void {
  params.onIncompatibleBrowser()

  // Give the new document a moment to render before opening the print dialog
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      // The document is still open in the tab, so the user can print it manually
      params.onError(error)
    } finally {
      cleanUp(params)
    }
  }, 500)
}

function performPrint (iframeElement: HTMLIFrameElement, params: PrintParams): void {
  // Give the browser a moment to render the document before asking for the
  // print dialog. cleanUp only runs afterwards: it registers the listener that
  // removes the frame, and removing it any earlier prints an empty document.
  setTimeout(() => {
    try {
      iframeElement.focus()

      const printWindow = iframeElement.contentWindow

      if (!printWindow) {
        throw new Error('Print.js: the print frame was removed before the document could be printed.')
      }

      // If Edge or IE, try catch with execCommand
      if (Browser.isEdge() || Browser.isIE()) {
        try {
          (printWindow as any).document.execCommand('print', false, null)
        } catch (e) {
          printWindow.print()
        }
      } else {
        // Other browsers
        printWindow.print()
      }
    } catch (error) {
      params.onError(error)
    } finally {
      const firefoxVersion = Browser.getFirefoxMajorVersion()

      if (Browser.isFirefox() && firefoxVersion !== undefined && firefoxVersion < 110) {
        // Move the iframe element off-screen and make it invisible
        iframeElement.style.visibility = 'hidden'
        iframeElement.style.left = '-1px'
      }

      cleanUp(params)
    }
  }, 1000)
}

// Moves the printable element into the document we are about to print. Adopting
// the node keeps live state (canvas bitmaps, form values) that a copy would lose,
// and importNode is there for browsers that refuse to adopt across documents.
function appendPrintable (printDocument: Document, params: PrintParams): void {
  const printable = params.printableElement as HTMLElement

  try {
    printDocument.body.appendChild(printable)
  } catch (error) {
    printDocument.body.appendChild(printDocument.importNode(printable, true))
  }
}

// Style sheets the user asked for have to be in place before the dialog opens,
// or the document prints unstyled
function waitForStyles (printDocument: Document, timeout = 2000): Promise<unknown> {
  const links = Array.from(printDocument.getElementsByTagName('link'))
    .filter(link => link.rel === 'stylesheet')

  if (links.length === 0) return Promise.resolve()

  const loaded = Promise.all(links.map(link => new Promise<void>(resolve => {
    if ((link as any).sheet) return resolve()

    link.addEventListener('load', () => resolve())
    link.addEventListener('error', () => resolve())
  })))

  // Never let a slow or missing style sheet hold the print job hostage
  return Promise.race([loaded, new Promise(resolve => setTimeout(resolve, timeout))])
}

// How long a single image may hold up the print dialog
const IMAGE_TIMEOUT = 10000

function loadImages (images: HTMLImageElement[]): Promise<unknown[]> {
  return Promise.all(images.map(image => {
    if (image.src && image.src !== window.location.href) {
      return loadImage(image)
    }

    return Promise.resolve()
  }))
}

function loadImage (image: HTMLImageElement): Promise<void> {
  return new Promise(resolve => {
    // An image that already finished, successfully or not, is not worth waiting for.
    // Ps.: a broken image reports complete === true with naturalWidth === 0, which is
    // why waiting for a width here used to wait forever and the dialog never opened.
    if (image.complete) return resolve()

    let settled = false

    const done = () => {
      if (settled) return
      settled = true

      clearTimeout(timer)
      image.removeEventListener('load', done)
      image.removeEventListener('error', done)

      resolve()
    }

    image.addEventListener('load', done)
    image.addEventListener('error', done)

    // Never let one slow image hold the print job hostage
    const timer = setTimeout(done, IMAGE_TIMEOUT)
  })
}

export default Print
