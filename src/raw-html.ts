import Print from './print'
import { addHeader, addFooter } from './functions'
import type { PrintParams } from './types'

export default {
  print: (params: PrintParams, printFrame: HTMLIFrameElement): void => {
    // Create printable element (container)
    params.printableElement = document.createElement('div')
    params.printableElement.setAttribute('style', 'width:100%')

    // Set our raw html as the printable element inner html content
    params.printableElement.innerHTML = params.printable

    // Add header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // Add footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // Print html contents
    Print.send(params, printFrame)
  }
}
