import { collectStyles, addHeader, addFooter } from './functions'
import Print from './print'
import type { PrintParams } from './types'

export default {
  print: (params: PrintParams, printFrame: HTMLIFrameElement): void => {
    // Get the DOM printable element(s): an id, an element, or a list of either
    // (a NodeList from querySelectorAll, or an array)
    const printElements = resolveElements(params.printable)

    // Check if the element exists
    if (printElements.length === 0) {
      const error = new Error('Invalid HTML element id: ' + params.printable)
      window.console.error(error.message)
      params.onError(error)
      return
    }

    if (printElements.length === 1) {
      // Clone the target element including its children (if available)
      params.printableElement = cloneElement(printElements[0], params) as HTMLElement
    } else {
      // Several elements are printed inside one container, in the given order
      const container = document.createElement('div')
      printElements.forEach(element => container.appendChild(cloneElement(element, params)))
      params.printableElement = container
    }

    // Add header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // Add footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // Print html element contents
    Print.send(params, printFrame)
  }
}

function cloneElement (element: Node, params: PrintParams): Node {
  // Clone the main node (if not already inside the recursion process)
  const clone = element.cloneNode()
  const ignore = Array.isArray(params.ignoreElements)
    ? params.ignoreElements
    : [params.ignoreElements as string]

  // Loop over and process the children elements / nodes (including text nodes)
  const childNodesArray = Array.prototype.slice.call(element.childNodes) as Node[]

  for (let i = 0; i < childNodesArray.length; i++) {
    // Check if we are skipping the current element
    if (ignore.indexOf((childNodesArray[i] as HTMLElement).id) !== -1) {
      continue
    }

    // Clone the child element
    const clonedChild = cloneElement(childNodesArray[i], params)

    // Attach the cloned child to the cloned parent node
    clone.appendChild(clonedChild)
  }

  // Get all styling for print element (for nodes of type element only)
  if (params.scanStyles && element.nodeType === 1) {
    (clone as HTMLElement).setAttribute('style', collectStyles(element as Element, params))
  }

  // Check if the element needs any state processing (copy user input data).
  // The state is written to attributes as well, so it survives being moved or
  // copied into the print document.
  switch ((element as HTMLElement).tagName) {
    case 'SELECT': {
      const select = element as HTMLSelectElement
      const clonedSelect = clone as HTMLSelectElement

      clonedSelect.value = select.value

      // Keep the selection when the node is serialized or imported
      Array.from(clonedSelect.options).forEach(option => {
        if (option.value === select.value) {
          option.setAttribute('selected', 'selected')
        } else {
          option.removeAttribute('selected')
        }
      })
      break
    }
    case 'INPUT': {
      const input = element as HTMLInputElement
      const clonedInput = clone as HTMLInputElement

      clonedInput.value = input.value
      clonedInput.checked = input.checked
      clonedInput.setAttribute('value', input.value)

      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          clonedInput.setAttribute('checked', 'checked')
        } else {
          clonedInput.removeAttribute('checked')
        }
      }
      break
    }
    case 'TEXTAREA': {
      const textarea = element as HTMLTextAreaElement

      ;(clone as HTMLTextAreaElement).value = textarea.value
      clone.textContent = textarea.value
      break
    }
    case 'CANVAS': {
      const canvas = element as HTMLCanvasElement

      // A canvas bitmap is lost as soon as the node is copied, so the drawing
      // is turned into an image the print document can render on its own
      try {
        const image = document.createElement('img')
        image.src = canvas.toDataURL()
        image.setAttribute('style', (clone as HTMLElement).getAttribute('style') || '')
        image.width = canvas.width
        image.height = canvas.height
        return image
      } catch (error) {
        // Tainted canvas (cross origin drawing): fall back to copying the bitmap
        const context = (clone as HTMLCanvasElement).getContext('2d')
        if (context) context.drawImage(canvas, 0, 0)
      }
      break
    }
  }

  return clone
}

// Accepts an element id, an element, or a NodeList / array of either
function resolveElements (printable: any): HTMLElement[] {
  if (!printable) return []

  if (isHtmlElement(printable)) return [printable as HTMLElement]

  if (typeof printable === 'string') {
    const element = document.getElementById(printable)
    return element ? [element] : []
  }

  if (isElementList(printable)) {
    return Array.prototype.slice.call(printable)
      .map((item: any) => resolveElements(item)[0])
      .filter(Boolean) as HTMLElement[]
  }

  return []
}

function isElementList (printable: any): boolean {
  return typeof printable === 'object' && typeof printable.length === 'number'
}

function isHtmlElement (printable: any): boolean {
  // Check if element is instance of HTMLElement or has nodeType === 1 (for elements in iframe)
  return typeof printable === 'object' && printable && (printable instanceof HTMLElement || printable.nodeType === 1)
}
