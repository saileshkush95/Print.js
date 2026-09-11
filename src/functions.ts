import Modal from './modal'
import Browser from './browser'
import type { PrintParams } from './types'

const asArray = (value: string | string[] | null | undefined): string[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function addWrapper (htmlData: string, params: PrintParams): string {
  const bodyStyle = 'font-family:' + params.font + ' !important; font-size: ' + params.font_size + ' !important; width:100%;'
  return '<div style="' + bodyStyle + '">' + htmlData + '</div>'
}

export function capitalizePrint (obj: string): string {
  return obj.charAt(0).toUpperCase() + obj.slice(1)
}

export function collectStyles (element: Element, params: PrintParams): string {
  const win = document.defaultView || window

  // String variable to hold styling for each element
  let elementStyle = ''

  // Loop over computed styles
  const styles = win.getComputedStyle(element, '')
  const targetStyle = asArray(params.targetStyle as string | string[])
  const targetStyles = asArray(params.targetStyles as string | string[])

  for (let key = 0; key < styles.length; key++) {
    // Check if style should be processed
    if (targetStyles.indexOf('*') !== -1 || targetStyle.indexOf(styles[key]) !== -1 || targetStylesMatch(targetStyles, styles[key])) {
      if (styles.getPropertyValue(styles[key])) elementStyle += styles[key] + ':' + styles.getPropertyValue(styles[key]) + ';'
    }
  }

  // Print friendly defaults (deprecated)
  elementStyle += 'max-width: ' + params.maxWidth + 'px !important; font-size: ' + params.font_size + ' !important;'

  return elementStyle
}

function targetStylesMatch (styles: string[], value: string): boolean {
  for (let i = 0; i < styles.length; i++) {
    if (typeof value === 'object' && (value as string).indexOf(styles[i]) !== -1) return true
  }
  return false
}

export function addHeader (printElement: HTMLElement, params: PrintParams): void {
  // Create the header container div
  const headerContainer = document.createElement('div')

  // Check if the header is text or raw html
  if (isRawHTML(params.header)) {
    headerContainer.innerHTML = params.header as string
  } else {
    // Create header element
    const headerElement = document.createElement('h1')

    // Create header text node
    const headerNode = document.createTextNode(params.header as string)

    // Build and style
    headerElement.appendChild(headerNode)
    headerElement.setAttribute('style', params.headerStyle)
    headerContainer.appendChild(headerElement)
  }

  printElement.insertBefore(headerContainer, printElement.childNodes[0])
}

export function addFooter (printElement: HTMLElement, params: PrintParams): void {
  // Create the footer container div
  const footerContainer = document.createElement('div')

  // Check if the footer is text or raw html
  if (isRawHTML(params.footer)) {
    footerContainer.innerHTML = params.footer as string
  } else {
    // Create footer element
    const footerElement = document.createElement('h1')

    // Create footer text node
    const footerNode = document.createTextNode(params.footer as string)

    // Build and style
    footerElement.appendChild(footerNode)
    footerElement.setAttribute('style', params.footerStyle)
    footerContainer.appendChild(footerElement)
  }

  // Footers go after every other node of the printable element
  printElement.appendChild(footerContainer)
}

export function cleanUp (params: PrintParams): void {
  // If we are showing a feedback message to user, remove it
  if (params.showModal) Modal.close()

  // Check for a finished loading hook function
  if (params.onLoadingEnd) params.onLoadingEnd()

  // If preloading pdf files, clean blob url
  if (params.showModal || params.onLoadingStart) window.URL.revokeObjectURL(params.printable)

  // Hold on to the frame of this job. Looking it up by id when the event fires
  // would let a listener left over from a previous job remove the frame of the
  // job running now, printing an empty document.
  const printFrame = document.getElementById(params.frameId)

  // Run onPrintDialogClose callback
  let event = 'mouseover'

  if (Browser.isChrome() || Browser.isFirefox() || Browser.isSafari()) {
    // Ps.: Firefox will require an extra click in the document to fire the focus event.
    event = 'focus'
  }

  let handled = false

  const handler = () => {
    // Make sure the event only happens once.
    if (handled) return
    handled = true
    window.removeEventListener(event, handler)

    params.onPrintDialogClose()

    // Remove this job's iframe from the DOM
    if (printFrame && printFrame.parentNode) {
      if (params.frameRemoveDelay) {
        setTimeout(() => printFrame.remove(), params.frameRemoveDelay)
      } else {
        printFrame.remove()
      }
    }
  }

  window.addEventListener(event, handler)
}

export function isRawHTML (raw: string | null): boolean {
  if (!raw) return false
  const regexHtml = new RegExp('<([A-Za-z][A-Za-z0-9]*)\\b[^>]*>(.*?)</\\1>')
  return regexHtml.test(raw)
}
