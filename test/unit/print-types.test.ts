import { describe, it, expect, beforeEach } from 'bun:test'
import Html from '../../src/html'
import Image from '../../src/image'
import RawHtml from '../../src/raw-html'
import Pdf from '../../src/pdf'
import Print from '../../src/print'
import Modal from '../../src/modal'
import type { PrintParams } from '../../src/types'

const params = (overrides: Partial<PrintParams> = {}): PrintParams => ({
  printable: null,
  type: 'html',
  header: null,
  headerStyle: 'font-weight: 300;',
  footer: null,
  footerStyle: 'font-weight: 300;',
  maxWidth: 800,
  scanStyles: false,
  ignoreElements: [],
  targetStyle: [],
  targetStyles: [],
  imageStyle: 'max-width: 100%;',
  font: 'TimesNewRoman',
  font_size: '12pt',
  documentTitle: 'Document',
  modalMessage: 'Retrieving Document...',
  printableElement: null,
  printableWindow: null,
  frameId: 'printJS',
  showModal: false,
  promptWhenPopupBlocked: true,
  popupBlockedMessage: 'Your document is ready.',
  popupBlockedLabel: 'Open and print',
  onPrintDialogClose: () => {},
  onError: (e: any) => { throw e },
  ...overrides
} as PrintParams)

const frame = () => document.createElement('iframe')

describe('modules', () => {
  it('all expose a print method', () => {
    expect(typeof Html.print).toBe('function')
    expect(typeof Image.print).toBe('function')
    expect(typeof RawHtml.print).toBe('function')
    expect(typeof Pdf.print).toBe('function')
    expect(typeof Pdf.printInNewTab).toBe('function')
    expect(typeof Print.send).toBe('function')
  })
})

describe('Html.print()', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('clones the target element by id', () => {
    document.body.innerHTML = '<div id="target"><p>keep</p></div>'
    const p = params({ printable: 'target' })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('keep')
  })

  it('accepts an element instead of an id', () => {
    const element = document.createElement('div')
    element.innerHTML = '<span>from element</span>'
    document.body.appendChild(element)

    const p = params({ printable: element })
    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('from element')
  })

  it('skips the ids listed in ignoreElements', () => {
    document.body.innerHTML = '<div id="target"><p id="skip">drop</p><p>keep</p></div>'
    const p = params({ printable: 'target', ignoreElements: ['skip'] })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).not.toContain('drop')
    expect(p.printableElement!.innerHTML).toContain('keep')
  })

  it('carries over the value of form fields', () => {
    document.body.innerHTML = '<div id="target"><input id="field"><textarea id="area"></textarea></div>'
    ;(document.getElementById('field') as HTMLInputElement).value = 'typed'
    ;(document.getElementById('area') as HTMLTextAreaElement).value = 'notes'

    const p = params({ printable: 'target' })
    Html.print(p, frame())

    const input = p.printableElement!.querySelector('input') as HTMLInputElement
    const area = p.printableElement!.querySelector('textarea') as HTMLTextAreaElement
    expect(input.value).toBe('typed')
    expect(area.value).toBe('notes')
  })
})

describe('Html.print() with several elements', () => {
  it('accepts a NodeList', () => {
    document.body.innerHTML = '<p class="row">one</p><p class="row">two</p>'
    const p = params({ printable: document.querySelectorAll('.row') })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('one')
    expect(p.printableElement!.innerHTML).toContain('two')
  })

  it('accepts an array of ids and elements', () => {
    document.body.innerHTML = '<p id="first">one</p><p id="second">two</p>'
    const p = params({ printable: ['first', document.getElementById('second')] })

    Html.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('one')
    expect(p.printableElement!.innerHTML).toContain('two')
  })

  it('reports an empty list through onError', () => {
    let error: any = null
    Html.print(params({ printable: [], onError: (e: any) => { error = e } }), frame())

    expect(String(error)).toContain('Invalid HTML element id')
  })
})

describe('Image.print()', () => {
  it('accepts a single image and an array of images', () => {
    const one = params({ printable: 'a.jpg', type: 'image' })
    Image.print(one, frame())
    expect(one.printableElement!.querySelectorAll('img').length).toBe(1)

    const many = params({ printable: ['a.jpg', 'b.jpg', 'c.jpg'], type: 'image' })
    Image.print(many, frame())
    expect(many.printableElement!.querySelectorAll('img').length).toBe(3)
  })

  it('adds the header and footer around the images', () => {
    const p = params({ printable: 'a.jpg', type: 'image', header: 'Top', footer: 'Bottom' })
    Image.print(p, frame())

    expect(p.printableElement!.firstElementChild!.textContent).toBe('Top')
    expect(p.printableElement!.lastElementChild!.textContent).toBe('Bottom')
  })
})

describe('RawHtml.print()', () => {
  it('uses the raw string as the printable content', () => {
    const p = params({ printable: '<h3>raw</h3>', type: 'raw-html' })
    RawHtml.print(p, frame())

    expect(p.printableElement!.innerHTML).toContain('<h3>raw</h3>')
  })
})

describe('Pdf.printInNewTab()', () => {
  it('sends the document to the tab and reports it as opened', () => {
    const navigated: string[] = []
    let pdfOpened = false
    let incompatible = false

    const tab = {
      closed: false,
      focus () {},
      addEventListener () {},
      print () {},
      location: { set href (value: string) { navigated.push(value) } }
    } as unknown as Window

    const p = params({
      printable: 'docs/file.pdf',
      type: 'pdf',
      printFromNewTab: false,
      onPdfOpen: () => { pdfOpened = true },
      onIncompatibleBrowser: () => { incompatible = true }
    })

    Pdf.printInNewTab(p, tab)

    expect(navigated[0]).toContain('/docs/file.pdf')
    expect(pdfOpened).toBe(true)
    expect(incompatible).toBe(true)
  })
})

describe('a blocked popup', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('offers the document behind a button instead of failing', () => {
    let error: any = null
    const p = params({ printable: 'file.pdf', type: 'pdf', onError: (e: any) => { error = e } })

    Pdf.printInNewTab(p, null)

    const button = document.getElementById('printJS-Open')
    expect(button).not.toBeNull()
    expect(button!.textContent).toBe('Open and print')
    expect(document.getElementById('printJS-Modal')!.textContent).toContain('Your document is ready.')
    expect(error).toBeNull()
  })

  it('uses the wording the developer chose', () => {
    Pdf.printInNewTab(params({
      printable: 'file.pdf',
      type: 'pdf',
      popupBlockedMessage: 'Ihr Dokument ist fertig.',
      popupBlockedLabel: 'Öffnen'
    }), null)

    expect(document.getElementById('printJS-Open')!.textContent).toBe('Öffnen')
  })

  it('reports an error instead when the prompt is turned off', () => {
    let error: any = null

    Pdf.printInNewTab(params({
      printable: 'file.pdf',
      type: 'pdf',
      promptWhenPopupBlocked: false,
      onError: (e: any) => { error = e }
    }), null)

    expect(String(error)).toContain('allow popups')
    expect(document.getElementById('printJS-Open')).toBeNull()
  })
})

describe('Modal', () => {
  it('opens and closes', () => {
    Modal.show(params({ modalMessage: 'Loading...' }))
    expect(document.getElementById('printJS-Modal')).not.toBeNull()

    Modal.close()
    expect(document.getElementById('printJS-Modal')).toBeNull()
  })
})
