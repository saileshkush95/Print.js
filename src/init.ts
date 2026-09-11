import Browser from './browser'
import Modal from './modal'
import Pdf from './pdf'
import Html from './html'
import RawHtml from './raw-html'
import Image from './image'
import Json from './json'
import { isFallbackRequired, openFallbackWindow } from './fallback'
import type { Configuration, PrintParams, PrintType } from './types'

const printTypes: PrintType[] = ['pdf', 'html', 'image', 'json', 'raw-html']

const defaultParams = (): PrintParams => ({
  printable: null,
  fallbackPrintable: null,
  type: 'pdf',
  header: null,
  headerStyle: 'font-weight: 300;',
  footer: null,
  footerStyle: 'font-weight: 300;',
  maxWidth: 800,
  properties: null,
  gridHeaderStyle: 'font-weight: bold; padding: 5px; border: 1px solid #dddddd;',
  gridStyle: 'border: 1px solid lightgray; margin-bottom: -1px;',
  showModal: false,
  onError: (error) => { throw error },
  onLoadingStart: null,
  onLoadingEnd: null,
  onPrintDialogClose: () => {},
  onIncompatibleBrowser: () => {},
  modalMessage: 'Retrieving Document...',
  frameId: 'printJS',
  frameRemoveDelay: null,
  printableElement: null,
  documentTitle: 'Document',
  targetStyle: ['clear', 'display', 'width', 'min-width', 'height', 'min-height', 'max-height'],
  targetStyles: ['border', 'box', 'break', 'text-decoration'],
  ignoreElements: [],
  repeatTableHeader: true,
  css: null,
  style: null,
  scanStyles: true,
  base64: false,

  // Browsers that can't print from a hidden iframe (Safari, iOS, Android) open
  // the document in a new tab instead. Set it to true or false to force it on/off.
  fallbackToNewTab: 'auto',
  // Ask the new tab to open the print dialog by itself, instead of leaving
  // the document open for the user to print manually
  printFromNewTab: true,
  newTabPrintDelay: 1000,

  // A job that runs after an await has lost the click that started it, so the
  // browser blocks the tab. Rather than failing, offer it behind a button.
  promptWhenPopupBlocked: true,
  popupBlockedMessage: 'Your document is ready.',
  popupBlockedLabel: 'Open and print',
  printableWindow: null,
  onPdfOpen: null,

  // Deprecated
  font: 'TimesNewRoman',
  font_size: '12pt',
  honorMarginPadding: true,
  honorColor: false,
  imageStyle: 'max-width: 100%;'
})

export default {
  init (source?: Configuration | string, printType?: PrintType): void {
    const params = defaultParams()

    // Check if a printable document or object was supplied
    if (source === undefined) {
      throw new Error('printJS expects at least 1 attribute.')
    }

    // Process parameters
    switch (typeof source) {
      case 'string':
        params.printable = encodeURI(source)
        params.fallbackPrintable = params.printable
        params.type = printType || params.type
        break
      case 'object': {
        const args = source as Configuration

        params.printable = args.printable
        params.fallbackPrintable = typeof args.fallbackPrintable !== 'undefined' ? args.fallbackPrintable : params.printable
        params.fallbackPrintable = args.base64 ? `data:application/pdf;base64,${params.fallbackPrintable}` : params.fallbackPrintable

        for (const key of Object.keys(params) as (keyof PrintParams)[]) {
          if (key === 'printable' || key === 'fallbackPrintable') continue

          if (typeof args[key] !== 'undefined') {
            (params as any)[key] = args[key]
          }
        }
        break
      }
      default:
        throw new Error('Unexpected argument type! Expected "string" or "object", got ' + typeof source)
    }

    // Validate printable
    if (!params.printable) throw new Error('Missing printable information.')

    // Validate type
    if (!params.type || typeof params.type !== 'string' || printTypes.indexOf(params.type.toLowerCase() as PrintType) === -1) {
      throw new Error('Invalid print type. Available types are: pdf, html, image and json.')
    }

    // Decide up front how this job will be printed. Some browsers can't print the
    // iframe: Safari prints a blank page for pdf documents, mobile browsers have
    // no inline pdf viewer, and iOS prints the parent document instead of the
    // iframe contents. Those print from a new tab, which has to be opened while
    // the browser still considers us to be inside the user's click event
    // (otherwise it is blocked as a popup).
    const useFallbackWindow = isFallbackRequired(params)

    // Check if we are showing a feedback message to the user (useful for large files).
    // A pdf that opens in a tab is on screen straight away, so the modal would only flash.
    if (params.showModal && !(useFallbackWindow && params.type === 'pdf')) Modal.show(params)

    // Check for a print start hook function
    if (params.onLoadingStart) params.onLoadingStart()

    // To prevent duplication and issues, remove any used printFrame from the DOM
    const usedFrame = document.getElementById(params.frameId)

    if (usedFrame && usedFrame.parentNode) usedFrame.parentNode.removeChild(usedFrame)

    // Create a new iframe for the print job
    const printFrame = document.createElement('iframe')

    if (Browser.isFirefox()) {
      // Set the iframe to be is visible on the page (guaranteed by fixed position) but hidden using opacity 0, because
      // this works in Firefox. The height needs to be sufficient for some part of the document other than the PDF
      // viewer's toolbar to be visible in the page
      printFrame.setAttribute('style', 'width: 1px; height: 100px; position: fixed; left: 0; top: 0; opacity: 0; border-width: 0; margin: 0; padding: 0')
    } else if (Browser.isSafari()) {
      // Safari won't print a frame that was never rendered: a hidden, zero sized
      // iframe prints a blank page. Keep it on the page and give it the size of
      // the viewport, so the content is laid out as it would be on screen, but
      // make it invisible and click-through.
      printFrame.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; pointer-events: none; z-index: -1; border: 0; margin: 0; padding: 0')
    } else {
      // Hide the iframe in other browsers
      printFrame.setAttribute('style', 'visibility: hidden; height: 0; width: 0; position: absolute; border: 0')
    }

    // Set iframe element id
    printFrame.setAttribute('id', params.frameId)

    if (useFallbackWindow) {
      const fallbackWindow = openFallbackWindow()

      if (params.type === 'pdf') {
        Pdf.printInNewTab(params, fallbackWindow)
        return
      }

      params.printableWindow = fallbackWindow
    }

    // Check printable type
    switch (params.type) {
      case 'pdf':
        Pdf.print(params, printFrame)
        break
      case 'image':
        Image.print(params, printFrame)
        break
      case 'html':
        Html.print(params, printFrame)
        break
      case 'raw-html':
        RawHtml.print(params, printFrame)
        break
      case 'json':
        Json.print(params, printFrame)
        break
    }
  }
}
